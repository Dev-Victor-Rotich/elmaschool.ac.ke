-- Allow staff with teaching assignments to manage results in their assigned classes
CREATE POLICY "Staff with teaching assignments can manage results"
ON public.academic_results
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM students_data sd
    WHERE sd.id = academic_results.student_id
    AND has_teaching_assignment_for_class(auth.uid(), sd.class)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM students_data sd
    WHERE sd.id = academic_results.student_id
    AND has_teaching_assignment_for_class(auth.uid(), sd.class)
  )
);