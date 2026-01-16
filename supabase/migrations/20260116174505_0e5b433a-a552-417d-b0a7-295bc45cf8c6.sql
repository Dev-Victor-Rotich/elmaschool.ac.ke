-- Fix class_subject_offerings RLS policy to use email matching pattern
-- This fixes the bug where staff_registry.id was incorrectly compared to auth.uid()

-- Drop the buggy policy
DROP POLICY IF EXISTS "Teachers can view offerings for their assigned classes" ON class_subject_offerings;

-- Create new policy with correct ID resolution via email matching
CREATE POLICY "Staff can view offerings for their teaching classes"
ON class_subject_offerings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM teacher_subject_assignments tsa
    JOIN staff_registry sr ON sr.id = tsa.teacher_id
    JOIN auth.users au ON au.email = sr.email
    WHERE au.id = auth.uid()
    AND tsa.class_name = class_subject_offerings.class_name
  )
  OR
  -- Allow class teachers to view all offerings for their class
  EXISTS (
    SELECT 1 FROM classteacher_assignments cta
    WHERE cta.user_id = auth.uid()
    AND cta.assigned_class = class_subject_offerings.class_name
  )
  OR
  -- Super admins can view all
  public.is_super_admin(auth.uid())
);