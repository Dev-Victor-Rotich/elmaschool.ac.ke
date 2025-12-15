-- Step 1: Create security definer functions to break recursion

-- Function to check if user is classteacher for a class
CREATE OR REPLACE FUNCTION public.is_classteacher_for_class(_user_id uuid, _class_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM classteacher_assignments
    WHERE user_id = _user_id AND assigned_class = _class_name
  )
$$;

-- Function to check if student is recipient of a message
CREATE OR REPLACE FUNCTION public.is_message_recipient(_user_id uuid, _message_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM message_recipients mr
    JOIN students_data sd ON sd.id = mr.student_id
    WHERE mr.message_id = _message_id
    AND sd.user_id = _user_id
  )
$$;

-- Function to get class name for a message (without RLS)
CREATE OR REPLACE FUNCTION public.get_message_class(_message_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT class_name FROM class_messages WHERE id = _message_id
$$;

-- Step 2: Drop problematic policies on class_messages
DROP POLICY IF EXISTS "Students can view class messages sent to them" ON public.class_messages;
DROP POLICY IF EXISTS "ClassTeachers can manage messages in their class" ON public.class_messages;

-- Step 3: Drop problematic policies on message_recipients
DROP POLICY IF EXISTS "ClassTeachers can manage recipients in their class" ON public.message_recipients;

-- Step 4: Recreate class_messages policies using security definer functions
CREATE POLICY "Students can view class messages sent to them"
ON public.class_messages
FOR SELECT
USING (public.is_message_recipient(auth.uid(), id));

CREATE POLICY "ClassTeachers can manage messages in their class"
ON public.class_messages
FOR ALL
USING (public.is_classteacher_for_class(auth.uid(), class_name))
WITH CHECK (public.is_classteacher_for_class(auth.uid(), class_name));

-- Step 5: Recreate message_recipients policies using security definer functions
CREATE POLICY "ClassTeachers can manage recipients in their class"
ON public.message_recipients
FOR ALL
USING (public.is_classteacher_for_class(auth.uid(), public.get_message_class(message_id)))
WITH CHECK (public.is_classteacher_for_class(auth.uid(), public.get_message_class(message_id)));