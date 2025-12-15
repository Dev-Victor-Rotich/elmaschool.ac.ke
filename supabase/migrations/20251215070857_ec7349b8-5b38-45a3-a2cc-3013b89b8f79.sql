-- Add RLS policies for other staff roles to view staff_registry
-- This enables them to look up their own staff record for My Classes functionality

CREATE POLICY "Bursars can view staff registry"
ON public.staff_registry
FOR SELECT
USING (has_role(auth.uid(), 'bursar'::app_role));

CREATE POLICY "HODs can view staff registry"
ON public.staff_registry
FOR SELECT
USING (has_role(auth.uid(), 'hod'::app_role));

CREATE POLICY "Chaplains can view staff registry"
ON public.staff_registry
FOR SELECT
USING (has_role(auth.uid(), 'chaplain'::app_role));

CREATE POLICY "Librarians can view staff registry"
ON public.staff_registry
FOR SELECT
USING (has_role(auth.uid(), 'librarian'::app_role));