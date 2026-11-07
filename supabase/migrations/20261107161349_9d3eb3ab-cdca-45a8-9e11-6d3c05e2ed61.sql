CREATE OR REPLACE FUNCTION public.settle_paid_job_order(_order_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.paypal_orders; j public.jobs; days integer; ends timestamptz:=now()+interval '30 days';
BEGIN
 SELECT * INTO o FROM public.paypal_orders WHERE id=_order_id FOR UPDATE;
 IF o.id IS NULL OR o.client_offer_id IS NOT NULL THEN RAISE EXCEPTION 'Job order not found'; END IF;
 IF o.status='completed' THEN RETURN o.job_id; END IF;
 IF o.job_id IS NULL THEN RAISE EXCEPTION 'Job required'; END IF;
 SELECT * INTO j FROM public.jobs WHERE id=o.job_id FOR UPDATE;
 IF j.id IS NULL OR j.posted_by<>o.user_id THEN RAISE EXCEPTION 'Job not found'; END IF;
 days:=CASE WHEN o.urgent THEN 30 ELSE o.featured_days END;
 INSERT INTO public.job_listings(employer_user_id,company_id,job_id,product_key,listing_tier,price_eur,starts_at,ends_at,featured_until,paypal_order_id) VALUES(o.user_id,j.company_id,j.id,o.product_key,o.product_key,o.amount_cents::numeric/100,now(),ends,CASE WHEN days>0 THEN now()+make_interval(days=>days) ELSE NULL END,o.id);
 UPDATE public.jobs SET is_active=true,payment_status='paid',is_featured=days>0,updated_at=now() WHERE id=j.id;
 UPDATE public.paypal_orders SET status='completed',captured_at=coalesce(captured_at,now()) WHERE id=o.id;
 RETURN j.id;
END $$;
REVOKE ALL ON FUNCTION public.settle_paid_job_order(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.settle_paid_job_order(uuid) TO service_role;