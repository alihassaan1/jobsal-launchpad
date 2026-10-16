CREATE TABLE IF NOT EXISTS public.paypal_plans (
  product_key text PRIMARY KEY,
  paypal_product_id text NOT NULL,
  paypal_plan_id text NOT NULL,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.paypal_plans TO authenticated;
GRANT ALL ON public.paypal_plans TO service_role;

ALTER TABLE public.paypal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can read plan ids"
  ON public.paypal_plans FOR SELECT TO authenticated USING (true);