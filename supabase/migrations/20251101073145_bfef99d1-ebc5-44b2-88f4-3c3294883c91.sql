-- Phase 3: Quantum Resistance Performance & Migration
-- Performance optimization tables and key rotation mechanism

-- ============================================
-- 3.1: Quantum Key Cache for Performance
-- ============================================

CREATE TABLE IF NOT EXISTS quantum_key_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_type TEXT NOT NULL CHECK (key_type IN ('signing', 'encryption', 'kem')),
  public_key BYTEA NOT NULL,
  private_key_encrypted BYTEA NOT NULL,
  algorithm TEXT NOT NULL,
  cache_hit_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_quantum_key_cache_user_type ON quantum_key_cache(user_id, key_type) WHERE is_active = true;
CREATE INDEX idx_quantum_key_cache_expires ON quantum_key_cache(expires_at) WHERE is_active = true;

ALTER TABLE quantum_key_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cached keys" ON quantum_key_cache
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own cached keys" ON quantum_key_cache
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cached keys" ON quantum_key_cache
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- 3.2: Key Rotation History
-- ============================================

CREATE TABLE IF NOT EXISTS quantum_key_rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_key_id TEXT NOT NULL,
  new_key_id TEXT NOT NULL,
  rotation_reason TEXT NOT NULL CHECK (rotation_reason IN ('scheduled', 'compromised', 'manual', 'policy')),
  old_algorithm TEXT NOT NULL,
  new_algorithm TEXT NOT NULL,
  rotation_type TEXT NOT NULL CHECK (rotation_type IN ('standard', 'emergency', 'migration')),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  initiated_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_key_rotations_user ON quantum_key_rotations(user_id);
CREATE INDEX idx_key_rotations_completed ON quantum_key_rotations(completed_at DESC);

ALTER TABLE quantum_key_rotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rotation history" ON quantum_key_rotations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all rotations" ON quantum_key_rotations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 3.3: Batch Signature Verification Logs
-- ============================================

CREATE TABLE IF NOT EXISTS quantum_batch_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT NOT NULL,
  signature_count INTEGER NOT NULL,
  verification_time_ms INTEGER NOT NULL,
  success_count INTEGER NOT NULL,
  failure_count INTEGER NOT NULL,
  algorithm TEXT NOT NULL,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  verified_by UUID REFERENCES auth.users(id),
  batch_metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_batch_verifications_batch ON quantum_batch_verifications(batch_id);
CREATE INDEX idx_batch_verifications_verified ON quantum_batch_verifications(verified_at DESC);

ALTER TABLE quantum_batch_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view batch verifications" ON quantum_batch_verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 3.4: PQC Migration Tracking
-- ============================================

CREATE TABLE IF NOT EXISTS pqc_migration_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_algorithm TEXT NOT NULL,
  target_algorithm TEXT NOT NULL,
  migration_stage TEXT NOT NULL CHECK (
    migration_stage IN ('pending', 'dual_mode', 'transitioning', 'completed', 'failed')
  ),
  dual_mode_enabled BOOLEAN DEFAULT false,
  legacy_keys_count INTEGER DEFAULT 0,
  pqc_keys_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  migration_metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_pqc_migration_user ON pqc_migration_status(user_id);
CREATE INDEX idx_pqc_migration_stage ON pqc_migration_status(migration_stage);

ALTER TABLE pqc_migration_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own migration status" ON pqc_migration_status
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own migration status" ON pqc_migration_status
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all migration status" ON pqc_migration_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 3.5: Performance Metrics
-- ============================================

CREATE TABLE IF NOT EXISTS quantum_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL CHECK (
    metric_type IN ('key_generation', 'signing', 'verification', 'encryption', 'decryption', 'key_exchange')
  ),
  algorithm TEXT NOT NULL,
  operation_time_ms NUMERIC(10,2) NOT NULL,
  key_size_bytes INTEGER,
  data_size_bytes INTEGER,
  cache_hit BOOLEAN DEFAULT false,
  batch_size INTEGER DEFAULT 1,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_perf_metrics_type ON quantum_performance_metrics(metric_type, algorithm);
