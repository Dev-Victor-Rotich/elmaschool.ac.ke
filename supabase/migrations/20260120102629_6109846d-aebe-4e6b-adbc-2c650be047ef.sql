-- Fix RLS policies/functions that referenced auth.users (causing: permission denied for table users)

-- 1) Replace function to avoid auth.users and use JWT email instead
CREATE OR REPLACE FUNCTION public.has_teaching_assignment_for_class(_user_id uuid, _class_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    (_user_id = auth.uid())
    AND auth.email() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM teacher_subject_assignments tsa
      JOIN staff_registry sr ON sr.id = tsa.teacher_id
      WHERE tsa.class_name = _class_name
        AND lower(sr.email) = lower(auth.email())
    );
$$;

-- 2) Update policy on class_subject_offerings to avoid auth.users join
DROP POLICY IF EXISTS "Staff can view offerings for their teaching classes" ON public.class_subject_offerings;
CREATE POLICY "Staff can view offerings for their teaching classes"
ON public.class_subject_offerings
FOR SELECT
TO public
USING (
  has_teaching_assignment_for_class(auth.uid(), class_subject_offerings.class_name)
  OR EXISTS (
    SELECT 1
    FROM classteacher_assignments cta
    WHERE cta.user_id = auth.uid()
      AND cta.assigned_class = class_subject_offerings.class_name
  )
  OR is_super_admin(auth.uid())
);

-- 3) Update admission_requests policy to avoid auth.users
DROP POLICY IF EXISTS "Users can view own requests" ON public.admission_requests;
CREATE POLICY "Users can view own requests"
ON public.admission_requests
FOR SELECT
TO authenticated
USING (
  auth.email() IS NOT NULL
  AND lower(email) = lower(auth.email())
);
