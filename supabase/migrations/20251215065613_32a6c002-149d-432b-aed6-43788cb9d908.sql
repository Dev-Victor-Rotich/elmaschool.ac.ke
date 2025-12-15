-- Create function to get staff role by email from user_roles table
CREATE OR REPLACE FUNCTION public.get_staff_role_by_email(_email text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.role::text
  FROM user_roles ur
  JOIN auth.users au ON au.id = ur.user_id
  WHERE au.email = _email
  LIMIT 1
$$;