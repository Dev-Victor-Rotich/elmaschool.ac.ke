-- Drop the foreign key constraint on teacher_id that's causing the error
-- Staff are tracked via staff_registry, not directly via auth.users
ALTER TABLE public.teacher_subject_assignments 
DROP CONSTRAINT IF EXISTS teacher_subject_assignments_teacher_id_fkey;