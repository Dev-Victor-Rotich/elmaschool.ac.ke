-- Drop the existing check constraint
ALTER TABLE grade_boundaries DROP CONSTRAINT IF EXISTS grade_boundaries_boundary_type_check;

-- Add updated check constraint that includes all valid values
ALTER TABLE grade_boundaries ADD CONSTRAINT grade_boundaries_boundary_type_check 
CHECK (boundary_type IN ('standard', 'subject_specific', 'subject', 'overall'));