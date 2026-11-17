
CREATE OR REPLACE FUNCTION public.guard_client_company_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user NOT IN ('authenticated','anon') OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.is_verified := false; NEW.is_sponsored := false; NEW.sponsorship_plan := NULL;
    NEW.is_top_employer := false; NEW.top_employer_start_date := NULL; NEW.top_employer_end_date := NULL;
    NEW.top_employer_plan_type := NULL; NEW.views_count := 0; NEW.followers_count := 0;
  ELSE
    NEW.is_verified := OLD.is_verified; NEW.is_sponsored := OLD.is_sponsored; NEW.sponsorship_plan := OLD.sponsorship_plan;
    NEW.is_top_employer := OLD.is_top_employer; NEW.top_employer_start_date := OLD.top_employer_start_date;
    NEW.top_employer_end_date := OLD.top_employer_end_date; NEW.top_employer_plan_type := OLD.top_employer_plan_type;
    NEW.views_count := OLD.views_count; NEW.followers_count := OLD.followers_count; NEW.is_hidden := OLD.is_hidden;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_client_company_fields() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_client_company_fields ON public.companies;
CREATE TRIGGER guard_client_company_fields BEFORE INSERT OR UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.guard_client_company_fields();

CREATE OR REPLACE FUNCTION public.guard_client_job_publication()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user NOT IN ('authenticated','anon') OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.is_active := false; NEW.is_featured := false; NEW.payment_status := 'awaiting_payment';
    NEW.views_count := 0; NEW.applications_count := 0;
    RETURN NEW;
  END IF;
  NEW.payment_status := OLD.payment_status; NEW.is_featured := OLD.is_featured;
  NEW.views_count := OLD.views_count; NEW.applications_count := OLD.applications_count;
  IF NEW.is_active AND NOT COALESCE(OLD.is_active,false) THEN
    IF OLD.payment_status NOT IN ('paid','free') OR NOT EXISTS (
      SELECT 1 FROM public.job_listings l WHERE l.job_id = OLD.id AND l.ends_at > now()
    ) THEN
      RAISE EXCEPTION 'This job needs an active paid listing before it can be published';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_client_job_publication() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_client_job_publication ON public.jobs;
CREATE TRIGGER guard_client_job_publication BEFORE INSERT OR UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.guard_client_job_publication();

CREATE OR REPLACE FUNCTION public.guard_client_ad_purchase()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user NOT IN ('authenticated','anon') OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  NEW.status := 'pending'; NEW.payment_reference := NULL;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_client_ad_purchase() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_client_ad_purchase ON public.ad_purchases;
CREATE TRIGGER guard_client_ad_purchase BEFORE INSERT ON public.ad_purchases
FOR EACH ROW EXECUTE FUNCTION public.guard_client_ad_purchase();
