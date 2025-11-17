-- Add approval status to students_data table
ALTER TABLE public.students_data 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_staff_registry_email ON public.staff_registry(email);
CREATE INDEX IF NOT EXISTS idx_students_data_email ON public.students_data(email);

-- Update staff_registry to simplify - make non-email fields nullable
ALTER TABLE public.staff_registry 
ALTER COLUMN full_name DROP NOT NULL,
ALTER COLUMN id_number DROP NOT NULL,
ALTER COLUMN phone DROP NOT NULL;