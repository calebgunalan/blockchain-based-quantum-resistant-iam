-- Create a secure function to get auth user details including email verification status
CREATE OR REPLACE FUNCTION public.get_auth_users_details()
RETURNS TABLE (
  user_id uuid,
  email text,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    id as user_id,
    email,
    email_confirmed_at,
    last_sign_in_at,
    created_at
  FROM auth.users
  WHERE deleted_at IS NULL
$$;