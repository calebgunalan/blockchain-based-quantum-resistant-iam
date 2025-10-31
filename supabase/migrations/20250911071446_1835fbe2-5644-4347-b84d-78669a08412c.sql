-- Create approval workflows for the system to function
INSERT INTO approval_workflows (name, description, resource_type, approval_steps, is_active, created_by) VALUES
('User Role Change Approval', 'Approval workflow for user role changes', 'user_role', 
 '[{"approver_id": "admin", "required_role": "admin", "timeout_hours": 24}]'::jsonb, 
 true, 
 (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)),
('API Key Creation Approval', 'Approval workflow for API key creation', 'api_key', 
 '[{"approver_id": "admin", "required_role": "admin", "timeout_hours": 8}]'::jsonb, 
 true, 
 (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)),
('Security Policy Update Approval', 'Approval workflow for security policy changes', 'security_policy', 
 '[{"approver_id": "admin", "required_role": "admin", "timeout_hours": 48}]'::jsonb, 
 true, 
 (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)),
('System Configuration Approval', 'Approval workflow for system configuration changes', 'system_config', 
 '[{"approver_id": "admin", "required_role": "admin", "timeout_hours": 24}]'::jsonb, 
 true, 
 (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)),
('Privileged Access Approval', 'Approval workflow for privileged access requests', 'privileged_access', 
 '[{"approver_id": "admin", "required_role": "admin", "timeout_hours": 4}]'::jsonb, 
 true, 
 (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1));

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

-- Add some sample attack simulation data for demonstration
INSERT INTO attack_simulation_logs (attack_type, target_resource, attack_payload, system_response, blocked, severity, quantum_protected, source_ip, response_time_ms, mitigation_actions)
VALUES 
('SQL Injection', '/api/users', '{"payload": "1\' OR 1=1--", "method": "POST"}', '{"blocked": true, "reason": "Malicious SQL detected"}', true, 'high', true, '192.168.1.100', 15, '["IP_BLOCKED", "ALERT_SENT"]'),
('XSS Attack', '/dashboard', '{"payload": "<script>alert(\"xss\")</script>", "method": "GET"}', '{"blocked": true, "reason": "XSS pattern detected"}', true, 'medium', false, '10.0.0.50', 8, '["PAYLOAD_SANITIZED", "USER_WARNED"]'),
('Brute Force', '/auth/login', '{"attempts": 50, "target": "admin@example.com"}', '{"blocked": true, "reason": "Rate limit exceeded"}', true, 'high', true, '203.0.113.1', 2, '["ACCOUNT_LOCKED", "IP_BANNED"]'),
('Quantum Attack Simulation', '/quantum/keys', '{"algorithm": "Shor", "target": "RSA-2048"}', '{"blocked": true, "reason": "Quantum-resistant algorithms active"}', true, 'critical', true, '198.51.100.1', 25, '["QUANTUM_SHIELD_ACTIVATED", "KEY_ROTATED"]');