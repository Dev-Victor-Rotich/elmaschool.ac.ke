-- Create class_messages table for teacher-to-student communications
CREATE TABLE public.class_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL,
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    filter_type TEXT NOT NULL DEFAULT 'all',
    filter_value JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message_recipients table to track which students receive messages
CREATE TABLE public.message_recipients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES public.class_messages(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students_data(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(message_id, student_id)
);

-- Enable RLS on both tables
ALTER TABLE public.class_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for class_messages
CREATE POLICY "ClassTeachers can manage messages in their class"
ON public.class_messages FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM classteacher_assignments ca
        WHERE ca.user_id = auth.uid() AND ca.assigned_class = class_messages.class_name
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM classteacher_assignments ca
        WHERE ca.user_id = auth.uid() AND ca.assigned_class = class_messages.class_name
    )
);

CREATE POLICY "Super admins can manage all messages"
ON public.class_messages FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for message_recipients
CREATE POLICY "ClassTeachers can manage recipients in their class"
ON public.message_recipients FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM class_messages cm
        JOIN classteacher_assignments ca ON ca.assigned_class = cm.class_name
        WHERE cm.id = message_recipients.message_id AND ca.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM class_messages cm
        JOIN classteacher_assignments ca ON ca.assigned_class = cm.class_name
        WHERE cm.id = message_recipients.message_id AND ca.user_id = auth.uid()
    )
);

CREATE POLICY "Students can view their own messages"
ON public.message_recipients FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM students_data sd
        WHERE sd.id = message_recipients.student_id AND sd.user_id = auth.uid()
    )
);

CREATE POLICY "Students can update their own message read status"
ON public.message_recipients FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM students_data sd
        WHERE sd.id = message_recipients.student_id AND sd.user_id = auth.uid()
    )
);

CREATE POLICY "Super admins can manage all recipients"
ON public.message_recipients FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_class_messages_class ON public.class_messages(class_name);
CREATE INDEX idx_class_messages_sender ON public.class_messages(sender_id);
CREATE INDEX idx_message_recipients_student ON public.message_recipients(student_id);
CREATE INDEX idx_message_recipients_message ON public.message_recipients(message_id);