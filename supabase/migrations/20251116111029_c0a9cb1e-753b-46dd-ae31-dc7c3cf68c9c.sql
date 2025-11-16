-- ABOUT PAGE TABLES

-- Principal Message
CREATE TABLE IF NOT EXISTS public.principal_message (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  message TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.principal_message ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view principal message"
  ON public.principal_message FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "SuperAdmin can update principal message"
  ON public.principal_message FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "SuperAdmin can insert principal message"
  ON public.principal_message FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Parent Testimonials
CREATE TABLE IF NOT EXISTS public.parent_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_name TEXT NOT NULL,
  class_representative TEXT NOT NULL,
  message TEXT NOT NULL,
  stars INTEGER CHECK (stars >= 1 AND stars <= 5),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.parent_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view parent testimonials"
  ON public.parent_testimonials FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "SuperAdmin can manage parent testimonials"
  ON public.parent_testimonials FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Facilities
CREATE TABLE IF NOT EXISTS public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view facilities"
  ON public.facilities FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "SuperAdmin can manage facilities"
  ON public.facilities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Academic Excellence
CREATE TABLE IF NOT EXISTS public.academic_excellence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  mean_grade TEXT NOT NULL,
  student_name TEXT NOT NULL,
  course_pursued TEXT NOT NULL,
  university TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.academic_excellence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view academic excellence"
  ON public.academic_excellence FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "SuperAdmin can manage academic excellence"
  ON public.academic_excellence FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Notable Alumni
CREATE TABLE IF NOT EXISTS public.notable_alumni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  class_year INTEGER NOT NULL,
  current_position TEXT NOT NULL,
  achievement TEXT NOT NULL,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notable_alumni ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view notable alumni"
  ON public.notable_alumni FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "SuperAdmin can manage notable alumni"
  ON public.notable_alumni FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- CBC PAGE TABLES

-- CBC Partnership Images
CREATE TABLE IF NOT EXISTS public.cbc_partnership_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cbc_partnership_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cbc images"
  ON public.cbc_partnership_images FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "SuperAdmin can manage cbc images"
  ON public.cbc_partnership_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- PROGRAMS PAGE TABLES

-- Leadership Programs
CREATE TABLE IF NOT EXISTS public.leadership_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leadership_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leadership programs"
  ON public.leadership_programs FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "SuperAdmin can manage leadership programs"
  ON public.leadership_programs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Program Members
CREATE TABLE IF NOT EXISTS public.program_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES public.leadership_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  message TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.program_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view program members"
  ON public.program_members FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "SuperAdmin can manage program members"
  ON public.program_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subjects"
  ON public.subjects FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "SuperAdmin can manage subjects"
  ON public.subjects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Beyond Classroom
CREATE TABLE IF NOT EXISTS public.beyond_classroom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.beyond_classroom ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view beyond classroom"
  ON public.beyond_classroom FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "SuperAdmin can manage beyond classroom"
  ON public.beyond_classroom FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Departments
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view departments"
  ON public.departments FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "SuperAdmin can manage departments"
  ON public.departments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Department Staff
CREATE TABLE IF NOT EXISTS public.department_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  image_url TEXT,
  bio TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.department_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view department staff"
  ON public.department_staff FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "SuperAdmin can manage department staff"
  ON public.department_staff FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- STUDENT VOICE PAGE TABLES

-- Student Ambassador
CREATE TABLE IF NOT EXISTS public.student_ambassador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  message TEXT NOT NULL,
  quote TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.student_ambassador ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view student ambassador"
  ON public.student_ambassador FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "SuperAdmin can manage student ambassador"
  ON public.student_ambassador FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Active Students
CREATE TABLE IF NOT EXISTS public.active_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  club_or_activity TEXT NOT NULL,
  achievement TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.active_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active students"
  ON public.active_students FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "SuperAdmin can manage active students"
  ON public.active_students FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Clubs & Societies
CREATE TABLE IF NOT EXISTS public.clubs_societies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  member_count INTEGER,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clubs_societies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view clubs societies"
  ON public.clubs_societies FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "SuperAdmin can manage clubs societies"
  ON public.clubs_societies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Student Life Videos
CREATE TABLE IF NOT EXISTS public.student_life_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.student_life_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view student life videos"
  ON public.student_life_videos FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "SuperAdmin can manage student life videos"
  ON public.student_life_videos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Previous Student Leaders
CREATE TABLE IF NOT EXISTS public.previous_leaders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  year INTEGER NOT NULL,
  achievement TEXT NOT NULL,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.previous_leaders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view previous leaders"
  ON public.previous_leaders FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "SuperAdmin can manage previous leaders"
  ON public.previous_leaders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- ADMISSIONS TABLES

-- Admission Requests
CREATE TABLE IF NOT EXISTS public.admission_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  form_grade TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admission_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admission_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit admission request"
  ON public.admission_requests FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can view own requests"
  ON public.admission_requests FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "SuperAdmin can manage admission requests"
  ON public.admission_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Admission Letters
CREATE TABLE IF NOT EXISTS public.admission_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_number TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  form_grade TEXT NOT NULL,
  gender TEXT,
  curriculum TEXT DEFAULT 'CBC',
  letter_url TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired')),
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admission_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmin can manage admission letters"
  ON public.admission_letters FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Required Documents
CREATE TABLE IF NOT EXISTS public.required_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.required_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view required documents"
  ON public.required_documents FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "SuperAdmin can manage required documents"
  ON public.required_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_parent_testimonials_display_order ON public.parent_testimonials(display_order);
CREATE INDEX IF NOT EXISTS idx_facilities_display_order ON public.facilities(display_order);
CREATE INDEX IF NOT EXISTS idx_academic_excellence_year ON public.academic_excellence(year DESC);
CREATE INDEX IF NOT EXISTS idx_notable_alumni_year ON public.notable_alumni(class_year DESC);
CREATE INDEX IF NOT EXISTS idx_admission_requests_status ON public.admission_requests(status);
CREATE INDEX IF NOT EXISTS idx_admission_letters_number ON public.admission_letters(admission_number);