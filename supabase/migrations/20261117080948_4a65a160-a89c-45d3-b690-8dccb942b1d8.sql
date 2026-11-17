CREATE TABLE public.internal_cron_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.internal_cron_tokens TO service_role;
ALTER TABLE public.internal_cron_tokens ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.create_internal_cron_token(_task text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
BEGIN
  IF _task NOT IN ('scheduled-job-alerts', 'scheduled-email-reminders', 'paypal-subscription-sync') THEN
    RAISE EXCEPTION 'Unsupported scheduled task';
  END IF;
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  DELETE FROM public.internal_cron_tokens WHERE expires_at <= now();
  INSERT INTO public.internal_cron_tokens (task, token_hash, expires_at)
  VALUES (_task, encode(digest(v_token, 'sha256'), 'hex'), now() + interval '2 minutes');
  RETURN v_token;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.create_internal_cron_token(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_internal_cron_token(text) TO service_role;

CREATE OR REPLACE FUNCTION public.consume_internal_cron_token(_token text, _task text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.internal_cron_tokens
  WHERE token_hash = encode(digest(_token, 'sha256'), 'hex')
    AND task = _task
    AND expires_at > now();
  RETURN FOUND;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.consume_internal_cron_token(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_internal_cron_token(text, text) TO service_role;

CREATE TABLE public.page_view_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('job', 'company')),
  content_id uuid NOT NULL,
  visitor_hash text NOT NULL,
  bucket bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_type, content_id, visitor_hash)
);
GRANT ALL ON public.page_view_receipts TO service_role;
ALTER TABLE public.page_view_receipts ENABLE ROW LEVEL SECURITY;
CREATE INDEX page_view_receipts_created_at_idx ON public.page_view_receipts (created_at);

ALTER TABLE public.ad_purchases
  ADD COLUMN IF NOT EXISTS paypal_order_id uuid REFERENCES public.paypal_orders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_ad_purchases_paypal_order_id ON public.ad_purchases (paypal_order_id);

CREATE OR REPLACE FUNCTION public.guard_client_ad_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('authenticated','anon') OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  NEW.status := 'pending';
  NEW.payment_reference := NULL;
  NEW.paypal_order_id := NULL;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.settle_ad_order(_order_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o public.paypal_orders;
  v_promo uuid;
  v_company uuid;
  v_count integer;
  v_purchase record;
BEGIN
  SELECT * INTO o FROM public.paypal_orders WHERE id = _order_id FOR UPDATE;
  IF o.id IS NULL OR o.product_key <> 'ad_checkout' THEN
    RAISE EXCEPTION 'Advertising order not found';
  END IF;
  IF o.status = 'completed' THEN
    SELECT count(*) INTO v_count FROM public.ad_purchases WHERE paypal_order_id = o.id;
    RETURN v_count;
  END IF;

  SELECT id, promo_code_id, company_id INTO v_purchase
  FROM public.ad_purchases WHERE paypal_order_id = o.id LIMIT 1;
  IF v_purchase.id IS NULL THEN
    RAISE EXCEPTION 'Advertising purchases not found';
  END IF;
  v_promo := v_purchase.promo_code_id;
  v_company := v_purchase.company_id;

  IF v_promo IS NOT NULL THEN
    UPDATE public.promo_codes
    SET current_uses = COALESCE(current_uses, 0) + 1, updated_at = now()
    WHERE id = v_promo AND (max_uses IS NULL OR COALESCE(current_uses, 0) < max_uses);
    IF NOT FOUND THEN RAISE EXCEPTION 'Promo code usage limit reached'; END IF;
  END IF;

  UPDATE public.ad_purchases
  SET status = 'active', payment_reference = o.paypal_order_id, updated_at = now()
  WHERE paypal_order_id = o.id;
  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.paypal_orders
  SET status = 'completed', captured_at = COALESCE(captured_at, now())
  WHERE id = o.id;

  INSERT INTO public.payment_transactions (
    user_id, company_id, amount, currency, payment_method,
    payment_provider_id, status, metadata
  ) VALUES (
    o.user_id, v_company, o.amount_cents, o.currency, 'paypal',
    o.paypal_order_id, 'completed', jsonb_build_object('kind', 'ad_checkout', 'paypal_order_id', o.id)
  );
  RETURN v_count;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.settle_ad_order(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_ad_order(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.increment_company_views(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_company_views(text) TO service_role;
