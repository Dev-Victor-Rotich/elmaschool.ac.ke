-- Create HOD-to-department mapping table
CREATE TABLE public.hod_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, department_id)
);

-- Enable RLS
ALTER TABLE public.hod_departments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admins can manage HOD departments"
ON public.hod_departments
FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "HODs can view their own department assignment"
ON public.hod_departments
FOR SELECT
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_hod_departments_updated_at
BEFORE UPDATE ON public.hod_departments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-assign student role when student is approved
CREATE OR REPLACE FUNCTION public.assign_student_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a student is approved and has a user_id, assign them the student role
  IF NEW.approval_status = 'approved' AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'student'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for student role assignment
CREATE TRIGGER auto_assign_student_role
AFTER UPDATE ON public.students_data
FOR EACH ROW
WHEN (NEW.approval_status = 'approved' AND NEW.user_id IS NOT NULL)
EXECUTE FUNCTION public.assign_student_role();