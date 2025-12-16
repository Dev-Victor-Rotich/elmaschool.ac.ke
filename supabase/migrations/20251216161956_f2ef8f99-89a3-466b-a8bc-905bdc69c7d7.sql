-- Create fee_structures table for defining fees per class/term/year
CREATE TABLE public.fee_structures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_name TEXT NOT NULL,
  term TEXT NOT NULL,
  year INTEGER NOT NULL,
  tuition_fee NUMERIC NOT NULL DEFAULT 0,
  boarding_fee NUMERIC NOT NULL DEFAULT 0,
  activity_fee NUMERIC NOT NULL DEFAULT 0,
  other_fees NUMERIC NOT NULL DEFAULT 0,
  total_fee NUMERIC GENERATED ALWAYS AS (tuition_fee + boarding_fee + activity_fee + other_fees) STORED,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_name, term, year)
);

-- Enable RLS
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;

-- Bursar can manage fee structures
CREATE POLICY "Bursar can manage fee structures"
ON public.fee_structures
FOR ALL
USING (has_role(auth.uid(), 'bursar'::app_role))
WITH CHECK (has_role(auth.uid(), 'bursar'::app_role));

-- Super admins can manage fee structures
CREATE POLICY "Super admins can manage fee structures"
ON public.fee_structures
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Anyone authenticated can view fee structures (for students/parents)
CREATE POLICY "Authenticated users can view fee structures"
ON public.fee_structures
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_fee_structures_updated_at
BEFORE UPDATE ON public.fee_structures
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();