CREATE POLICY "Company members create jobs" ON public.jobs FOR INSERT TO authenticated
  WITH CHECK (posted_by = auth.uid() AND public.has_role(auth.uid(),'employer') AND public.is_company_member(company_id, auth.uid(), 'recruiter'));
CREATE POLICY "Company members update jobs" ON public.jobs FOR UPDATE TO authenticated
  USING (public.is_company_member(company_id, auth.uid(), 'recruiter'));
CREATE POLICY "Company members view jobs" ON public.jobs FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid(), 'viewer'));
CREATE POLICY client_offer_member_read ON public.client_package_offers FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid(), 'recruiter'));

CREATE OR REPLACE FUNCTION public.publish_client_package_job(_offer_id uuid, _job_id uuid, _user_id uuid)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE p public.client_package_offers; j public.jobs;
BEGIN
 SELECT * INTO j FROM public.jobs WHERE id=_job_id FOR UPDATE;
 IF j.id IS NULL OR j.posted_by<>_user_id THEN RAISE EXCEPTION 'Job not found'; END IF;
 IF j.is_active OR EXISTS(SELECT 1 FROM public.job_listings WHERE job_id=j.id AND client_offer_id IS NOT NULL) THEN RETURN 'already_live'; END IF;
 SELECT * INTO p FROM public.client_package_offers WHERE id=_offer_id FOR UPDATE;
 IF p.id IS NULL OR p.company_id<>j.company_id OR NOT public.is_company_member(p.company_id,_user_id,'recruiter') THEN RAISE EXCEPTION 'Package not found'; END IF;
 IF p.status<>'paid' OR p.starts_at>now() OR p.expires_at<=now() OR p.credits_used>=p.credit_limit THEN RAISE EXCEPTION 'No active package credits available'; END IF;
 UPDATE public.client_package_offers SET credits_used=credits_used+1 WHERE id=p.id;
 INSERT INTO public.job_listings(employer_user_id,company_id,job_id,product_key,listing_tier,price_eur,starts_at,ends_at,client_offer_id) VALUES(_user_id,p.company_id,j.id,p.product_key,'standard',0,now(),now()+interval '30 days',p.id);
 UPDATE public.jobs SET is_active=true,payment_status='paid',is_featured=false,updated_at=now() WHERE id=j.id;
 RETURN 'published';
END $function$;