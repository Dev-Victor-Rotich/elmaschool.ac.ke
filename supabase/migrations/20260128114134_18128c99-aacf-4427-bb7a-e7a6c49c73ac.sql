-- Add storage upload policies for student content editors (student_leader and class_rep roles)

-- Gallery bucket - allow student content editors to upload
CREATE POLICY "Student content editors can upload to gallery"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery' 
  AND public.is_student_content_editor(auth.uid())
);

-- Gallery bucket - allow student content editors to update
CREATE POLICY "Student content editors can update gallery"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gallery' 
  AND public.is_student_content_editor(auth.uid())
);

-- Gallery bucket - allow student content editors to delete
CREATE POLICY "Student content editors can delete from gallery"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery' 
  AND public.is_student_content_editor(auth.uid())
);

-- Student photos bucket - allow student content editors to upload
CREATE POLICY "Student content editors can upload student photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'student-photos' 
  AND public.is_student_content_editor(auth.uid())
);

-- Student photos bucket - allow student content editors to update
CREATE POLICY "Student content editors can update student photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'student-photos' 
  AND public.is_student_content_editor(auth.uid())
);

-- Student photos bucket - allow student content editors to delete
CREATE POLICY "Student content editors can delete student photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'student-photos' 
  AND public.is_student_content_editor(auth.uid())
);

-- General assets bucket - allow student content editors to upload
CREATE POLICY "Student content editors can upload to general-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'general-assets' 
  AND public.is_student_content_editor(auth.uid())
);

-- General assets bucket - allow student content editors to update
CREATE POLICY "Student content editors can update general-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'general-assets' 
  AND public.is_student_content_editor(auth.uid())
);

-- General assets bucket - allow student content editors to delete
CREATE POLICY "Student content editors can delete from general-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'general-assets' 
  AND public.is_student_content_editor(auth.uid())
);

-- Videos bucket - allow student content editors to upload
CREATE POLICY "Student content editors can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' 
  AND public.is_student_content_editor(auth.uid())
);

-- Videos bucket - allow student content editors to update
CREATE POLICY "Student content editors can update videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos' 
  AND public.is_student_content_editor(auth.uid())
);

-- Videos bucket - allow student content editors to delete
CREATE POLICY "Student content editors can delete videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' 
  AND public.is_student_content_editor(auth.uid())
);