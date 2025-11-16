-- Ensure magic link tokens table exists
CREATE TABLE IF NOT EXISTS public.magic_link_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on magic_link_tokens
ALTER TABLE public.magic_link_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Only system can manage tokens
CREATE POLICY "System can manage magic link tokens"
ON public.magic_link_tokens
FOR ALL
USING (true)
WITH CHECK (true);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_hash ON public.magic_link_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_email ON public.magic_link_tokens(email);

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_magic_links()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.magic_link_tokens
  WHERE expires_at < now() OR used = true;
END;
$$;

-- Note: SuperAdmin user must be created manually first
-- After creating the user in Supabase Auth with email: chelelgorotichvictor2604@gmail.com
-- You'll need to assign them the super_admin role in user_roles table