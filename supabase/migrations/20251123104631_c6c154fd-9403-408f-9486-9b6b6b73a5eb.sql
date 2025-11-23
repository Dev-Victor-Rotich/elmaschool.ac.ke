-- Drop the RLS policy that depends on the approved column
DROP POLICY IF EXISTS "Anyone can view approved events" ON public.events;

-- Remove display_order and approved columns from events table
ALTER TABLE public.events DROP COLUMN IF EXISTS display_order;
ALTER TABLE public.events DROP COLUMN IF EXISTS approved;

-- Create new RLS policy without the approved column
CREATE POLICY "Anyone can view events"
ON public.events
FOR SELECT
USING (true);