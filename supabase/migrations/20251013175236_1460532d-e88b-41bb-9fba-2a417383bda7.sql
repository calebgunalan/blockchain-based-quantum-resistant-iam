-- Add post-quantum cryptography support to user_quantum_settings table

-- Add new columns for post-quantum keys and settings
ALTER TABLE public.user_quantum_settings
ADD COLUMN IF NOT EXISTS post_quantum_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS hybrid_mode_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS security_level text DEFAULT 'high',
ADD COLUMN IF NOT EXISTS pq_kem_private_key_encrypted text,
ADD COLUMN IF NOT EXISTS pq_sig_private_key_encrypted text,
ADD COLUMN IF NOT EXISTS classical_kem_private_key_encrypted text,
ADD COLUMN IF NOT EXISTS classical_sig_private_key_encrypted text;

-- Add algorithm field to quantum_keys table
ALTER TABLE public.quantum_keys
ADD COLUMN IF NOT EXISTS algorithm text DEFAULT 'X25519',
ADD COLUMN IF NOT EXISTS is_post_quantum boolean DEFAULT false;

-- Add quantum threat assessment table
CREATE TABLE IF NOT EXISTS public.quantum_threat_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_risk text NOT NULL CHECK (overall_risk IN ('low', 'medium', 'high', 'critical')),
  using_post_quantum boolean NOT NULL DEFAULT false,
  vulnerable_operations integer NOT NULL DEFAULT 0,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  assessment_date timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on quantum_threat_assessments
ALTER TABLE public.quantum_threat_assessments ENABLE ROW LEVEL SECURITY;

-- RLS policies for quantum_threat_assessments
CREATE POLICY "Users can view their own threat assessments"
ON public.quantum_threat_assessments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert threat assessments"
ON public.quantum_threat_assessments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all threat assessments"
ON public.quantum_threat_assessments
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::system_role));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_quantum_threat_assessments_user_id 
ON public.quantum_threat_assessments(user_id);

CREATE INDEX IF NOT EXISTS idx_quantum_threat_assessments_date 
ON public.quantum_threat_assessments(assessment_date DESC);

-- Add comment explaining post-quantum security
COMMENT ON TABLE public.quantum_threat_assessments IS 
'Stores quantum threat assessments for users. Tracks vulnerability to quantum attacks and provides recommendations for post-quantum migration.';

COMMENT ON COLUMN public.user_quantum_settings.post_quantum_enabled IS
'Whether user has enabled true post-quantum cryptography (ML-KEM, ML-DSA) instead of just transitional algorithms';

COMMENT ON COLUMN public.user_quantum_settings.hybrid_mode_enabled IS  
'Whether hybrid mode is enabled (combining classical + post-quantum for defense-in-depth)';