CREATE INDEX idx_perf_metrics_recorded ON quantum_performance_metrics(recorded_at DESC);
CREATE INDEX idx_perf_metrics_user ON quantum_performance_metrics(user_id);

ALTER TABLE quantum_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view performance metrics" ON quantum_performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- Helper Functions
-- ============================================

-- Clean expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_quantum_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE quantum_key_cache
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get cache statistics
CREATE OR REPLACE FUNCTION get_quantum_cache_stats(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_cached_keys', COUNT(*),
    'active_keys', COUNT(*) FILTER (WHERE is_active = true),
    'expired_keys', COUNT(*) FILTER (WHERE expires_at < NOW()),
    'total_cache_hits', COALESCE(SUM(cache_hit_count), 0),
    'avg_cache_hits_per_key', COALESCE(AVG(cache_hit_count), 0),
    'cache_hit_rate', CASE 
      WHEN SUM(cache_hit_count) > 0 
      THEN (SUM(cache_hit_count)::FLOAT / COUNT(*)::FLOAT)
      ELSE 0 
    END
  ) INTO stats
  FROM quantum_key_cache
  WHERE user_id = user_id_param;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record key rotation
CREATE OR REPLACE FUNCTION record_key_rotation(
  user_id_param UUID,
  old_key_id_param TEXT,
  new_key_id_param TEXT,
  rotation_reason_param TEXT,
  old_algorithm_param TEXT,
  new_algorithm_param TEXT,
  rotation_type_param TEXT DEFAULT 'standard'
)
RETURNS UUID AS $$
DECLARE
  rotation_id UUID;
BEGIN
  INSERT INTO quantum_key_rotations (
    user_id,
    old_key_id,
    new_key_id,
    rotation_reason,
    old_algorithm,
    new_algorithm,
    rotation_type,
    initiated_by
  ) VALUES (
    user_id_param,
    old_key_id_param,
    new_key_id_param,
    rotation_reason_param,
    old_algorithm_param,
    new_algorithm_param,
    rotation_type_param,
    auth.uid()
  ) RETURNING id INTO rotation_id;
  
  RETURN rotation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get performance statistics
CREATE OR REPLACE FUNCTION get_quantum_performance_stats(
  algorithm_param TEXT DEFAULT NULL,
  hours_back INTEGER DEFAULT 24
)
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
  cutoff_time TIMESTAMPTZ;
BEGIN
  cutoff_time := NOW() - (hours_back || ' hours')::INTERVAL;
  
  SELECT jsonb_build_object(
    'total_operations', COUNT(*),
    'avg_operation_time_ms', ROUND(AVG(operation_time_ms)::NUMERIC, 2),
    'min_operation_time_ms', MIN(operation_time_ms),
    'max_operation_time_ms', MAX(operation_time_ms),
    'cache_hit_rate', ROUND(
      (COUNT(*) FILTER (WHERE cache_hit = true)::FLOAT / NULLIF(COUNT(*)::FLOAT, 0) * 100)::NUMERIC, 
      2
    ),
    'by_operation_type', (
      SELECT jsonb_object_agg(
        metric_type,
        jsonb_build_object(
          'count', count,
          'avg_time_ms', ROUND(avg_time::NUMERIC, 2)
        )
      )
      FROM (
        SELECT 
          metric_type,
          COUNT(*) as count,
          AVG(operation_time_ms) as avg_time
        FROM quantum_performance_metrics
        WHERE recorded_at >= cutoff_time
          AND (algorithm_param IS NULL OR algorithm = algorithm_param)
        GROUP BY metric_type
      ) subq
    )
  ) INTO stats
  FROM quantum_performance_metrics
  WHERE recorded_at >= cutoff_time
    AND (algorithm_param IS NULL OR algorithm = algorithm_param);
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;