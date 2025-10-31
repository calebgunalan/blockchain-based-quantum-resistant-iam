-- Fix the handle_new_user trigger to match the actual unique constraint
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  
  -- Handle user roles - fix the ON CONFLICT to match actual constraint (user_id, role)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::system_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;