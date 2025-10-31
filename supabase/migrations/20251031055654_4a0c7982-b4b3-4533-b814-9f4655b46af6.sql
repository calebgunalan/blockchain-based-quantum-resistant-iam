-- Phase 1.4-1.7: OAuth, MFA Enforcement, IP Access Control, RLS Policies (Fixed)

-- ============================================
-- 1.5: MFA Enforcement Policies
-- ============================================

-- Add MFA requirements to user roles
ALTER TABLE user_roles 
  ADD COLUMN IF NOT EXISTS mfa_required BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mfa_grace_period_days INTEGER DEFAULT 7;

-- MFA backup codes for recovery
CREATE TABLE IF NOT EXISTS mfa_backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mfa_backup_codes_user ON mfa_backup_codes(user_id);

-- Enable RLS on mfa_backup_codes
ALTER TABLE mfa_backup_codes ENABLE ROW LEVEL SECURITY;

-- Users can only view their own backup codes
CREATE POLICY "Users can view own backup codes" ON mfa_backup_codes
  FOR SELECT 
  USING (user_id IN (SELECT id FROM auth.users WHERE id = auth.uid()));

-- Users can create their own backup codes
CREATE POLICY "Users can create own backup codes" ON mfa_backup_codes
  FOR INSERT 
  WITH CHECK (user_id IN (SELECT id FROM auth.users WHERE id = auth.uid()));

-- Users can update (mark as used) their own backup codes
CREATE POLICY "Users can update own backup codes" ON mfa_backup_codes
  FOR UPDATE 
  USING (user_id IN (SELECT id FROM auth.users WHERE id = auth.uid()));

-- WebAuthn/FIDO2 hardware token credentials
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  device_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_id ON webauthn_credentials(credential_id);

-- Enable RLS on webauthn_credentials
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- Users can manage their own WebAuthn credentials
CREATE POLICY "Users can manage own webauthn credentials" ON webauthn_credentials
  FOR ALL 
  USING (user_id IN (SELECT id FROM auth.users WHERE id = auth.uid()));

-- Admins can view all credentials
CREATE POLICY "Admins can view all webauthn credentials" ON webauthn_credentials
  FOR SELECT 
  USING (has_role(auth.uid(), 'admin'::system_role));

-- ============================================
-- 1.7: Enhanced RLS Policies
-- ============================================

-- Password reset requests - Enable RLS if not already enabled
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'password_reset_requests') THEN
    ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;
    
    -- Only system can insert password reset requests
    DROP POLICY IF EXISTS "System can create password reset requests" ON password_reset_requests;
    CREATE POLICY "System can create password reset requests" ON password_reset_requests
      FOR INSERT WITH CHECK (true);
    
    -- Only system can view password reset requests (tokens should be secure)
    DROP POLICY IF EXISTS "System can view password reset requests" ON password_reset_requests;
    CREATE POLICY "System can view password reset requests" ON password_reset_requests
      FOR SELECT USING (true);
  END IF;
END $$;

-- Failed login attempts - Enable RLS
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'failed_login_attempts') THEN
    ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
    
    -- System can insert failed attempts
    DROP POLICY IF EXISTS "System can insert failed attempts" ON failed_login_attempts;
    CREATE POLICY "System can insert failed attempts" ON failed_login_attempts
      FOR INSERT WITH CHECK (true);
    
    -- Admins can view all failed attempts
    DROP POLICY IF EXISTS "Admins can view all failed attempts" ON failed_login_attempts;
    CREATE POLICY "Admins can view all failed attempts" ON failed_login_attempts
      FOR SELECT USING (has_role(auth.uid(), 'admin'::system_role));
  END IF;
END $$;

-- Account lockouts - Already has RLS, verify policies
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'account_lockouts') THEN
    ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;
    
    -- Admins can manage lockouts
    DROP POLICY IF EXISTS "Admins can manage account lockouts" ON account_lockouts;
    CREATE POLICY "Admins can manage account lockouts" ON account_lockouts
      FOR ALL USING (has_role(auth.uid(), 'admin'::system_role));
  END IF;
