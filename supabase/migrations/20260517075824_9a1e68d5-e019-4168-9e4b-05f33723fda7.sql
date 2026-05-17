DROP VIEW IF EXISTS public.companies_public CASCADE;
DROP VIEW IF EXISTS public.posts_public CASCADE;

CREATE VIEW public.companies_public
WITH (security_invoker=on) AS
SELECT id, owner_id, name, slug, description, logo_url, banner_url, website,
       industry, company_size, location, email, phone, founded_year,
       is_verified, is_sponsored, sponsorship_plan, is_top_employer,
       top_employer_start_date, top_employer_end_date, top_employer_plan_type,
       branded_page_enabled, brand_video_url, brand_gallery, testimonials,
       mission, culture, benefits_summary, social_links,
       followers_count,
       created_at, updated_at
FROM public.companies;

CREATE VIEW public.posts_public
WITH (security_invoker=on) AS
SELECT id, author_id, blog_author_id, company_id, title, slug, content, excerpt,
       featured_image, category, tags, language, is_published, is_sponsored,
       published_at, meta_title, meta_description, meta_keywords,
       views_count,
       created_at, updated_at
FROM public.posts
WHERE is_published = true;

GRANT SELECT ON public.companies_public TO anon, authenticated;
GRANT SELECT ON public.posts_public TO anon, authenticated;