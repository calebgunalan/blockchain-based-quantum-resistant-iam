-- Create documents table for resource management
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  classification TEXT NOT NULL DEFAULT 'public',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  access_count INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view documents based on classification" 
ON public.documents 
FOR SELECT 
USING (
  classification = 'public' OR 
  (classification = 'internal' AND auth.uid() IS NOT NULL) OR
  (classification = 'confidential' AND has_role(auth.uid(), 'admin'::system_role)) OR
  (classification = 'restricted' AND has_role(auth.uid(), 'admin'::system_role))
);

CREATE POLICY "Users can create documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all documents" 
ON public.documents 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Users can update their own documents" 
ON public.documents 
FOR UPDATE 
USING (auth.uid() = created_by);

-- Create tasks table for workspace management
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID NOT NULL,
  assigned_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  progress INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their assigned tasks" 
ON public.tasks 
FOR SELECT 
USING (auth.uid() = assigned_to OR auth.uid() = assigned_by OR has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Moderators and admins can create tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'moderator'::system_role) OR has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Users can update their assigned tasks" 
ON public.tasks 
FOR UPDATE 
USING (auth.uid() = assigned_to OR auth.uid() = assigned_by OR has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Admins can manage all tasks" 
ON public.tasks 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::system_role));

-- Create quantum permissions table
CREATE TABLE public.quantum_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  group_id UUID,
  permission_type TEXT NOT NULL, -- 'view', 'manage', 'configure'
  granted_by UUID NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT quantum_permissions_user_or_group CHECK (
    (user_id IS NOT NULL AND group_id IS NULL) OR 
    (user_id IS NULL AND group_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.quantum_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage quantum permissions" 
ON public.quantum_permissions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::system_role));

CREATE POLICY "Users can view their own quantum permissions" 
ON public.quantum_permissions 
FOR SELECT 
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.user_group_memberships 
  WHERE user_id = auth.uid() AND group_id = quantum_permissions.group_id
));

-- Create triggers for updated_at
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check quantum permissions
CREATE OR REPLACE FUNCTION public.has_quantum_permission(_user_id UUID, _permission_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins always have access
  IF has_role(_user_id, 'admin'::system_role) THEN
    RETURN true;
  END IF;
  
  -- Check direct user permissions
  IF EXISTS (
    SELECT 1 FROM public.quantum_permissions 
    WHERE user_id = _user_id 
      AND permission_type = _permission_type 
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  ) THEN
    RETURN true;
  END IF;
  
  -- Check group permissions
  IF EXISTS (
    SELECT 1 FROM public.quantum_permissions qp
    JOIN public.user_group_memberships ugm ON qp.group_id = ugm.group_id
    WHERE ugm.user_id = _user_id 
      AND qp.permission_type = _permission_type 
      AND qp.is_active = true
      AND (qp.expires_at IS NULL OR qp.expires_at > now())
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;