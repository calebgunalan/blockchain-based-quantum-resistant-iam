
-- Create custom_roles table for flexible role definitions beyond the system_role enum
CREATE TABLE public.custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- Policies: admins can manage, authenticated users can read
CREATE POLICY "Authenticated users can view active custom roles"
  ON public.custom_roles FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage custom roles"
  ON public.custom_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create custom_role_assignments table to assign custom roles to users
CREATE TABLE public.custom_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  custom_role_id UUID NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, custom_role_id)
);

ALTER TABLE public.custom_role_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view custom role assignments"
  ON public.custom_role_assignments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage custom role assignments"
  ON public.custom_role_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create custom_role_permissions to link custom roles to permissions
CREATE TABLE public.custom_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_role_id UUID NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (custom_role_id, permission_id)
);

ALTER TABLE public.custom_role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view custom role permissions"
  ON public.custom_role_permissions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage custom role permissions"
  ON public.custom_role_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Helper function to check if user has a custom role
CREATE OR REPLACE FUNCTION public.has_custom_role(_user_id UUID, _role_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.custom_role_assignments cra
    JOIN public.custom_roles cr ON cr.id = cra.custom_role_id
    WHERE cra.user_id = _user_id
      AND cr.name = _role_name
      AND cr.is_active = true
  )
$$;

-- Trigger for updated_at on custom_roles
CREATE TRIGGER update_custom_roles_updated_at
  BEFORE UPDATE ON public.custom_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
