-- Phase 1: Database Schema for Clubs Organization System

-- 1.1 Modify clubs_societies table - add new columns
ALTER TABLE public.clubs_societies 
ADD COLUMN IF NOT EXISTS patron_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '{"feed": true, "gallery": false, "events": false, "resources": false}'::jsonb,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS meeting_schedule text,
ADD COLUMN IF NOT EXISTS motto text;

-- 1.2 Create club_members table
CREATE TABLE IF NOT EXISTS public.club_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs_societies(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students_data(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  added_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(club_id, student_id)
);

-- 1.3 Create club_posts table
CREATE TABLE IF NOT EXISTS public.club_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs_societies(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_type text NOT NULL CHECK (author_type IN ('patron', 'student')),
  content text NOT NULL,
  image_url text,
  is_pinned boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 1.4 Create club_comments table
CREATE TABLE IF NOT EXISTS public.club_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.club_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_type text NOT NULL CHECK (author_type IN ('patron', 'student')),
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON public.club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_student_id ON public.club_members(student_id);
CREATE INDEX IF NOT EXISTS idx_club_posts_club_id ON public.club_posts(club_id);
CREATE INDEX IF NOT EXISTS idx_club_posts_created_at ON public.club_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_club_comments_post_id ON public.club_comments(post_id);

-- Phase 2: Helper Functions

-- 2.1 Check if user is patron of a club
CREATE OR REPLACE FUNCTION public.is_club_patron(check_user_id uuid, check_club_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM clubs_societies
    WHERE id = check_club_id AND patron_id = check_user_id
  );
$$;

-- 2.2 Check if user is a member of a club (via students_data link)
CREATE OR REPLACE FUNCTION public.is_club_member(check_user_id uuid, check_club_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM club_members cm
    JOIN students_data sd ON cm.student_id = sd.id
    WHERE cm.club_id = check_club_id AND sd.user_id = check_user_id
  );
$$;

-- 2.3 Get student_id from user_id
CREATE OR REPLACE FUNCTION public.get_student_id_from_user(check_user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM students_data WHERE user_id = check_user_id LIMIT 1;
$$;

-- 2.4 Check if user can access club (is member or patron)
CREATE OR REPLACE FUNCTION public.can_access_club(check_user_id uuid, check_club_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT is_club_patron(check_user_id, check_club_id) 
      OR is_club_member(check_user_id, check_club_id)
      OR has_role(check_user_id, 'super_admin');
$$;

-- Enable RLS on new tables
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for club_members

-- Super admins have full access
CREATE POLICY "Super admins can manage all club members"
ON public.club_members FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- Patrons can manage members in their clubs
CREATE POLICY "Patrons can manage club members"
ON public.club_members FOR ALL
USING (is_club_patron(auth.uid(), club_id))
WITH CHECK (is_club_patron(auth.uid(), club_id));

-- Students can view their own memberships
CREATE POLICY "Students can view own memberships"
ON public.club_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM students_data sd
    WHERE sd.id = club_members.student_id AND sd.user_id = auth.uid()
  )
);

-- Members can view other members in their clubs
CREATE POLICY "Club members can view fellow members"
ON public.club_members FOR SELECT
USING (is_club_member(auth.uid(), club_id));

-- RLS Policies for club_posts

-- Super admins have full access
CREATE POLICY "Super admins can manage all club posts"
ON public.club_posts FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- Patrons can manage posts in their clubs
CREATE POLICY "Patrons can manage club posts"
ON public.club_posts FOR ALL
USING (is_club_patron(auth.uid(), club_id))
WITH CHECK (is_club_patron(auth.uid(), club_id));

-- Club members can view posts
CREATE POLICY "Club members can view posts"
ON public.club_posts FOR SELECT
USING (can_access_club(auth.uid(), club_id));

-- Club members can create posts
CREATE POLICY "Club members can create posts"
ON public.club_posts FOR INSERT
WITH CHECK (is_club_member(auth.uid(), club_id) OR is_club_patron(auth.uid(), club_id));

-- Authors can update their own posts
CREATE POLICY "Authors can update own posts"
ON public.club_posts FOR UPDATE
USING (
  (author_type = 'patron' AND author_id = auth.uid()) OR
  (author_type = 'student' AND author_id = get_student_id_from_user(auth.uid()))
);

-- Authors can delete their own posts
CREATE POLICY "Authors can delete own posts"
ON public.club_posts FOR DELETE
USING (
  (author_type = 'patron' AND author_id = auth.uid()) OR
  (author_type = 'student' AND author_id = get_student_id_from_user(auth.uid()))
);

-- RLS Policies for club_comments

-- Super admins have full access
CREATE POLICY "Super admins can manage all comments"
ON public.club_comments FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- Club members and patrons can view comments
CREATE POLICY "Club access can view comments"
ON public.club_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM club_posts cp
    WHERE cp.id = club_comments.post_id
    AND can_access_club(auth.uid(), cp.club_id)
  )
);

-- Club members and patrons can create comments
CREATE POLICY "Club access can create comments"
ON public.club_comments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM club_posts cp
    WHERE cp.id = club_comments.post_id
    AND can_access_club(auth.uid(), cp.club_id)
  )
);

-- Authors can delete their own comments
CREATE POLICY "Authors can delete own comments"
ON public.club_comments FOR DELETE
USING (
  (author_type = 'patron' AND author_id = auth.uid()) OR
  (author_type = 'student' AND author_id = get_student_id_from_user(auth.uid()))
);

-- Update clubs_societies RLS to allow teachers to create
CREATE POLICY "Teachers can create clubs"
ON public.clubs_societies FOR INSERT
WITH CHECK (has_role(auth.uid(), 'teacher'));

-- Patrons can update their own clubs
CREATE POLICY "Patrons can update own clubs"
ON public.clubs_societies FOR UPDATE
USING (patron_id = auth.uid());

-- Enable realtime for posts and comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.club_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.club_comments;