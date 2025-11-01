-- Phase 2: Blockchain Decentralization - Database Schema

-- Transaction pool/mempool for pending transactions
CREATE TABLE blockchain_mempool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT NOT NULL UNIQUE,
  transaction_data JSONB NOT NULL,
  transaction_fee NUMERIC(20,8) DEFAULT 0,
  priority_score INTEGER DEFAULT 0,
  sender_id UUID,
  size_bytes INTEGER NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  included_in_block TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected'))
);

CREATE INDEX idx_mempool_status ON blockchain_mempool(status);
CREATE INDEX idx_mempool_priority ON blockchain_mempool(priority_score DESC) WHERE status = 'pending';
CREATE INDEX idx_mempool_received ON blockchain_mempool(received_at) WHERE status = 'pending';

-- Token balances for economic model
CREATE TABLE user_token_balances (
  user_id UUID PRIMARY KEY,
  balance NUMERIC(20,8) DEFAULT 0 CHECK (balance >= 0),
  locked_balance NUMERIC(20,8) DEFAULT 0 CHECK (locked_balance >= 0),
  total_earned NUMERIC(20,8) DEFAULT 0,
  total_spent NUMERIC(20,8) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction fee tracking
ALTER TABLE blockchain_audit_logs 
  ADD COLUMN IF NOT EXISTS transaction_fee NUMERIC(20,8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gas_used INTEGER DEFAULT 0;

-- Mining rewards and block economics
ALTER TABLE blockchain_blocks 
  ADD COLUMN IF NOT EXISTS block_reward NUMERIC(20,8) DEFAULT 50,
  ADD COLUMN IF NOT EXISTS total_fees NUMERIC(20,8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chain_work NUMERIC(30,0) DEFAULT 0;

-- P2P peer tracking
CREATE TABLE p2p_peers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peer_id TEXT NOT NULL UNIQUE,
  peer_address TEXT NOT NULL,
  reputation_score INTEGER DEFAULT 50 CHECK (reputation_score BETWEEN 0 AND 100),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  total_blocks_received INTEGER DEFAULT 0,
  total_blocks_sent INTEGER DEFAULT 0,
  is_trusted BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_peers_reputation ON p2p_peers(reputation_score DESC) WHERE NOT is_banned;
CREATE INDEX idx_peers_active ON p2p_peers(last_seen_at DESC) WHERE NOT is_banned;

-- Blockchain fork tracking
CREATE TABLE blockchain_forks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fork_height INTEGER NOT NULL,
  main_chain_hash TEXT NOT NULL,
  fork_chain_hash TEXT NOT NULL,
  fork_chain_work NUMERIC(30,0) NOT NULL,
  main_chain_work NUMERIC(30,0) NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution TEXT CHECK (resolution IN ('main_chain_won', 'fork_chain_won', 'pending')),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- RLS Policies
ALTER TABLE blockchain_mempool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view mempool" ON blockchain_mempool FOR SELECT USING (true);
CREATE POLICY "System can insert transactions" ON blockchain_mempool FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update transactions" ON blockchain_mempool FOR UPDATE USING (true);

ALTER TABLE user_token_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own balance" ON user_token_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all balances" ON user_token_balances FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can manage balances" ON user_token_balances FOR ALL USING (true);

ALTER TABLE p2p_peers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage peers" ON p2p_peers FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Everyone can view active peers" ON p2p_peers FOR SELECT USING (NOT is_banned);

ALTER TABLE blockchain_forks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view forks" ON blockchain_forks FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can manage forks" ON blockchain_forks FOR ALL USING (true);

-- Helper functions
CREATE OR REPLACE FUNCTION calculate_transaction_priority(
  fee NUMERIC,
  size_bytes INTEGER,
  age_seconds INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Priority = (fee / size) * 1000000 + age_bonus
  RETURN FLOOR((fee / NULLIF(size_bytes, 0)) * 1000000) + (age_seconds / 60);
END;
$$;

CREATE OR REPLACE FUNCTION get_mempool_stats() RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'pending_count', COUNT(*) FILTER (WHERE status = 'pending'),
    'total_fees', COALESCE(SUM(transaction_fee) FILTER (WHERE status = 'pending'), 0),
    'avg_fee', COALESCE(AVG(transaction_fee) FILTER (WHERE status = 'pending'), 0),
    'total_size_bytes', COALESCE(SUM(size_bytes) FILTER (WHERE status = 'pending'), 0)
  ) INTO stats
  FROM blockchain_mempool;
  
  RETURN stats;
END;
$$;

CREATE OR REPLACE FUNCTION update_peer_reputation(
  peer_id_param TEXT,
  reputation_delta INTEGER
) RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE p2p_peers
  SET reputation_score = GREATEST(0, LEAST(100, reputation_score + reputation_delta)),
      last_seen_at = NOW()
  WHERE peer_id = peer_id_param;
END;
$$;