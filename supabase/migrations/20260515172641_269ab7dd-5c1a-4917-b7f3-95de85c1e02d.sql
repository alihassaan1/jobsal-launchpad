
CREATE TABLE IF NOT EXISTS public.admin_impersonation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  target_email text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  ip_address text,
  user_agent text
);

ALTER TABLE public.admin_impersonation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage impersonation logs"
ON public.admin_impersonation_logs
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX IF NOT EXISTS idx_imp_logs_admin ON public.admin_impersonation_logs(admin_user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_imp_logs_target ON public.admin_impersonation_logs(target_user_id, started_at DESC);
