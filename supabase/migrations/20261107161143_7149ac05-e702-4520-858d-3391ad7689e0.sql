ALTER TABLE public.client_package_offers ADD COLUMN package_name text;
ALTER TABLE public.client_package_offers DROP CONSTRAINT client_package_offers_duration_months_check;
ALTER TABLE public.client_package_offers ADD CONSTRAINT client_package_offers_duration_months_check CHECK (duration_months BETWEEN 1 AND 120);
CREATE OR REPLACE FUNCTION public.publish_employer_credit_job(_job_id uuid, _user_id uuid) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE j public.jobs; s public.subscriptions; used integer; k text; bucket timestamptz := date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(_user_id::text,0));
 SELECT * INTO j FROM public.jobs WHERE id=_job_id FOR UPDATE;
 IF j.id IS NULL OR j.posted_by<>_user_id OR NOT EXISTS(SELECT 1 FROM public.companies WHERE id=j.company_id AND owner_id=_user_id) THEN RAISE EXCEPTION 'Job not found'; END IF;
 IF j.is_active THEN RETURN 'already_live'; END IF;
 SELECT * INTO s FROM public.subscriptions WHERE user_id=_user_id AND status='active' AND paypal_subscription_id IS NOT NULL AND current_period_start<=now() AND current_period_end>now() ORDER BY created_at DESC LIMIT 1;
 IF s.id IS NOT NULL THEN
  SELECT count(*) INTO used FROM public.job_listings WHERE employer_user_id=_user_id AND product_key='package:'||s.plan_slug AND created_at>=s.current_period_start;
  IF used<coalesce(s.job_posts_limit,0) THEN k:='package:'||s.plan_slug; END IF;
 END IF;
 IF k IS NULL THEN
  SELECT count(*) INTO used FROM public.job_listings WHERE employer_user_id=_user_id AND product_key='free_monthly' AND created_at>=bucket;
  IF used>=1 THEN RAISE EXCEPTION 'No free job or package credit available'; END IF;
  k:='free_monthly';
 END IF;
 INSERT INTO public.job_listings(employer_user_id,company_id,job_id,product_key,listing_tier,price_eur,starts_at,ends_at) VALUES(_user_id,j.company_id,j.id,k,'standard',0,now(),now()+interval '30 days');
 UPDATE public.jobs SET is_active=true,payment_status=CASE WHEN k='free_monthly' THEN 'free' ELSE 'paid' END,is_featured=false,updated_at=now() WHERE id=j.id;
 RETURN k;
END $$;
REVOKE ALL ON FUNCTION public.publish_employer_credit_job(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.publish_employer_credit_job(uuid,uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.publish_client_package_job(_offer_id uuid,_job_id uuid,_user_id uuid) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.client_package_offers; j public.jobs;
BEGIN
 SELECT * INTO j FROM public.jobs WHERE id=_job_id FOR UPDATE;
 IF j.id IS NULL OR j.posted_by<>_user_id THEN RAISE EXCEPTION 'Job not found'; END IF;
 IF j.is_active OR EXISTS(SELECT 1 FROM public.job_listings WHERE job_id=j.id AND client_offer_id IS NOT NULL) THEN RETURN 'already_live'; END IF;
 SELECT * INTO p FROM public.client_package_offers WHERE id=_offer_id FOR UPDATE;
 IF p.id IS NULL OR p.employer_user_id<>_user_id OR p.company_id<>j.company_id OR NOT EXISTS(SELECT 1 FROM public.companies WHERE id=p.company_id AND owner_id=_user_id) THEN RAISE EXCEPTION 'Package not found'; END IF;
 IF p.status<>'paid' OR p.starts_at>now() OR p.expires_at<=now() OR p.credits_used>=p.credit_limit THEN RAISE EXCEPTION 'No active package credits available'; END IF;
 UPDATE public.client_package_offers SET credits_used=credits_used+1 WHERE id=p.id;
 INSERT INTO public.job_listings(employer_user_id,company_id,job_id,product_key,listing_tier,price_eur,starts_at,ends_at,client_offer_id) VALUES(_user_id,p.company_id,j.id,p.product_key,'standard',0,now(),now()+interval '30 days',p.id);
 UPDATE public.jobs SET is_active=true,payment_status='paid',is_featured=false,updated_at=now() WHERE id=j.id;
 RETURN 'published';
END $$;
REVOKE ALL ON FUNCTION public.publish_client_package_job(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.publish_client_package_job(uuid,uuid,uuid) TO service_role;