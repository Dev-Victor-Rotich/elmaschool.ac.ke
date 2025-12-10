-- Drop the unused otp_codes table
DROP TABLE IF EXISTS public.otp_codes;

-- Fix teacher_subject_assignments RLS - allow classteachers to insert any teacher_id for their class
DROP POLICY IF EXISTS "Class teachers can manage teacher assignments in their class" ON public.teacher_subject_assignments;

CREATE POLICY "Class teachers can manage teacher assignments in their class"
ON public.teacher_subject_assignments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM classteacher_assignments ca
    WHERE ca.user_id = auth.uid()
    AND ca.assigned_class = teacher_subject_assignments.class_name
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classteacher_assignments ca
    WHERE ca.user_id = auth.uid()
    AND ca.assigned_class = teacher_subject_assignments.class_name
  )
);

-- Ensure teachers can view their own assignments (using staff_registry id match)
DROP POLICY IF EXISTS "Teachers can view their own assignments" ON public.teacher_subject_assignments;

CREATE POLICY "Staff can view assignments where they are the teacher"
ON public.teacher_subject_assignments
FOR SELECT
USING (
  teacher_id IN (
    SELECT sr.id FROM staff_registry sr
    WHERE sr.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  OR teacher_id = auth.uid()
);

-- Add policy for teachers to manage results they created
DROP POLICY IF EXISTS "Teachers and ClassTeachers can manage results" ON public.academic_results;

CREATE POLICY "Teachers and ClassTeachers can manage results"
ON public.academic_results
FOR ALL
USING (
  teacher_id = auth.uid()
  OR has_role(auth.uid(), 'teacher'::app_role)
  OR has_role(auth.uid(), 'classteacher'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Allow teachers to delete their own results
CREATE POLICY "Teachers can delete their own results"
ON public.academic_results
FOR DELETE
USING (teacher_id = auth.uid());