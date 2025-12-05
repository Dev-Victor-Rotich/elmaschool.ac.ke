-- Create policy for class teachers to manage students in their assigned class
CREATE POLICY "Class teachers can manage students in their class"
ON public.students_data
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM classteacher_assignments ca
    WHERE ca.user_id = auth.uid()
    AND ca.assigned_class = students_data.class
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classteacher_assignments ca
    WHERE ca.user_id = auth.uid()
    AND ca.assigned_class = students_data.class
  )
);