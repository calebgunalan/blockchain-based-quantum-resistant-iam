
-- ============================================================
-- Novel Algorithm Supporting Tables
-- ============================================================

-- 1. ZK Nullifiers (prevents FZKRP proof replay attacks)
CREATE TABLE IF NOT EXISTS public.zk_nullifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nullifier_hash TEXT NOT NULL UNIQUE,
  proof_id TEXT NOT NULL,
  user_id UUID,
  algorithm TEXT NOT NULL DEFAULT 'FZKRP-v1',
  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);
ALTER TABLE public.zk_nullifiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view all nullifiers" ON public.zk_nullifiers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::system_role));
CREATE POLICY "System insert nullifiers" ON public.zk_nullifiers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::system_role));

-- 2. ABAC Policies
CREATE TABLE IF NOT EXISTS public.abac_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  subject_filter JSONB NOT NULL DEFAULT '{}',
  resource_filter JSONB NOT NULL DEFAULT '{}',
  environment_conditions JSONB NOT NULL DEFAULT '{}',
  decision TEXT NOT NULL CHECK (decision IN ('permit', 'deny', 'indeterminate')),
  priority INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.abac_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ABAC policies" ON public.abac_policies FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::system_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::system_role));
CREATE POLICY "Authenticated read active policies" ON public.abac_policies FOR SELECT TO authenticated USING (is_active = true);

-- 3. Access Reviews (Identity Governance)
CREATE TABLE IF NOT EXISTS public.access_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name TEXT NOT NULL,
  reviewer_id UUID NOT NULL,
  user_id UUID NOT NULL,
  permission_id UUID REFERENCES public.permissions(id),
  resource_type TEXT,
  access_description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revoked', 'escalated')),
  decision_at TIMESTAMPTZ,
  decision_notes TEXT,
  sod_violation BOOLEAN DEFAULT false,
  risk_score INTEGER DEFAULT 0,
  campaign_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.access_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage access reviews" ON public.access_reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::system_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::system_role));
CREATE POLICY "Reviewers see assigned reviews" ON public.access_reviews FOR SELECT TO authenticated USING (reviewer_id = auth.uid());
CREATE POLICY "Users see own reviews" ON public.access_reviews FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 4. BASC Session References (Blockchain-Anchored Session Continuity)
CREATE TABLE IF NOT EXISTS public.basc_session_refs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  block_ref TEXT NOT NULL,
  action_hash TEXT NOT NULL,
  sequence_number BIGINT NOT NULL DEFAULT 0,
  prev_block_ref TEXT,
  is_genesis BOOLEAN DEFAULT false,
  gap_detected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS basc_session_refs_session_id_idx ON public.basc_session_refs(session_id);
CREATE INDEX IF NOT EXISTS basc_session_refs_user_id_idx ON public.basc_session_refs(user_id);
ALTER TABLE public.basc_session_refs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own BASC refs" ON public.basc_session_refs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins see all BASC refs" ON public.basc_session_refs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::system_role));
CREATE POLICY "Users insert own BASC refs" ON public.basc_session_refs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 5. Incident Playbook Executions
CREATE TABLE IF NOT EXISTS public.incident_playbook_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_name TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  trigger_data JSONB DEFAULT '{}',
  actions_taken JSONB NOT NULL DEFAULT '[]',
  affected_user_id UUID,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'executed' CHECK (status IN ('executed', 'partial', 'failed', 'pending_review')),
  execution_time_ms INTEGER,
  blockchain_tx_id TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID
);
ALTER TABLE public.incident_playbook_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage playbook executions" ON public.incident_playbook_executions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::system_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::system_role));

-- 6. Performance Benchmarks
CREATE TABLE IF NOT EXISTS public.performance_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  algorithm TEXT NOT NULL,
  operation TEXT NOT NULL,
  time_ms DOUBLE PRECISION NOT NULL,
  key_size_bytes INTEGER,
  throughput_ops_per_sec DOUBLE PRECISION,
  memory_bytes BIGINT,
  success BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  run_by UUID
);
ALTER TABLE public.performance_benchmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated read benchmarks" ON public.performance_benchmarks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert benchmarks" ON public.performance_benchmarks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::system_role));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_access_reviews_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER access_reviews_updated_at BEFORE UPDATE ON public.access_reviews FOR EACH ROW EXECUTE FUNCTION public.update_access_reviews_updated_at();
CREATE TRIGGER abac_policies_updated_at BEFORE UPDATE ON public.abac_policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
