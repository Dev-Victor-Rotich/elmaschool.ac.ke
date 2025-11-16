-- Create hero_content table for main hero section
CREATE TABLE IF NOT EXISTS public.hero_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  heading_line1 text NOT NULL DEFAULT 'Growing Confident, Skilled,',
  heading_line2 text NOT NULL DEFAULT 'and Inspired Learners',
  description text NOT NULL DEFAULT 'Welcome to Elma Kamonong High School',
  image_url text NOT NULL,
  enrollment_badge_text text DEFAULT '🎓 NOW ENROLLING 2026 🎓',
  cta1_text text DEFAULT 'Enroll for 2026',
  cta1_link text DEFAULT '/admissions',
  cta2_text text DEFAULT 'Visit Our School',
  cta2_link text DEFAULT '/about',
  badge1_text text DEFAULT 'CBC Accredited',
  badge2_text text DEFAULT '98% Success Rate',
  badge3_text text DEFAULT '10+ Years Excellence',
  updated_at timestamptz DEFAULT now()
);

-- Insert default hero content
INSERT INTO public.hero_content (image_url, heading_line1, heading_line2, description)
VALUES (
  'https://xjvdcyapxvpipemqxsiv.supabase.co/storage/v1/object/public/general-assets/hero-school.jpg',
  'Growing Confident, Skilled,',
  'and Inspired Learners',
  'Welcome to Elma Kamonong High School, where every student is valued, supported, and encouraged to reach their full potential through modern, hands-on learning.'
);

-- Create stats table for statistics counter
CREATE TABLE IF NOT EXISTS public.site_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  value integer NOT NULL,
  suffix text NOT NULL DEFAULT '+',
  icon_name text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default stats
INSERT INTO public.site_stats (label, value, suffix, icon_name, display_order) VALUES
('Students Enrolled', 500, '+', 'Users', 1),
('Success Rate', 98, '%', 'Award', 2),
('Years of Excellence', 10, '+', 'BookOpen', 3),
('Further Learning', 95, '%', 'TrendingUp', 4);

-- Create trust_badges table
CREATE TABLE IF NOT EXISTS public.trust_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  icon_name text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default trust badges
INSERT INTO public.trust_badges (title, description, icon_name, display_order) VALUES
('CBC Accredited', 'Ministry of Education Approved', 'Award', 1),
('Quality Assured', 'Regular Inspections & Standards', 'CheckCircle', 2),
('Safe Environment', '24/7 Security & Supervision', 'Shield', 3),
('Top Rated', '4.9/5 Parent Satisfaction', 'Star', 4);

-- Create home_features table
CREATE TABLE IF NOT EXISTS public.home_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  icon_name text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default features
INSERT INTO public.home_features (title, description, icon_name, display_order) VALUES
('Modern CBC Curriculum', 'Hands-on learning that builds real-world skills and critical thinking', 'BookOpen', 1),
('Supportive Community', 'Caring teachers and staff who know every student by name', 'Users', 2),
('Student Leadership', 'Opportunities to grow confidence through clubs, sports, and projects', 'Award', 3),
('Character Building', 'Focus on values, respect, and becoming responsible citizens', 'Heart', 4);

-- Create faqs table
CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default FAQs
INSERT INTO public.faqs (question, answer, display_order) VALUES
('What is the admission process?', 'Visit our Admissions page for detailed information on requirements, fees, and how to apply for 2026. You can also contact us directly at +254 715 748 735.', 1),
('Do you offer boarding facilities?', 'Yes, we are exclusively a boarding school. We do not admit day scholars. Our boarding facilities are well-maintained with proper supervision to ensure a safe and nurturing environment for all students.', 2),
('What curriculum do you follow?', 'We follow the Competency-Based Curriculum (CBC) which focuses on hands-on learning and real-world skills development.', 3),
('What are the school hours?', 'School starts at 7:30 AM and ends at 4:00 PM. As a boarding school, all students have supervised evening prep sessions and structured activities throughout the day.', 4),
('How can parents track student progress?', 'We conduct regular parent-teacher meetings and provide termly progress reports. Parents can also schedule one-on-one meetings with teachers.', 5);

-- Create cta_banner table
CREATE TABLE IF NOT EXISTS public.cta_banner (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_text text DEFAULT '🎓 NOW ENROLLING 2026 🎓',
  heading text NOT NULL DEFAULT 'Ready to Give Your Child the Best Education?',
  description text NOT NULL DEFAULT 'Join hundreds of families who trust us with their children''s future. Admissions for 2026 are now open.',
  cta1_text text DEFAULT 'Apply Now for 2026',
  cta1_link text DEFAULT '/admissions',
  cta2_text text DEFAULT 'Schedule a Visit',
  cta2_link text DEFAULT '/contact',
  feature1_text text DEFAULT 'Modern Facilities',
  feature2_text text DEFAULT 'Qualified Teachers',
  feature3_text text DEFAULT 'Safe Environment',
  updated_at timestamptz DEFAULT now()
);

-- Insert default CTA banner
INSERT INTO public.cta_banner (heading, description) VALUES
('Ready to Give Your Child the Best Education?', 'Join hundreds of families who trust us with their children''s future. Admissions for 2026 are now open.');

-- Enable RLS on all new tables
ALTER TABLE public.hero_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cta_banner ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow everyone to read, only super_admin can modify)
CREATE POLICY "Anyone can view hero content" ON public.hero_content FOR SELECT USING (true);
CREATE POLICY "SuperAdmin can manage hero content" ON public.hero_content FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role)
);

CREATE POLICY "Anyone can view site stats" ON public.site_stats FOR SELECT USING (true);
CREATE POLICY "SuperAdmin can manage site stats" ON public.site_stats FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role)
);

CREATE POLICY "Anyone can view trust badges" ON public.trust_badges FOR SELECT USING (true);
CREATE POLICY "SuperAdmin can manage trust badges" ON public.trust_badges FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role)
);

CREATE POLICY "Anyone can view home features" ON public.home_features FOR SELECT USING (true);
CREATE POLICY "SuperAdmin can manage home features" ON public.home_features FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role)
);

CREATE POLICY "Anyone can view faqs" ON public.faqs FOR SELECT USING (true);
CREATE POLICY "SuperAdmin can manage faqs" ON public.faqs FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role)
);

CREATE POLICY "Anyone can view cta banner" ON public.cta_banner FOR SELECT USING (true);
CREATE POLICY "SuperAdmin can manage cta banner" ON public.cta_banner FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role)
);

-- Create triggers for updated_at
CREATE TRIGGER update_hero_content_updated_at BEFORE UPDATE ON public.hero_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_stats_updated_at BEFORE UPDATE ON public.site_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trust_badges_updated_at BEFORE UPDATE ON public.trust_badges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_home_features_updated_at BEFORE UPDATE ON public.home_features
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cta_banner_updated_at BEFORE UPDATE ON public.cta_banner
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();