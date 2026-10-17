CREATE TABLE public.client_package_offers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id), employer_user_id uuid NOT NULL,
 product_key text NOT NULL, amount_cents integer NOT NULL CHECK(amount_cents>0), credit_limit integer NOT NULL CHECK(credit_limit>0), credits_used integer NOT NULL DEFAULT 0 CHECK(credits_used>=0 AND credits_used<=credit_limit),
 duration_months integer NOT NULL CHECK(duration_months IN (3,6,12)), starts_at timestamptz NOT NULL, expires_at timestamptz NOT NULL,
 offer_expires_at timestamptz NOT NULL DEFAULT '2026-11-17 00:00:00+00', status text NOT NULL DEFAULT 'offered' CHECK(status IN ('offered','paid','revoked')),
 assigned_by uuid NOT NULL, paid_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.client_package_offers TO authenticated;
GRANT ALL ON public.client_package_offers TO service_role;
ALTER TABLE public.client_package_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY client_offer_read ON public.client_package_offers FOR SELECT TO authenticated USING (employer_user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.client_offer_updated() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
CREATE TRIGGER client_offer_updated BEFORE UPDATE ON public.client_package_offers FOR EACH ROW EXECUTE FUNCTION public.client_offer_updated();
CREATE UNIQUE INDEX client_offer_one_pending ON public.client_package_offers(company_id) WHERE status='offered';
ALTER TABLE public.paypal_orders ADD COLUMN client_offer_id uuid REFERENCES public.client_package_offers(id);
ALTER TABLE public.job_listings ADD COLUMN client_offer_id uuid REFERENCES public.client_package_offers(id);
CREATE UNIQUE INDEX client_package_job_once ON public.job_listings(job_id) WHERE client_offer_id IS NOT NULL;
CREATE FUNCTION public.settle_client_package(_order_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.paypal_orders; p public.client_package_offers;
BEGIN
 SELECT * INTO o FROM public.paypal_orders WHERE id=_order_id FOR UPDATE;
 IF o.id IS NULL OR o.client_offer_id IS NULL THEN RAISE EXCEPTION 'Offer order not found'; END IF;
 SELECT * INTO p FROM public.client_package_offers WHERE id=o.client_offer_id FOR UPDATE;
 IF p.id IS NULL OR p.employer_user_id<>o.user_id OR p.amount_cents<>o.amount_cents OR p.product_key<>o.product_key THEN RAISE EXCEPTION 'Offer order mismatch'; END IF;
 IF p.status='revoked' THEN RAISE EXCEPTION 'Offer revoked'; END IF;
 IF p.status='paid' AND o.status<>'completed' THEN RAISE EXCEPTION 'Offer already paid through another order'; END IF;
 UPDATE public.client_package_offers SET status='paid',paid_at=coalesce(paid_at,now()) WHERE id=p.id;
 UPDATE public.paypal_orders SET status='completed',captured_at=coalesce(captured_at,now()) WHERE id=o.id;
 RETURN p.id;
END $$;
REVOKE ALL ON FUNCTION public.settle_client_package(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.settle_client_package(uuid) TO service_role;
CREATE FUNCTION public.publish_client_package_job(_offer_id uuid,_job_id uuid,_user_id uuid) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.client_package_offers; j public.jobs;
BEGIN
 SELECT * INTO j FROM public.jobs WHERE id=_job_id FOR UPDATE;
 IF j.id IS NULL OR j.posted_by<>_user_id THEN RAISE EXCEPTION 'Job not found'; END IF;
 IF j.is_active OR EXISTS(SELECT 1 FROM public.job_listings WHERE job_id=j.id AND client_offer_id IS NOT NULL) THEN RETURN 'already_live'; END IF;
 SELECT * INTO p FROM public.client_package_offers WHERE id=_offer_id FOR UPDATE;
 IF p.id IS NULL OR p.employer_user_id<>_user_id OR NOT EXISTS(SELECT 1 FROM public.companies WHERE id=p.company_id AND owner_id=_user_id) THEN RAISE EXCEPTION 'Package not found'; END IF;
 IF p.status<>'paid' OR p.starts_at>now() OR p.expires_at<=now() OR p.credits_used>=p.credit_limit THEN RAISE EXCEPTION 'No active package credits available'; END IF;
 UPDATE public.client_package_offers SET credits_used=credits_used+1 WHERE id=p.id;
 INSERT INTO public.job_listings(employer_user_id,company_id,job_id,product_key,listing_tier,price_eur,starts_at,ends_at,client_offer_id) VALUES(_user_id,p.company_id,j.id,p.product_key,'standard',0,now(),now()+interval '30 days',p.id);
 UPDATE public.jobs SET is_active=true,payment_status='paid',is_featured=false,updated_at=now() WHERE id=j.id;
 RETURN 'published';
END $$;
REVOKE ALL ON FUNCTION public.publish_client_package_job(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.publish_client_package_job(uuid,uuid,uuid) TO service_role;
CREATE OR REPLACE VIEW public.jobs_public AS SELECT id,company_id,posted_by,title,slug,description,requirements,responsibilities,job_type,experience_level,category,location,is_remote,salary_min,salary_max,salary_currency,is_salary_visible,skills,benefits,application_deadline,is_active,is_featured,seo_title,seo_description,created_at,updated_at,applications_count,views_count FROM public.jobs j WHERE is_active=true AND NOT EXISTS(SELECT 1 FROM public.job_listings l WHERE l.job_id=j.id AND l.client_offer_id IS NOT NULL AND l.ends_at<=now());