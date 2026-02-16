-- External timestamps table for RFC 3161 timestamping
CREATE TABLE public.external_timestamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_hash TEXT NOT NULL,
  block_index INTEGER NOT NULL,
  timestamp_token TEXT NOT NULL,
  tsa_url TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.external_timestamps ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read timestamps (public audit)
CREATE POLICY "Authenticated users can view external timestamps"
ON public.external_timestamps
FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert timestamps
CREATE POLICY "Admins can insert external timestamps"
ON public.external_timestamps
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::system_role));