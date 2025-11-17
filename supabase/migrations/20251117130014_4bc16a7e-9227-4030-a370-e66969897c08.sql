-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for avatars bucket
-- Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policies for documents bucket
-- Super admins can view all documents
CREATE POLICY "Super admins can view all documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Super admins can upload documents
CREATE POLICY "Super admins can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Super admins can update documents
CREATE POLICY "Super admins can update documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Super admins can delete documents
CREATE POLICY "Super admins can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- FIX CRITICAL SECURITY ISSUE: Remove public access to admission_requests table
-- This table contains parent contact information that could be harvested by scammers
DROP POLICY IF EXISTS "Anyone can submit admission request" ON public.admission_requests;

-- Only allow inserting admission requests (no public SELECT)
CREATE POLICY "Allow public to submit admission requests"
ON public.admission_requests
FOR INSERT
WITH CHECK (true);

-- Only super admins can view admission requests
CREATE POLICY "Super admins can view admission requests"
ON public.admission_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Only super admins can update admission requests
CREATE POLICY "Super admins can update admission requests"
ON public.admission_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Only super admins can delete admission requests
CREATE POLICY "Super admins can delete admission requests"
ON public.admission_requests
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);