-- Fix the problematic RLS policy that queries auth.users directly (causes permission denied error)
DROP POLICY IF EXISTS "Staff can view assignments where they are the teacher" ON public.teacher_subject_assignments;

-- Recreate using auth.email() instead of querying auth.users
CREATE POLICY "Staff can view assignments where they are the teacher"
ON public.teacher_subject_assignments
FOR SELECT
USING (
  teacher_id IN (
    SELECT sr.id FROM staff_registry sr
    WHERE sr.email = auth.email()::text
  )
  OR teacher_id = auth.uid()
);