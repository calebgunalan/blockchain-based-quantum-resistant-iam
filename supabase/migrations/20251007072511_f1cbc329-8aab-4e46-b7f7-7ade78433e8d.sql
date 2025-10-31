-- Fix document classification RLS policies  
-- Public: Everyone can view
-- Internal: Authenticated users only
-- Confidential: Moderators and Admins
-- Restricted: Admins only

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view documents based on classification" ON documents;

-- Create new granular policies
CREATE POLICY "Anyone can view public documents" 
ON documents FOR SELECT 
USING (classification = 'public');

CREATE POLICY "Authenticated users can view internal documents" 
ON documents FOR SELECT 
USING (classification = 'internal' AND auth.uid() IS NOT NULL);

CREATE POLICY "Moderators and admins can view confidential documents" 
ON documents FOR SELECT 
USING (
  classification = 'confidential' AND 
  (has_role(auth.uid(), 'moderator'::system_role) OR has_role(auth.uid(), 'admin'::system_role))
);

CREATE POLICY "Only admins can view restricted documents" 
ON documents FOR SELECT 
USING (classification = 'restricted' AND has_role(auth.uid(), 'admin'::system_role));

-- Add soft delete to profiles (if doesn't exist)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Update the handle_new_user function to handle recreated users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Check if a soft-deleted profile exists and restore it
  UPDATE public.profiles 
  SET deleted_at = NULL,
      email = NEW.email,
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      updated_at = now()
  WHERE user_id = NEW.id AND deleted_at IS NOT NULL;
  
  -- If no existing profile was restored, insert new one
  IF NOT FOUND THEN
    -- Use INSERT ... ON CONFLICT to handle potential conflicts
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (user_id) DO UPDATE SET
      deleted_at = NULL,
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      updated_at = now();
  END IF;
  
  -- Handle user roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::system_role)
  ON CONFLICT (user_id) DO UPDATE SET role = 'user'::system_role;
  
  RETURN NEW;
END;
$$;

-- Create user_profiles view for easier user listing
CREATE OR REPLACE VIEW user_profiles_with_roles AS
SELECT 
  p.user_id,
  p.id,
  p.email,
  p.full_name,
  p.avatar_url,
  p.created_at,
  p.updated_at,
  ur.role
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
WHERE p.deleted_at IS NULL;

-- Grant permissions
GRANT SELECT ON user_profiles_with_roles TO authenticated;

-- Helper function to get user ID from storage path
CREATE OR REPLACE FUNCTION public.get_user_id_from_folder(file_path text)
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT (regexp_match(file_path, '^([a-f0-9-]+)/'))[1]::uuid;
$$;

-- Update document storage policies for better access control
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their uploaded documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

CREATE POLICY "Users can upload documents" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'documents' AND 
  auth.uid() = get_user_id_from_folder(name)
);

CREATE POLICY "Users can view their documents" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'documents' AND 
  auth.uid() = get_user_id_from_folder(name)
);

CREATE POLICY "Admins can view all storage documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Moderators can view all storage documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'documents' AND has_role(auth.uid(), 'moderator'::system_role));

CREATE POLICY "Users can update their documents" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'documents' AND 
  auth.uid() = get_user_id_from_folder(name)
);

CREATE POLICY "Users can delete their documents" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'documents' AND 
  auth.uid() = get_user_id_from_folder(name)
);