
ALTER VIEW public.jobs_public SET (security_invoker = off);
ALTER VIEW public.companies_public SET (security_invoker = off);
ALTER VIEW public.posts_public SET (security_invoker = off);

GRANT SELECT ON public.jobs_public TO anon, authenticated;
GRANT SELECT ON public.companies_public TO anon, authenticated;
GRANT SELECT ON public.posts_public TO anon, authenticated;
