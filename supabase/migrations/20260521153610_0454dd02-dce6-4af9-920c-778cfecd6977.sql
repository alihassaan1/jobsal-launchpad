
-- Allow clients (and the apply flow) to fetch the minimum employer contact info
-- needed to send the "new applicant" notification email, without exposing the
-- full companies/profiles tables to job seekers.
CREATE OR REPLACE FUNCTION public.get_job_employer_contact(_job_id uuid)
RETURNS TABLE(owner_id uuid, employer_email text, employer_name text, company_name text, job_title text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    c.owner_id,
    p.email AS employer_email,
    p.full_name AS employer_name,
    c.name AS company_name,
    j.title AS job_title
  FROM public.jobs j
  JOIN public.companies c ON c.id = j.company_id
  LEFT JOIN public.profiles p ON p.id = c.owner_id
  WHERE j.id = _job_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_job_employer_contact(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_job_employer_contact(uuid) TO authenticated;
