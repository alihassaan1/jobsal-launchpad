DO $$
DECLARE a uuid := '044aeabf-a1e6-4bff-8a41-f568cdc5fc37'; m uuid := 'e38c2af7-845b-4677-a7bf-b18c1086e36e'; c uuid;
BEGIN
  SELECT id INTO c FROM public.companies WHERE owner_id = a ORDER BY created_at LIMIT 1;
  IF c IS NULL THEN
    INSERT INTO public.companies (name, slug, owner_id, email, is_verified) VALUES ('Dutch Global Maintenance SHPK','dutch-global-maintenance',a,'arjana.hystuna@dgm.al',true) RETURNING id INTO c;
  ELSE
    UPDATE public.companies SET name='Dutch Global Maintenance SHPK', slug='dutch-global-maintenance', email='arjana.hystuna@dgm.al', website='https://dgm.al', is_verified=true, location='Tirana, Albania', industry='Maintenance & Technical Services', branded_page_enabled=true WHERE id=c;
  END IF;
  DELETE FROM public.companies WHERE owner_id = m AND NOT EXISTS (SELECT 1 FROM public.jobs j WHERE j.company_id = companies.id);
  INSERT INTO public.company_members (company_id,user_id,role,invited_by) VALUES (c,a,'owner','2ae25656-f7bd-499f-a945-71f8fb277710'),(c,m,'recruiter','2ae25656-f7bd-499f-a945-71f8fb277710') ON CONFLICT (company_id,user_id) DO NOTHING;
  INSERT INTO public.client_package_offers (company_id,employer_user_id,product_key,amount_cents,credit_limit,credits_used,duration_months,starts_at,expires_at,offer_expires_at,status,assigned_by,package_name)
  VALUES (c,a,'custom_package',120000,80,0,12,now(),now()+interval '12 months',now()+interval '30 days','offered','2ae25656-f7bd-499f-a945-71f8fb277710','Annual');
END $$;