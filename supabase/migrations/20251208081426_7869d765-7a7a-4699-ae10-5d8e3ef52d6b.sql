-- Add exam_id column to academic_results table to link results to specific exams
ALTER TABLE public.academic_results 
ADD COLUMN IF NOT EXISTS exam_id uuid REFERENCES public.exams(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_academic_results_exam_id ON public.academic_results(exam_id);

-- Create index for student + exam combination queries
CREATE INDEX IF NOT EXISTS idx_academic_results_student_exam ON public.academic_results(student_id, exam_id);