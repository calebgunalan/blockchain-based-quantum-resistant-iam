-- Create blockchain_archives table for pruning
CREATE TABLE IF NOT EXISTS public.blockchain_archives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  archive_id TEXT NOT NULL UNIQUE,
  start_height INTEGER NOT NULL,
  end_height INTEGER NOT NULL,
  block_count INTEGER NOT NULL,
  archive_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blockchain_archives ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies
CREATE POLICY "Admins can view archives"
  ON public.blockchain_archives
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create archives"
  ON public.blockchain_archives
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete archives"
  ON public.blockchain_archives
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add indexes
CREATE INDEX idx_blockchain_archives_archive_id ON public.blockchain_archives(archive_id);
CREATE INDEX idx_blockchain_archives_height_range ON public.blockchain_archives(start_height, end_height);
CREATE INDEX idx_blockchain_archives_created_at ON public.blockchain_archives(created_at);