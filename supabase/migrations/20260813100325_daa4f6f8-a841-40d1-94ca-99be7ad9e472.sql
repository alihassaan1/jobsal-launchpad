
-- Document type enum
DO $$ BEGIN
  CREATE TYPE public.user_document_type AS ENUM ('certification', 'cover_letter', 'experience_letter');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type public.user_document_type NOT NULL,
  title text,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  file_size integer NOT NULL,
  thumbnail_path text,
  is_verified boolean NOT NULL DEFAULT false,
  verification_error text,
  -- future-ready: gate employer access behind payment/credits
  gated_access boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_documents TO authenticated;
GRANT ALL ON public.user_documents TO service_role;

ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own documents"
ON public.user_documents FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all documents"
ON public.user_documents FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update documents"
ON public.user_documents FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete documents"
ON public.user_documents FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS user_documents_user_idx ON public.user_documents(user_id) WHERE is_deleted = false;

CREATE TRIGGER update_user_documents_updated_at
BEFORE UPDATE ON public.user_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link documents to applications
CREATE TABLE IF NOT EXISTS public.application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.user_documents(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id, document_id)
);

GRANT SELECT, INSERT, DELETE ON public.application_documents TO authenticated;
GRANT ALL ON public.application_documents TO service_role;

ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants manage their application documents"
ON public.application_documents FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.applications a
  WHERE a.id = application_id AND a.applicant_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.applications a
  WHERE a.id = application_id AND a.applicant_id = auth.uid()
));

CREATE POLICY "Employers view documents for their job applications"
ON public.application_documents FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1
  FROM public.applications a
  JOIN public.jobs j ON j.id = a.job_id
  WHERE a.id = application_id
    AND (public.is_company_member(j.company_id, auth.uid(), 'viewer') OR public.has_role(auth.uid(), 'admin'))
));

CREATE INDEX IF NOT EXISTS application_documents_application_idx ON public.application_documents(application_id);

-- Employers can read the metadata of documents attached to their applications
CREATE POLICY "Employers view attached document metadata"
ON public.user_documents FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1
  FROM public.application_documents ad
  JOIN public.applications a ON a.id = ad.application_id
  JOIN public.jobs j ON j.id = a.job_id
  WHERE ad.document_id = public.user_documents.id
    AND public.is_company_member(j.company_id, auth.uid(), 'viewer')
));

-- Future-ready employer permission level for a later paywall
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS document_access text NOT NULL DEFAULT 'attached_only';

-- Admin settings
INSERT INTO public.admin_settings (key, value, description) VALUES
  ('documents_enabled', 'true', 'Enable candidate document uploads'),
  ('documents_max_size_mb', '5', 'Maximum size per uploaded document in MB'),
  ('documents_max_per_user', '10', 'Maximum documents per user')
ON CONFLICT (key) DO NOTHING;
