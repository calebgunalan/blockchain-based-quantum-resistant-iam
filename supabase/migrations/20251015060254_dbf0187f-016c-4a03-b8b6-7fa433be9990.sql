-- Blockchain Infrastructure Tables

-- User DIDs (Decentralized Identifiers)
CREATE TABLE IF NOT EXISTS public.user_dids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  did TEXT NOT NULL UNIQUE,
  did_document JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Blockchain Blocks
CREATE TABLE IF NOT EXISTS public.blockchain_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_index INTEGER NOT NULL UNIQUE,
  block_hash TEXT NOT NULL UNIQUE,
  previous_hash TEXT NOT NULL,
  merkle_root TEXT NOT NULL,
  miner_id UUID REFERENCES auth.users(id),
  nonce INTEGER NOT NULL,
  difficulty INTEGER NOT NULL,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Blockchain Permissions
CREATE TABLE IF NOT EXISTS public.blockchain_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  granter_id UUID NOT NULL REFERENCES auth.users(id),
  grantee_id UUID NOT NULL REFERENCES auth.users(id),
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  blockchain_txn_id TEXT NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Blockchain Audit Logs
CREATE TABLE IF NOT EXISTS public.blockchain_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  transaction_id TEXT NOT NULL UNIQUE,
  block_hash TEXT,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  quantum_signature TEXT,
  integrity_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_dids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_dids
CREATE POLICY "Users can view their own DID"
  ON public.user_dids FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own DID"
  ON public.user_dids FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own DID"
  ON public.user_dids FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all DIDs"
  ON public.user_dids FOR SELECT
  USING (has_role(auth.uid(), 'admin'::system_role));

-- RLS Policies for blockchain_blocks
CREATE POLICY "Everyone can view blockchain blocks"
  ON public.blockchain_blocks FOR SELECT
  USING (true);

CREATE POLICY "System can create blockchain blocks"
  ON public.blockchain_blocks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage blockchain blocks"
  ON public.blockchain_blocks FOR ALL
  USING (has_role(auth.uid(), 'admin'::system_role));

-- RLS Policies for blockchain_permissions
CREATE POLICY "Users can view permissions they granted"
  ON public.blockchain_permissions FOR SELECT
  USING (auth.uid() = granter_id OR auth.uid() = grantee_id);

CREATE POLICY "Users can create permissions they grant"
  ON public.blockchain_permissions FOR INSERT
  WITH CHECK (auth.uid() = granter_id);

CREATE POLICY "Users can update permissions they granted"
  ON public.blockchain_permissions FOR UPDATE
  USING (auth.uid() = granter_id);

CREATE POLICY "Admins can view all blockchain permissions"
  ON public.blockchain_permissions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::system_role));

-- RLS Policies for blockchain_audit_logs
CREATE POLICY "Users can view their own blockchain audit logs"
  ON public.blockchain_audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all blockchain audit logs"
  ON public.blockchain_audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "System can insert blockchain audit logs"
  ON public.blockchain_audit_logs FOR INSERT
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_user_dids_user_id ON public.user_dids(user_id);
CREATE INDEX idx_user_dids_did ON public.user_dids(did);
CREATE INDEX idx_blockchain_blocks_index ON public.blockchain_blocks(block_index);
CREATE INDEX idx_blockchain_blocks_hash ON public.blockchain_blocks(block_hash);
CREATE INDEX idx_blockchain_permissions_granter ON public.blockchain_permissions(granter_id);
CREATE INDEX idx_blockchain_permissions_grantee ON public.blockchain_permissions(grantee_id);
CREATE INDEX idx_blockchain_permissions_active ON public.blockchain_permissions(is_active) WHERE is_active = true;
CREATE INDEX idx_blockchain_audit_logs_user ON public.blockchain_audit_logs(user_id);
CREATE INDEX idx_blockchain_audit_logs_txn ON public.blockchain_audit_logs(transaction_id);
CREATE INDEX idx_blockchain_audit_logs_resource ON public.blockchain_audit_logs(resource);

-- Trigger for updated_at
CREATE TRIGGER update_user_dids_updated_at
  BEFORE UPDATE ON public.user_dids
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.user_dids IS 'Decentralized Identifiers (DIDs) for quantum-resistant identity';
COMMENT ON TABLE public.blockchain_blocks IS 'Blockchain blocks with quantum-resistant hashing';
COMMENT ON TABLE public.blockchain_permissions IS 'Immutable permission records on blockchain';
COMMENT ON TABLE public.blockchain_audit_logs IS 'Complete audit trail stored on blockchain';