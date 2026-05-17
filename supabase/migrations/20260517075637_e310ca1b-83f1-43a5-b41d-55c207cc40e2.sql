-- Public-safe views excluding analytics counts
CREATE OR REPLACE VIEW public.jobs_public
WITH (security_invoker=on) AS
SELECT id, company_id, posted_by, title, slug, description, requirements, responsibilities,
       job_type, experience_level, category, location, is_remote,
       salary_min, salary_max, salary_currency, is_salary_visible,
       skills, benefits, application_deadline, is_active, is_featured,
       seo_title, seo_description, created_at, updated_at
FROM public.jobs
WHERE is_active = true;

CREATE OR REPLACE VIEW public.companies_public
WITH (security_invoker=on) AS
SELECT id, owner_id, name, slug, description, logo_url, banner_url, website,
       industry, company_size, location, email, phone, founded_year,
       is_verified, is_sponsored, sponsorship_plan, is_top_employer,
       top_employer_start_date, top_employer_end_date, top_employer_plan_type,
       branded_page_enabled, brand_video_url, brand_gallery, testimonials,
       mission, culture, benefits_summary, social_links, created_at, updated_at
FROM public.companies;

CREATE OR REPLACE VIEW public.posts_public
WITH (security_invoker=on) AS
SELECT id, author_id, blog_author_id, company_id, title, slug, content, excerpt,
       featured_image, category, tags, language, is_published, is_sponsored,
       published_at, meta_title, meta_description, meta_keywords,
       created_at, updated_at
FROM public.posts
WHERE is_published = true;

GRANT SELECT ON public.jobs_public TO anon, authenticated;
GRANT SELECT ON public.companies_public TO anon, authenticated;
GRANT SELECT ON public.posts_public TO anon, authenticated;

-- Tighten base SELECT policies so analytics columns are not directly readable
DROP POLICY IF EXISTS "Anyone can view active jobs" ON public.jobs;
CREATE POLICY "Owners admins members view jobs"
  ON public.jobs FOR SELECT
  USING (
    auth.uid() = posted_by
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.companies c WHERE c.id = jobs.company_id AND c.owner_id = auth.uid())
    OR public.is_company_member(jobs.company_id, auth.uid(), 'viewer'::public.company_member_role)
  );

DROP POLICY IF EXISTS "Anyone can view active companies" ON public.companies;
CREATE POLICY "Owners admins members view companies"
  ON public.companies FOR SELECT
  USING (
    auth.uid() = owner_id
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_company_member(id, auth.uid(), 'viewer'::public.company_member_role)
  );

DROP POLICY IF EXISTS "Anyone can view published posts" ON public.posts;