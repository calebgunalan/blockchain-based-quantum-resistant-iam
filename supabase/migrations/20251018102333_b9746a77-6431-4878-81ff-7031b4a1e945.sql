-- Phase 3: IAM Enhancements - JIT Access & Adaptive MFA Tables

-- ============================================================================
-- JIT (Just-In-Time) Access Sessions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.jit_access_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  access_level TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID,
  revoke_reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'expired', 'revoked', 'denied')),
  request_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  approval_notes TEXT,
  auto_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for JIT access queries
CREATE INDEX idx_jit_sessions_user_id ON public.jit_access_sessions(user_id);
CREATE INDEX idx_jit_sessions_status ON public.jit_access_sessions(status);
CREATE INDEX idx_jit_sessions_expires_at ON public.jit_access_sessions(expires_at);
CREATE INDEX idx_jit_sessions_resource ON public.jit_access_sessions(resource_type, resource_id);

-- RLS policies for JIT access sessions
ALTER TABLE public.jit_access_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own JIT sessions"
  ON public.jit_access_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create JIT access requests"
  ON public.jit_access_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all JIT sessions"
  ON public.jit_access_sessions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Admins can manage JIT sessions"
  ON public.jit_access_sessions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::system_role));

-- ============================================================================
-- Adaptive MFA Events Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.adaptive_mfa_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('login_attempt', 'mfa_challenge', 'mfa_success', 'mfa_failure', 'risk_assessment')),
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  mfa_method TEXT CHECK (mfa_method IN ('none', 'sms', 'email', 'totp', 'hardware_token', 'biometric', 'multi_approver')),
  required_mfa_level TEXT NOT NULL CHECK (required_mfa_level IN ('none', 'basic', 'enhanced', 'critical')),
  context_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  risk_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  device_fingerprint TEXT,
  ip_address INET,
  geolocation JSONB,
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  challenge_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for MFA event queries
CREATE INDEX idx_mfa_events_user_id ON public.adaptive_mfa_events(user_id);
CREATE INDEX idx_mfa_events_risk_level ON public.adaptive_mfa_events(risk_level);
CREATE INDEX idx_mfa_events_created_at ON public.adaptive_mfa_events(created_at);
CREATE INDEX idx_mfa_events_event_type ON public.adaptive_mfa_events(event_type);

-- RLS policies for MFA events
ALTER TABLE public.adaptive_mfa_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own MFA events"
  ON public.adaptive_mfa_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert MFA events"
  ON public.adaptive_mfa_events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all MFA events"
  ON public.adaptive_mfa_events
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::system_role));

-- ============================================================================
-- MFA Challenge Tokens Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.mfa_challenge_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('sms', 'email', 'totp', 'hardware', 'biometric')),
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for MFA challenge tokens
CREATE INDEX idx_mfa_tokens_user_id ON public.mfa_challenge_tokens(user_id);
CREATE INDEX idx_mfa_tokens_expires_at ON public.mfa_challenge_tokens(expires_at);

-- RLS policies for MFA challenge tokens
ALTER TABLE public.mfa_challenge_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own MFA tokens"
  ON public.mfa_challenge_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage MFA tokens"
  ON public.mfa_challenge_tokens
  FOR ALL
  USING (true);

-- ============================================================================
-- JIT Access Policies Configuration Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.jit_access_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  auto_approve BOOLEAN NOT NULL DEFAULT false,
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  approver_role TEXT,
  max_duration INTERVAL NOT NULL DEFAULT '4 hours'::interval,
  allowed_access_levels TEXT[] NOT NULL,
  policy_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(resource_type, risk_level)
);

-- RLS policies for JIT access policies
ALTER TABLE public.jit_access_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active JIT policies"
  ON public.jit_access_policies
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage JIT policies"
  ON public.jit_access_policies
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::system_role));

-- ============================================================================
-- Triggers for Updated At
-- ============================================================================

CREATE TRIGGER update_jit_access_sessions_updated_at
  BEFORE UPDATE ON public.jit_access_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jit_access_policies_updated_at
  BEFORE UPDATE ON public.jit_access_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Default JIT Access Policies
-- ============================================================================

INSERT INTO public.jit_access_policies (resource_type, risk_level, auto_approve, requires_approval, max_duration, allowed_access_levels, created_by, policy_rules)
VALUES 
  ('documents', 'low', true, false, '24 hours'::interval, ARRAY['read'], '00000000-0000-0000-0000-000000000000', '{"description": "Auto-approve read access to low-risk documents"}'),
  ('documents', 'medium', false, true, '12 hours'::interval, ARRAY['read', 'write'], '00000000-0000-0000-0000-000000000000', '{"description": "Require approval for medium-risk document access"}'),
  ('documents', 'high', false, true, '4 hours'::interval, ARRAY['read'], '00000000-0000-0000-0000-000000000000', '{"description": "Limited access to high-risk documents", "approver_role": "admin"}'),
  ('admin_panel', 'critical', false, true, '2 hours'::interval, ARRAY['read'], '00000000-0000-0000-0000-000000000000', '{"description": "Critical admin access requires approval", "approver_role": "admin"}'),
  ('privileged_accounts', 'critical', false, true, '1 hour'::interval, ARRAY['use'], '00000000-0000-0000-0000-000000000000', '{"description": "Privileged account access", "requires_mfa": true}');

-- ============================================================================
-- Functions for JIT Access Management
-- ============================================================================

-- Function to auto-expire JIT sessions
CREATE OR REPLACE FUNCTION public.expire_jit_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.jit_access_sessions
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'active'
    AND expires_at < now();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;

-- Function to check if user has active JIT access
CREATE OR REPLACE FUNCTION public.has_jit_access(
  _user_id UUID,
  _resource_type TEXT,
  _resource_id TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.jit_access_sessions
    WHERE user_id = _user_id
      AND resource_type = _resource_type
      AND resource_id = _resource_id
      AND status = 'active'
      AND expires_at > now()
  );
$$;