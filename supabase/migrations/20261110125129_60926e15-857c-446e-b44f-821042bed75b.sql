ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

CREATE OR REPLACE VIEW public.companies_public AS
SELECT id, owner_id, name, slug, description, logo_url, banner_url, website, industry, company_size, location, email, phone, founded_year, is_verified, is_sponsored, sponsorship_plan, is_top_employer, top_employer_start_date, top_employer_end_date, top_employer_plan_type, branded_page_enabled, brand_video_url, brand_gallery, testimonials, mission, culture, benefits_summary, social_links, followers_count, created_at, updated_at
FROM public.companies WHERE NOT is_hidden;

CREATE OR REPLACE VIEW public.jobs_public AS
SELECT id, company_id, posted_by, title, slug, description, requirements, responsibilities, job_type, experience_level, category, location, is_remote, salary_min, salary_max, salary_currency, is_salary_visible, skills, benefits, application_deadline, is_active, is_featured, seo_title, seo_description, created_at, updated_at, applications_count, views_count
FROM public.jobs j
WHERE j.is_active = true
  AND NOT EXISTS (SELECT 1 FROM public.job_listings l WHERE l.job_id = j.id AND l.client_offer_id IS NOT NULL AND l.ends_at <= now())
  AND NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.id = j.company_id AND c.is_hidden);

CREATE OR REPLACE FUNCTION public.indexnow_on_company() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_hidden THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' OR NEW.slug IS DISTINCT FROM OLD.slug THEN
    PERFORM public.indexnow_ping('/companies/' || NEW.slug);
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.indexnow_on_job() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.companies WHERE id = NEW.company_id AND is_hidden) THEN RETURN NEW; END IF;
  IF NEW.is_active AND (TG_OP = 'INSERT' OR NOT COALESCE(OLD.is_active,false) OR NEW.slug IS DISTINCT FROM OLD.slug) THEN
    PERFORM public.indexnow_ping('/jobs/' || NEW.slug);
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.sync_client_package_invoice() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_invoice uuid; v_name text; v_order text;
BEGIN
 IF EXISTS (SELECT 1 FROM public.companies WHERE id = NEW.company_id AND is_hidden) THEN RETURN NEW; END IF;
 SELECT name INTO v_name FROM public.companies WHERE id=NEW.company_id;
 IF NEW.status='paid' THEN
  SELECT paypal_order_id INTO v_order FROM public.paypal_orders WHERE client_offer_id=NEW.id AND (status='completed' OR captured_at IS NOT NULL) ORDER BY captured_at DESC NULLS LAST LIMIT 1;
 END IF;
 INSERT INTO public.invoices(invoice_number,company_id,user_id,status,due_date,paid_date,subtotal,tax_rate,tax_amount,discount_amount,total,amount_paid,currency,billing_name,billing_email,source_type,source_id,payment_method,payment_reference,notes)
 VALUES('',NEW.company_id,NEW.employer_user_id,CASE WHEN NEW.status='paid' THEN 'paid' WHEN NEW.status='revoked' THEN 'cancelled' ELSE 'pending' END,NEW.offer_expires_at,NEW.paid_at,NEW.amount_cents,0,0,0,NEW.amount_cents,CASE WHEN NEW.status='paid' THEN NEW.amount_cents ELSE 0 END,'EUR',v_name,coalesce(NEW.receipt_emails[1],(SELECT email FROM public.profiles WHERE id=NEW.employer_user_id)),'client_package',NEW.id,'paypal',v_order,format('%s: %s job posts. Package valid until %s. Full agreed package total; no additional tax added.',coalesce(NEW.package_name,'Private package'),NEW.credit_limit,to_char(NEW.expires_at AT TIME ZONE 'Europe/Tirane','DD Mon YYYY')))
 ON CONFLICT (source_id) WHERE source_type='client_package' DO UPDATE SET status=EXCLUDED.status,paid_date=EXCLUDED.paid_date,amount_paid=EXCLUDED.amount_paid,payment_reference=coalesce(EXCLUDED.payment_reference,invoices.payment_reference)
 RETURNING id INTO v_invoice;
 IF NOT EXISTS(SELECT 1 FROM public.invoice_items WHERE invoice_id=v_invoice) THEN
  INSERT INTO public.invoice_items(invoice_id,description,quantity,unit_price,tax_rate,tax_amount,total,product_type,product_id,metadata)
  VALUES(v_invoice,format('%s package: %s job posts, valid until %s',coalesce(NEW.package_name,'Private'),NEW.credit_limit,to_char(NEW.expires_at AT TIME ZONE 'Europe/Tirane','DD Mon YYYY')),1,NEW.amount_cents,0,0,NEW.amount_cents,'client_package',NEW.id,jsonb_build_object('credit_limit',NEW.credit_limit,'expires_at',NEW.expires_at,'receipt_emails',NEW.receipt_emails));
 END IF;
 RETURN NEW;
END $fn$;

DO $$
DECLARE v_admin uuid := '2ae25656-f7bd-499f-a945-71f8fb277710'; v_company uuid;
BEGIN
  INSERT INTO public.companies(owner_id, name, slug, description, industry, location, email, is_verified, is_hidden)
  VALUES (v_admin, 'Jobs.al Test Company (Internal)', 'jobs-al-test-company-internal', 'Hidden internal test company used by the Jobs.al admin to preview the employer experience.', 'Facility Management', 'Tiranë', 'info@jobs.al', true, true)
  RETURNING id INTO v_company;

  INSERT INTO public.company_members(company_id, user_id, role, invited_by) VALUES (v_company, v_admin, 'recruiter', v_admin);

  INSERT INTO public.jobs(company_id, posted_by, title, slug, description, job_type, experience_level, category, location, is_active, payment_status)
  VALUES (v_company, v_admin, 'Test Job – HR Officer (Internal preview)', 'test-hr-officer-internal-preview', 'Internal test job used to preview the employer dashboard. Not visible to the public.', 'full_time', 'mid', 'Human Resources', 'Tiranë', true, 'paid');

  INSERT INTO public.client_package_offers(company_id, employer_user_id, product_key, amount_cents, credit_limit, duration_months, starts_at, expires_at, offer_expires_at, status, assigned_by, package_name, receipt_emails)
  VALUES (v_company, v_admin, 'tia_annual', 120000, 80, 12, now(), now() + interval '12 months', now() + interval '30 days', 'offered', v_admin, 'Annual (TEST – do not pay)', ARRAY['info@jobs.al']);
END $$;