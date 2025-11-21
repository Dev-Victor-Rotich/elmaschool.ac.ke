-- Fix profiles check constraint to allow 'deleted' status
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_approval_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_approval_status_check 
  CHECK (approval_status IN ('pending', 'approved', 'rejected', 'deleted'));

-- Ensure students are created as profiles when they register/are approved
-- This trigger will sync student data to profiles
CREATE OR REPLACE FUNCTION public.sync_student_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a student is approved, ensure they have a profile
  IF NEW.approval_status = 'approved' AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, phone_number, approval_status, status)
    VALUES (
      NEW.user_id,
      NEW.full_name,
      NEW.parent_phone,
      'approved',
      'approved'
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      phone_number = EXCLUDED.phone_number,
      approval_status = 'approved',
      status = 'approved',
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for student to profile sync
DROP TRIGGER IF EXISTS sync_student_to_profile_trigger ON public.students_data;
CREATE TRIGGER sync_student_to_profile_trigger
  AFTER UPDATE OF approval_status, user_id ON public.students_data
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_student_to_profile();