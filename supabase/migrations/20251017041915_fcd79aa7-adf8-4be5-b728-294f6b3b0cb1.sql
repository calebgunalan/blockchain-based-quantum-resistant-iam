-- Cross-Chain Identity Tables

-- Table for storing cross-chain identities
CREATE TABLE IF NOT EXISTS cross_chain_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_did TEXT NOT NULL UNIQUE,
  identity_data JSONB NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for storing linked blockchain networks
CREATE TABLE IF NOT EXISTS cross_chain_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_did TEXT NOT NULL REFERENCES cross_chain_identities(primary_did) ON DELETE CASCADE,
  network TEXT NOT NULL,
  network_address TEXT NOT NULL,
  network_identity JSONB NOT NULL,
  is_verified BOOLEAN DEFAULT true,
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(primary_did, network)
);

-- Table for storing bridge proofs
CREATE TABLE IF NOT EXISTS cross_chain_bridge_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_did TEXT NOT NULL REFERENCES cross_chain_identities(primary_did) ON DELETE CASCADE,
  source_network TEXT NOT NULL,
  target_network TEXT NOT NULL,
  identity_hash TEXT NOT NULL,
  proof TEXT NOT NULL,
  signature TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours')
);

-- Table for storing cross-chain messages
CREATE TABLE IF NOT EXISTS cross_chain_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_did TEXT NOT NULL REFERENCES cross_chain_identities(primary_did) ON DELETE CASCADE,
  message_id TEXT NOT NULL UNIQUE,
  source_network TEXT NOT NULL,
  target_network TEXT NOT NULL,
  message_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  signature TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE cross_chain_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_chain_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_chain_bridge_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_chain_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cross_chain_identities
CREATE POLICY "Users can view their own cross-chain identity"
  ON cross_chain_identities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cross-chain identity"
  ON cross_chain_identities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cross-chain identity"
  ON cross_chain_identities FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for cross_chain_networks
CREATE POLICY "Users can view their own linked networks"
  ON cross_chain_networks FOR SELECT
  USING (
    primary_did IN (
      SELECT primary_did FROM cross_chain_identities 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can link their own networks"
  ON cross_chain_networks FOR INSERT
  WITH CHECK (
    primary_did IN (
      SELECT primary_did FROM cross_chain_identities 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for cross_chain_bridge_proofs
CREATE POLICY "Users can view their own bridge proofs"
  ON cross_chain_bridge_proofs FOR SELECT
  USING (
    primary_did IN (
      SELECT primary_did FROM cross_chain_identities 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own bridge proofs"
  ON cross_chain_bridge_proofs FOR INSERT
  WITH CHECK (
    primary_did IN (
      SELECT primary_did FROM cross_chain_identities 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for cross_chain_messages
CREATE POLICY "Users can view their own cross-chain messages"
  ON cross_chain_messages FOR SELECT
  USING (
    primary_did IN (
      SELECT primary_did FROM cross_chain_identities 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own cross-chain messages"
  ON cross_chain_messages FOR INSERT
  WITH CHECK (
    primary_did IN (
      SELECT primary_did FROM cross_chain_identities 
      WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_cross_chain_identities_user ON cross_chain_identities(user_id);
CREATE INDEX idx_cross_chain_identities_did ON cross_chain_identities(primary_did);
CREATE INDEX idx_cross_chain_networks_did ON cross_chain_networks(primary_did);
CREATE INDEX idx_cross_chain_networks_network ON cross_chain_networks(network);
CREATE INDEX idx_cross_chain_bridge_proofs_did ON cross_chain_bridge_proofs(primary_did);
CREATE INDEX idx_cross_chain_bridge_proofs_valid ON cross_chain_bridge_proofs(is_valid, expires_at);
CREATE INDEX idx_cross_chain_messages_did ON cross_chain_messages(primary_did);
CREATE INDEX idx_cross_chain_messages_status ON cross_chain_messages(status);

-- Trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_cross_chain_identity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cross_chain_identity_timestamp
  BEFORE UPDATE ON cross_chain_identities
  FOR EACH ROW
  EXECUTE FUNCTION update_cross_chain_identity_updated_at();