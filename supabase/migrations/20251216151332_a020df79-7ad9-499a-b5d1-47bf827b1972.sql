-- Add RLS policies for staff with teaching assignments to view students in their assigned classes

CREATE POLICY "Staff with teaching assignments can view students in their classes"
ON public.students_data
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM teacher_subject_assignments tsa
    JOIN staff_registry sr ON sr.id = tsa.teacher_id
    JOIN auth.users au ON au.email = sr.email
    WHERE au.id = auth.uid()
    AND tsa.class_name = students_data.class
  )
);

-- Allow staff with teaching assignments to view student subjects for their assigned classes
CREATE POLICY "Staff with teaching assignments can view student subjects"
ON public.student_subjects
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM teacher_subject_assignments tsa
    JOIN staff_registry sr ON sr.id = tsa.teacher_id
    JOIN auth.users au ON au.email = sr.email
    JOIN students_data sd ON sd.id = student_subjects.student_id
    WHERE au.id = auth.uid()
    AND tsa.class_name = sd.class
  )
);