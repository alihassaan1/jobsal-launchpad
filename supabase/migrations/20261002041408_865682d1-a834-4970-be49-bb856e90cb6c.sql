ALTER VIEW public.jobs_public SET (security_invoker = off);

GRANT SELECT ON public.jobs_public TO anon;
GRANT SELECT ON public.jobs_public TO authenticated;
GRANT SELECT ON public.jobs_public TO service_role;