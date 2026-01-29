-- Add RLS policy for Bursars to view all students data
CREATE POLICY "Bursars can view all students data"
ON public.students_data
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'bursar'::app_role));