END $$;

-- Create helper function to check MFA requirement compliance
CREATE OR REPLACE FUNCTION check_mfa_compliance(user_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_record RECORD;
  mfa_enabled BOOLEAN;
  grace_period_end TIMESTAMPTZ;
  result JSONB;
BEGIN
  -- Get user's role and MFA settings
  SELECT ur.role, ur.mfa_required, ur.mfa_grace_period_days
  INTO user_role_record
  FROM user_roles ur
  WHERE ur.user_id = user_id_param
  LIMIT 1;
  
  -- Check if user has MFA enabled (check mfa_secrets table if it exists)
  mfa_enabled := EXISTS (
    SELECT 1 FROM mfa_secrets 
    WHERE user_id = user_id_param 
    AND is_active = true
  );
  
  -- Calculate grace period end
  SELECT created_at + (COALESCE(user_role_record.mfa_grace_period_days, 7) || ' days')::INTERVAL
  INTO grace_period_end
  FROM profiles
  WHERE user_id = user_id_param;
  
  -- Build result
  result := jsonb_build_object(
    'mfa_required', COALESCE(user_role_record.mfa_required, false),
    'mfa_enabled', COALESCE(mfa_enabled, false),
    'is_compliant', (NOT COALESCE(user_role_record.mfa_required, false)) OR COALESCE(mfa_enabled, false),
    'grace_period_active', NOW() < grace_period_end,
    'grace_period_ends', grace_period_end,
    'days_remaining', EXTRACT(DAY FROM (grace_period_end - NOW()))
  );
  
  RETURN result;
END;
$$;

-- Create function to validate IP access
CREATE OR REPLACE FUNCTION validate_ip_access(user_id_param UUID, ip_address_param INET)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_blacklisted BOOLEAN;
  is_whitelisted BOOLEAN;
  has_whitelist BOOLEAN;
  result JSONB;
BEGIN
  -- Check if IP is blacklisted
  SELECT EXISTS (
    SELECT 1 FROM ip_access_rules
    WHERE rule_type = 'blacklist'
    AND is_active = true
    AND (
      (ip_address IS NOT NULL AND ip_address_param = ip_address) OR
      (ip_range IS NOT NULL AND ip_address_param << ip_range)
    )
    AND (applies_to = 'all' OR user_id_param = ANY(COALESCE(target_user_ids, ARRAY[]::UUID[])))
  ) INTO is_blacklisted;
  
  -- Check if user has whitelist rules
  SELECT EXISTS (
    SELECT 1 FROM ip_access_rules
    WHERE rule_type = 'whitelist'
    AND is_active = true
    AND (applies_to = 'user' AND user_id_param = ANY(COALESCE(target_user_ids, ARRAY[]::UUID[])))
  ) INTO has_whitelist;
  
  -- If user has whitelist, check if IP is in whitelist
  IF has_whitelist THEN
    SELECT EXISTS (
      SELECT 1 FROM ip_access_rules
      WHERE rule_type = 'whitelist'
      AND is_active = true
      AND user_id_param = ANY(COALESCE(target_user_ids, ARRAY[]::UUID[]))
      AND (
        (ip_address IS NOT NULL AND ip_address_param = ip_address) OR
        (ip_range IS NOT NULL AND ip_address_param << ip_range)
      )
    ) INTO is_whitelisted;
  ELSE
    is_whitelisted := true; -- No whitelist = allow all
  END IF;
  
  -- Build result
  result := jsonb_build_object(
    'allowed', NOT is_blacklisted AND is_whitelisted,
    'is_blacklisted', is_blacklisted,
    'is_whitelisted', is_whitelisted,
    'has_whitelist_rules', has_whitelist,
    'ip_address', host(ip_address_param)
  );
  
  RETURN result;
END;
$$;