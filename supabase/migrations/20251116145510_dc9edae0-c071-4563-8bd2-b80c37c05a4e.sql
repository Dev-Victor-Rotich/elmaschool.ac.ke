-- Create school_occasions table for managing special periods
CREATE TABLE public.school_occasions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  message TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.school_occasions ENABLE ROW LEVEL SECURITY;

-- Anyone can view school occasions
CREATE POLICY "Anyone can view school occasions"
ON public.school_occasions
FOR SELECT
USING (true);

-- SuperAdmin can manage school occasions
CREATE POLICY "SuperAdmin can manage school occasions"
ON public.school_occasions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_school_occasions_updated_at
BEFORE UPDATE ON public.school_occasions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();