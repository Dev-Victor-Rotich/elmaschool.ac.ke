-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('gallery', 'gallery', true),
  ('staff-photos', 'staff-photos', true),
  ('student-photos', 'student-photos', true),
  ('admission-letters', 'admission-letters', false),
  ('general-assets', 'general-assets', true),
  ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for gallery bucket
CREATE POLICY "Anyone can view gallery images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'gallery');

CREATE POLICY "SuperAdmin can upload to gallery"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'gallery'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "SuperAdmin can delete from gallery"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'gallery'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Storage policies for general-assets bucket
CREATE POLICY "Anyone can view general assets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'general-assets');

CREATE POLICY "SuperAdmin can upload to general-assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'general-assets'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "SuperAdmin can delete from general-assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'general-assets'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Storage policies for staff-photos bucket
CREATE POLICY "Anyone can view staff photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'staff-photos');

CREATE POLICY "SuperAdmin can upload staff photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'staff-photos'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "SuperAdmin can delete staff photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'staff-photos'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Storage policies for student-photos bucket
CREATE POLICY "Anyone can view student photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'student-photos');

CREATE POLICY "SuperAdmin can upload student photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'student-photos'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "SuperAdmin can delete student photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'student-photos'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Storage policies for videos bucket
CREATE POLICY "Anyone can view videos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'videos');

CREATE POLICY "SuperAdmin can upload videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'videos'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "SuperAdmin can delete videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'videos'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Storage policies for admission-letters bucket (private)
CREATE POLICY "SuperAdmin can upload admission letters"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'admission-letters'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "SuperAdmin can delete admission letters"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'admission-letters'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- HOME PAGE TABLES

-- Duty Roster
CREATE TABLE IF NOT EXISTS public.duty_rosters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  month TEXT NOT NULL,
  quote TEXT NOT NULL,
  quote_author TEXT NOT NULL,
  teachers_on_duty JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.duty_rosters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view duty rosters"
  ON public.duty_rosters FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "SuperAdmin can insert duty rosters"
  ON public.duty_rosters FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "SuperAdmin can update duty rosters"
  ON public.duty_rosters FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "SuperAdmin can delete duty rosters"
  ON public.duty_rosters FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Community Testimonials
CREATE TABLE IF NOT EXISTS public.community_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view community testimonials"
  ON public.community_testimonials FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "SuperAdmin can insert community testimonials"
  ON public.community_testimonials FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "SuperAdmin can update community testimonials"
  ON public.community_testimonials FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "SuperAdmin can delete community testimonials"
  ON public.community_testimonials FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Gallery Media
CREATE TABLE IF NOT EXISTS public.gallery_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.gallery_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gallery media"
  ON public.gallery_media FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "SuperAdmin can insert gallery media"
  ON public.gallery_media FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "SuperAdmin can update gallery media"
  ON public.gallery_media FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "SuperAdmin can delete gallery media"
  ON public.gallery_media FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Contact Information
CREATE TABLE IF NOT EXISTS public.contact_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  office_hours TEXT,
  social_media JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contact_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view contact info"
  ON public.contact_info FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "SuperAdmin can update contact info"
  ON public.contact_info FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "SuperAdmin can insert contact info"
  ON public.contact_info FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Update events table with new columns
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS location TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_duty_rosters_date ON public.duty_rosters(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_gallery_display_order ON public.gallery_media(display_order);
CREATE INDEX IF NOT EXISTS idx_testimonials_display_order ON public.community_testimonials(display_order);