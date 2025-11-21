-- Create table for classteacher class assignments
CREATE TABLE IF NOT EXISTS public.classteacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_class TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.classteacher_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for classteacher_assignments
CREATE POLICY "Super admins can manage classteacher assignments"
ON public.classteacher_assignments
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Classteachers can view own assignment"
ON public.classteacher_assignments
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'classteacher'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_classteacher_assignments_updated_at
BEFORE UPDATE ON public.classteacher_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert staff registry data into profiles for existing staff
-- This ensures all registered staff data is saved in the database
DO $$
BEGIN
  -- Update profiles with staff registry data where they exist
  UPDATE public.profiles p
  SET 
    full_name = COALESCE(s.full_name, p.full_name),
    phone_number = COALESCE(s.phone, p.phone_number),
    id_number = COALESCE(s.id_number, p.id_number)
  FROM public.staff_registry s
  WHERE p.id IN (
    SELECT u.id FROM auth.users u WHERE u.email = s.email
  );
END $$;