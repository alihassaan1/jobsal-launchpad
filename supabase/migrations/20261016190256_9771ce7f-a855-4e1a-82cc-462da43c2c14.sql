ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS paypal_subscription_id text,
  ADD COLUMN IF NOT EXISTS paypal_plan_id text,
  ADD COLUMN IF NOT EXISTS plan_slug text,
  ADD COLUMN IF NOT EXISTS amount_eur numeric(10,2),
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS last_payment_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_payment_amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_paypal_sub_uidx ON public.subscriptions (paypal_subscription_id) WHERE paypal_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS subscriptions_period_end_idx ON public.subscriptions (current_period_end) WHERE paypal_subscription_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.job_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_user_id uuid NOT NULL,
  company_id uuid,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  product_key text NOT NULL,
  listing_tier text NOT NULL,
  price_eur numeric(10,2) NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  featured_until timestamptz,
  status text NOT NULL DEFAULT 'active',
  paypal_order_id uuid REFERENCES public.paypal_orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_listings_employer_idx ON public.job_listings (employer_user_id, status);

GRANT SELECT ON public.job_listings TO authenticated;
GRANT ALL ON public.job_listings TO service_role;

ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers view own listings"
  ON public.job_listings FOR SELECT TO authenticated
  USING (auth.uid() = employer_user_id);