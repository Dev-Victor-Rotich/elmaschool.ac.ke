-- Create SECURITY DEFINER function to check teaching assignments
CREATE OR REPLACE FUNCTION public.has_teaching_assignment_for_class(_user_id uuid, _class_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM teacher_subject_assignments tsa
    JOIN staff_registry sr ON sr.id = tsa.teacher_id
    JOIN auth.users au ON au.email = sr.email
    WHERE au.id = _user_id
    AND tsa.class_name = _class_name
  )
$$;

-- Drop the old failing RLS policies that reference auth.users directly
DROP POLICY IF EXISTS "Staff with teaching assignments can view students in their clas" ON public.students_data;
DROP POLICY IF EXISTS "Staff with teaching assignments can view student subjects" ON public.student_subjects;

-- Create new RLS policy for students_data using the function
CREATE POLICY "Staff with teaching assignments can view students in their clas"
ON public.students_data
FOR SELECT
USING (has_teaching_assignment_for_class(auth.uid(), class));

-- Create new RLS policy for student_subjects using the function
CREATE POLICY "Staff with teaching assignments can view student subjects"
ON public.student_subjects
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM students_data sd
    WHERE sd.id = student_subjects.student_id
    AND has_teaching_assignment_for_class(auth.uid(), sd.class)
  )
);