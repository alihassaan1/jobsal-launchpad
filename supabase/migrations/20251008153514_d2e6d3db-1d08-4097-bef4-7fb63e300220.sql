-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for resumes
CREATE POLICY "Users can upload their own resumes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own resumes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Employers can view resumes of applicants to their jobs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes' AND
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON a.job_id = j.id
      JOIN public.companies c ON j.company_id = c.id
      WHERE a.resume_url = storage.objects.name
        AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all resumes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes' AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can update their own resumes"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own resumes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to automatically set viewed_at when status changes from 'applied'
CREATE OR REPLACE FUNCTION public.update_application_viewed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != 'applied' AND OLD.status = 'applied' AND NEW.viewed_at IS NULL THEN
    NEW.viewed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update viewed_at
CREATE TRIGGER set_application_viewed_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_application_viewed_at();