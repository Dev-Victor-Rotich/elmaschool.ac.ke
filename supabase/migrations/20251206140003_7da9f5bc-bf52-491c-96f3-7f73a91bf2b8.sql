-- Create class_subject_offerings table for compulsory/selective subjects per class
CREATE TABLE public.class_subject_offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  sub_subject TEXT,
  offering_type TEXT NOT NULL CHECK (offering_type IN ('compulsory', 'selective')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(class_name, subject_id, sub_subject)
);

-- Create grade_boundaries table for marks-to-grade mapping
CREATE TABLE public.grade_boundaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  sub_subject TEXT,
  boundary_type TEXT NOT NULL CHECK (boundary_type IN ('overall', 'subject')),
  min_marks INTEGER NOT NULL,
  max_marks INTEGER NOT NULL,
  grade TEXT NOT NULL,
  points INTEGER NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_marks_range CHECK (min_marks >= 0 AND max_marks <= 100 AND min_marks <= max_marks)
);

-- Create exams table for exam metadata
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name TEXT NOT NULL,
  exam_name TEXT NOT NULL,
  term TEXT NOT NULL,
  year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  timetable JSONB,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create teacher_subject_assignments table for staff-to-subject-class mapping
CREATE TABLE public.teacher_subject_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  sub_subject TEXT,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(teacher_id, class_name, subject_id, sub_subject)
);

-- Enable RLS on all tables
ALTER TABLE public.class_subject_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_boundaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subject_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for class_subject_offerings
CREATE POLICY "Class teachers can manage offerings in their class"
ON public.class_subject_offerings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM classteacher_assignments ca
    WHERE ca.user_id = auth.uid() AND ca.assigned_class = class_subject_offerings.class_name
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classteacher_assignments ca
    WHERE ca.user_id = auth.uid() AND ca.assigned_class = class_subject_offerings.class_name
  )
);

CREATE POLICY "Super admins can manage all offerings"
ON public.class_subject_offerings FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Teachers can view offerings for their assigned classes"
ON public.class_subject_offerings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM teacher_subject_assignments tsa
    WHERE tsa.teacher_id = auth.uid() AND tsa.class_name = class_subject_offerings.class_name
  )
);

CREATE POLICY "Anyone authenticated can view offerings"
ON public.class_subject_offerings FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policies for grade_boundaries
CREATE POLICY "Class teachers can manage boundaries in their class"
ON public.grade_boundaries FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM classteacher_assignments ca
    WHERE ca.user_id = auth.uid() AND ca.assigned_class = grade_boundaries.class_name
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classteacher_assignments ca
    WHERE ca.user_id = auth.uid() AND ca.assigned_class = grade_boundaries.class_name
  )
);

CREATE POLICY "Super admins can manage all boundaries"
ON public.grade_boundaries FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Anyone authenticated can view boundaries"
ON public.grade_boundaries FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policies for exams
CREATE POLICY "Class teachers can manage exams in their class"
ON public.exams FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM classteacher_assignments ca
    WHERE ca.user_id = auth.uid() AND ca.assigned_class = exams.class_name
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classteacher_assignments ca
    WHERE ca.user_id = auth.uid() AND ca.assigned_class = exams.class_name
  )
);

CREATE POLICY "Super admins can manage all exams"
ON public.exams FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Anyone authenticated can view exams"
ON public.exams FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policies for teacher_subject_assignments
CREATE POLICY "Class teachers can manage teacher assignments in their class"
ON public.teacher_subject_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM classteacher_assignments ca
    WHERE ca.user_id = auth.uid() AND ca.assigned_class = teacher_subject_assignments.class_name
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classteacher_assignments ca
    WHERE ca.user_id = auth.uid() AND ca.assigned_class = teacher_subject_assignments.class_name
  )
);

CREATE POLICY "Super admins can manage all teacher assignments"
ON public.teacher_subject_assignments FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Teachers can view their own assignments"
ON public.teacher_subject_assignments FOR SELECT
USING (teacher_id = auth.uid());

-- Create updated_at triggers
CREATE TRIGGER update_class_subject_offerings_updated_at
BEFORE UPDATE ON public.class_subject_offerings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grade_boundaries_updated_at
BEFORE UPDATE ON public.grade_boundaries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exams_updated_at
BEFORE UPDATE ON public.exams
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teacher_subject_assignments_updated_at
BEFORE UPDATE ON public.teacher_subject_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();