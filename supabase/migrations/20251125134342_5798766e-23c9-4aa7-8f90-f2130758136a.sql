-- Create impersonation_logs table to track when super admin views user dashboards
CREATE TABLE IF NOT EXISTS public.impersonation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  impersonated_user_id UUID NOT NULL,
  impersonated_user_email TEXT NOT NULL,
  impersonated_user_name TEXT NOT NULL,
  impersonated_role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.impersonation_logs ENABLE ROW LEVEL SECURITY;

-- Super admins can view all impersonation logs
CREATE POLICY "Super admins can view impersonation logs"
ON public.impersonation_logs
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

-- System can insert impersonation logs
CREATE POLICY "System can insert impersonation logs"
ON public.impersonation_logs
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_super_admin ON public.impersonation_logs(super_admin_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_impersonated_user ON public.impersonation_logs(impersonated_user_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_created_at ON public.impersonation_logs(created_at DESC);