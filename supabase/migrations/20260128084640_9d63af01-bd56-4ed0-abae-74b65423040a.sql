-- Create helper function for student content editors
CREATE OR REPLACE FUNCTION public.is_student_content_editor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('student_leader', 'class_rep')
  )
$$;

-- Add RLS policies for gallery_media
CREATE POLICY "Student content editors can manage gallery media"
ON public.gallery_media
FOR ALL
TO authenticated
USING (is_student_content_editor(auth.uid()))
WITH CHECK (is_student_content_editor(auth.uid()));

-- Add RLS policies for hero_content
CREATE POLICY "Student content editors can manage hero content"
ON public.hero_content
FOR ALL
TO authenticated
USING (is_student_content_editor(auth.uid()))
WITH CHECK (is_student_content_editor(auth.uid()));

-- Add RLS policies for home_features
CREATE POLICY "Student content editors can manage home features"
ON public.home_features
FOR ALL
TO authenticated
USING (is_student_content_editor(auth.uid()))
WITH CHECK (is_student_content_editor(auth.uid()));

-- Add RLS policies for site_stats
CREATE POLICY "Student content editors can manage site stats"
ON public.site_stats
FOR ALL
TO authenticated
USING (is_student_content_editor(auth.uid()))
WITH CHECK (is_student_content_editor(auth.uid()));

-- Add RLS policies for trust_badges
CREATE POLICY "Student content editors can manage trust badges"
ON public.trust_badges
FOR ALL
TO authenticated
USING (is_student_content_editor(auth.uid()))
WITH CHECK (is_student_content_editor(auth.uid()));

-- Add RLS policies for events (update existing INSERT policy and add UPDATE/DELETE)
CREATE POLICY "Student content editors can manage events"
ON public.events
FOR ALL
TO authenticated
USING (is_student_content_editor(auth.uid()))
WITH CHECK (is_student_content_editor(auth.uid()));

-- Add RLS policies for community_testimonials
CREATE POLICY "Student content editors can manage community testimonials"
ON public.community_testimonials
FOR ALL
TO authenticated
USING (is_student_content_editor(auth.uid()))
WITH CHECK (is_student_content_editor(auth.uid()));

-- Add RLS policies for faqs
CREATE POLICY "Student content editors can manage faqs"
ON public.faqs
FOR ALL
TO authenticated
USING (is_student_content_editor(auth.uid()))
WITH CHECK (is_student_content_editor(auth.uid()));

-- Add RLS policies for leadership_programs
CREATE POLICY "Student content editors can manage leadership programs"
ON public.leadership_programs
FOR ALL
TO authenticated
USING (is_student_content_editor(auth.uid()))
WITH CHECK (is_student_content_editor(auth.uid()));

-- Add RLS policies for program_members
CREATE POLICY "Student content editors can manage program members"
ON public.program_members
FOR ALL
TO authenticated
USING (is_student_content_editor(auth.uid()))
WITH CHECK (is_student_content_editor(auth.uid()));

-- Add RLS policies for beyond_classroom
CREATE POLICY "Student content editors can manage beyond classroom"
ON public.beyond_classroom
FOR ALL
TO authenticated
USING (is_student_content_editor(auth.uid()))
WITH CHECK (is_student_content_editor(auth.uid()));

-- Add RLS policies for student_ambassador
CREATE POLICY "Student content editors can manage student ambassador"
ON public.student_ambassador
FOR ALL
TO authenticated
USING (is_student_content_editor(auth.uid()))
WITH CHECK (is_student_content_editor(auth.uid()));

-- Add RLS policies for clubs_societies
CREATE POLICY "Student content editors can manage clubs societies"
ON public.clubs_societies
FOR ALL
TO authenticated
USING (is_student_content_editor(auth.uid()))
WITH CHECK (is_student_content_editor(auth.uid()));

-- Add RLS policies for previous_leaders
CREATE POLICY "Student content editors can manage previous leaders"
ON public.previous_leaders
FOR ALL
TO authenticated
USING (is_student_content_editor(auth.uid()))
WITH CHECK (is_student_content_editor(auth.uid()));