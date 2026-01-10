-- Add columns to grade_boundaries for point-based grading
ALTER TABLE public.grade_boundaries 
ADD COLUMN IF NOT EXISTS boundary_for TEXT DEFAULT 'marks',
ADD COLUMN IF NOT EXISTS min_points INTEGER,
ADD COLUMN IF NOT EXISTS max_points INTEGER;

-- Add check constraint for boundary_for values
ALTER TABLE public.grade_boundaries 
ADD CONSTRAINT grade_boundaries_boundary_for_check 
CHECK (boundary_for IN ('marks', 'points'));

-- Update existing rows to be marks-based
UPDATE public.grade_boundaries SET boundary_for = 'marks' WHERE boundary_for IS NULL;