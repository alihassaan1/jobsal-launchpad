CREATE POLICY "Anyone can view social link settings"
ON public.admin_settings
FOR SELECT
USING (key LIKE 'social_%');

GRANT SELECT ON public.admin_settings TO anon, authenticated;