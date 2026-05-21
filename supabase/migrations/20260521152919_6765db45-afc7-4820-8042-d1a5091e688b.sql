
-- Resync counts for any pre-existing data
UPDATE public.jobs j
SET applications_count = COALESCE(sub.cnt, 0)
FROM (
  SELECT job_id, COUNT(*)::int AS cnt FROM public.applications GROUP BY job_id
) sub
WHERE j.id = sub.job_id AND j.applications_count IS DISTINCT FROM sub.cnt;

UPDATE public.jobs SET applications_count = 0 WHERE applications_count IS NULL;

-- Recreate public view to include counters
DROP VIEW IF EXISTS public.jobs_public;
CREATE VIEW public.jobs_public
WITH (security_invoker = on) AS
SELECT
  id, company_id, posted_by, title, slug, description, requirements, responsibilities,
  job_type, experience_level, category, location, is_remote,
  salary_min, salary_max, salary_currency, is_salary_visible,
  skills, benefits, application_deadline, is_active, is_featured,
  seo_title, seo_description, created_at, updated_at,
  applications_count, views_count
FROM public.jobs
WHERE is_active = true;

GRANT SELECT ON public.jobs_public TO anon, authenticated;
