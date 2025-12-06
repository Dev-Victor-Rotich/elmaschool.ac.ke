-- Add sub_subjects column to subjects table
ALTER TABLE public.subjects 
ADD COLUMN sub_subjects text[] DEFAULT '{}';

-- Create student_subjects table for tracking which students take which subjects
CREATE TABLE public.student_subjects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.students_data(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    sub_subject text,
    assigned_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(student_id, subject_id, sub_subject)
);

-- Enable RLS
ALTER TABLE public.student_subjects ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_subjects
CREATE POLICY "Class teachers can manage student subjects in their class"
ON public.student_subjects
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM students_data sd
        JOIN classteacher_assignments ca ON ca.assigned_class = sd.class
        WHERE sd.id = student_subjects.student_id
        AND ca.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM students_data sd
        JOIN classteacher_assignments ca ON ca.assigned_class = sd.class
        WHERE sd.id = student_subjects.student_id
        AND ca.user_id = auth.uid()
    )
);

CREATE POLICY "Super admins can manage all student subjects"
ON public.student_subjects
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Students can view their own subjects"
ON public.student_subjects
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM students_data
        WHERE students_data.id = student_subjects.student_id
        AND students_data.user_id = auth.uid()
    )
);

CREATE POLICY "Teachers can view student subjects"
ON public.student_subjects
FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_student_subjects_updated_at
BEFORE UPDATE ON public.student_subjects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();