CREATE POLICY "Reject browser client access"
ON public.internal_cron_tokens FOR ALL TO anon, authenticated
USING (false) WITH CHECK (false);

CREATE POLICY "Reject browser client access"
ON public.page_view_receipts FOR ALL TO anon, authenticated
USING (false) WITH CHECK (false);
