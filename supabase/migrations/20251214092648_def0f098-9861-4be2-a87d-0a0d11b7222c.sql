-- Add RLS policy allowing students to view class messages for messages sent to them
CREATE POLICY "Students can view class messages sent to them"
ON public.class_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM message_recipients mr
    JOIN students_data sd ON sd.id = mr.student_id
    WHERE mr.message_id = class_messages.id
    AND sd.user_id = auth.uid()
  )
);