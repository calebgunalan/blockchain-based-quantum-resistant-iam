-- Create attack simulation logs table
CREATE TABLE IF NOT EXISTS attack_simulation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attack_type TEXT NOT NULL,
  target_resource TEXT,
  attack_payload JSONB NOT NULL DEFAULT '{}',
  system_response JSONB NOT NULL DEFAULT '{}',
  blocked BOOLEAN DEFAULT false,
  severity TEXT NOT NULL DEFAULT 'medium',
  quantum_protected BOOLEAN DEFAULT false,
  source_ip INET,
  user_agent TEXT,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  response_time_ms INTEGER,
  mitigation_actions JSONB DEFAULT '[]'
);

-- Enable RLS on attack simulation logs
ALTER TABLE attack_simulation_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view attack simulation logs
CREATE POLICY "Admins can view attack simulation logs" ON attack_simulation_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::system_role));

-- Create policy for system to insert attack simulation logs
CREATE POLICY "System can insert attack simulation logs" ON attack_simulation_logs
  FOR INSERT WITH CHECK (true);