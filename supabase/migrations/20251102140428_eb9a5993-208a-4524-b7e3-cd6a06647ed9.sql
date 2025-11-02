-- Phase 4: Production Readiness - Monitoring & System Health

-- System health monitoring
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_health_metrics_time ON system_health_metrics(recorded_at DESC);
CREATE INDEX idx_health_metrics_name ON system_health_metrics(metric_name);
CREATE INDEX idx_health_metrics_severity ON system_health_metrics(severity);

-- Performance benchmarks
CREATE TABLE IF NOT EXISTS performance_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benchmark_name TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  duration_ms NUMERIC NOT NULL,
  throughput NUMERIC,
  success_rate NUMERIC,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_benchmarks_name ON performance_benchmarks(benchmark_name);
CREATE INDEX idx_benchmarks_time ON performance_benchmarks(recorded_at DESC);

-- Incident logs
CREATE TABLE IF NOT EXISTS incident_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  affected_systems TEXT[],
  status TEXT CHECK (status IN ('open', 'investigating', 'resolved', 'closed')) DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incidents_status ON incident_logs(status);
CREATE INDEX idx_incidents_severity ON incident_logs(severity);
CREATE INDEX idx_incidents_time ON incident_logs(created_at DESC);

-- System alerts
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  message TEXT NOT NULL,
  source TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_acknowledged ON system_alerts(acknowledged);
CREATE INDEX idx_alerts_severity ON system_alerts(severity);
CREATE INDEX idx_alerts_time ON system_alerts(created_at DESC);

-- Uptime monitoring
CREATE TABLE IF NOT EXISTS uptime_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  is_up BOOLEAN NOT NULL,
  error_message TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_uptime_service ON uptime_checks(service_name);
CREATE INDEX idx_uptime_time ON uptime_checks(checked_at DESC);

-- Enable RLS
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE uptime_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin only for most tables
CREATE POLICY "Admins can view health metrics" ON system_health_metrics
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert health metrics" ON system_health_metrics
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view benchmarks" ON performance_benchmarks
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert benchmarks" ON performance_benchmarks
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage incidents" ON incident_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view alerts" ON system_alerts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert alerts" ON system_alerts
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can acknowledge alerts" ON system_alerts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view uptime" ON uptime_checks
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert uptime" ON uptime_checks
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Helper function to get system health summary
CREATE OR REPLACE FUNCTION get_system_health_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  health_summary JSONB;
BEGIN
  SELECT jsonb_build_object(
    'blockchain', (
      SELECT jsonb_build_object(
        'total_blocks', COUNT(*),
        'latest_block', MAX(block_number),
        'avg_block_time', ROUND(AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY block_number))))::NUMERIC, 2)
      )
      FROM blockchain_blocks
      WHERE created_at > NOW() - INTERVAL '1 hour'
    ),
    'p2p_network', (
      SELECT jsonb_build_object(
        'active_peers', COUNT(*) FILTER (WHERE status = 'active'),
        'avg_reputation', ROUND(AVG(reputation_score)::NUMERIC, 2),
        'total_peers', COUNT(*)
      )
      FROM p2p_peers
    ),
    'mempool', (
      SELECT jsonb_build_object(
        'pending_transactions', COUNT(*),
        'total_fees', COALESCE(SUM(transaction_fee), 0)
      )
      FROM blockchain_mempool
      WHERE status = 'pending'
    ),
    'quantum_security', (
      SELECT jsonb_build_object(
        'active_keys', COUNT(*) FILTER (WHERE is_active = true),
        'cache_hit_rate', ROUND((AVG(cache_hit_count) / NULLIF(COUNT(*), 0) * 100)::NUMERIC, 2)
      )
      FROM quantum_key_cache
    ),
    'alerts', (
      SELECT jsonb_build_object(
        'unacknowledged', COUNT(*) FILTER (WHERE acknowledged = false),
        'critical', COUNT(*) FILTER (WHERE severity = 'critical' AND acknowledged = false)
      )
      FROM system_alerts
      WHERE created_at > NOW() - INTERVAL '24 hours'
    )
  ) INTO health_summary;
  
  RETURN health_summary;
END;
$$;

-- Function to record system metric
CREATE OR REPLACE FUNCTION record_system_metric(
  metric_name_param TEXT,
  metric_value_param NUMERIC,
  metric_unit_param TEXT DEFAULT NULL,
  severity_param TEXT DEFAULT 'info',
  metadata_param JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  metric_id UUID;
BEGIN
  INSERT INTO system_health_metrics (
    metric_name,
    metric_value,
    metric_unit,
    severity,
    metadata
  ) VALUES (
    metric_name_param,
    metric_value_param,
    metric_unit_param,
    severity_param,
    metadata_param
  ) RETURNING id INTO metric_id;
  
  RETURN metric_id;
END;
$$;

-- Trigger for incident updates
CREATE OR REPLACE FUNCTION update_incident_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER incident_updated_at
  BEFORE UPDATE ON incident_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_incident_updated_at();