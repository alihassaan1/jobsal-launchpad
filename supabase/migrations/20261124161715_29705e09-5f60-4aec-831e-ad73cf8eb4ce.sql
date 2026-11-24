CREATE OR REPLACE FUNCTION public.admin_list_applications()
RETURNS TABLE(id uuid, created_at timestamptz, status application_status, viewed_at timestamptz, ai_match_score numeric, resume_url text, cover_letter text, notes text, extracted_data jsonb,
 applicant_id uuid, applicant_name text, applicant_email text, applicant_phone text, applicant_location text, applicant_linkedin text, applicant_signed_up timestamptz,
 job_id uuid, job_title text, job_slug text, company_id uuid, company_name text, company_slug text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  RETURN QUERY
  SELECT a.id, a.created_at, a.status, a.viewed_at, a.ai_match_score, a.resume_url, a.cover_letter, a.notes, a.extracted_data,
    a.applicant_id, p.full_name, p.email, p.phone, p.location, p.linkedin_url, p.created_at,
    j.id, j.title, j.slug, c.id, c.name, c.slug
  FROM public.applications a
  LEFT JOIN public.profiles p ON p.id = a.applicant_id
  LEFT JOIN public.jobs j ON j.id = a.job_id
  LEFT JOIN public.companies c ON c.id = j.company_id
  ORDER BY a.created_at DESC, a.id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_application_documents(_application_id uuid)
RETURNS TABLE(id uuid, doc_type user_document_type, title text, file_name text, file_path text, mime_type text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  RETURN QUERY SELECT d.id, d.doc_type, d.title, d.file_name, d.file_path, d.mime_type
  FROM public.application_documents ad JOIN public.user_documents d ON d.id = ad.document_id
  WHERE ad.application_id = _application_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_application_counts()
RETURNS TABLE(job_id uuid, company_id uuid, total bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  RETURN QUERY SELECT a.job_id, j.company_id, count(*) FROM public.applications a JOIN public.jobs j ON j.id = a.job_id GROUP BY a.job_id, j.company_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_list_applications(), public.admin_application_documents(uuid), public.admin_application_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_applications(), public.admin_application_documents(uuid), public.admin_application_counts() TO authenticated;