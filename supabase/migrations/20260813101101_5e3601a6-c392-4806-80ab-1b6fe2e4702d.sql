
CREATE POLICY "Users can read own documents files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own documents files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own documents files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documents files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can read documents files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'user-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete documents files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'user-documents' AND public.has_role(auth.uid(), 'admin'));
