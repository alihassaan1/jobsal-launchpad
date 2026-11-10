ALTER TABLE public.invoices DROP CONSTRAINT invoices_source_type_check;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_source_type_check CHECK (source_type = ANY (ARRAY['subscription','ad_purchase','premium_placement','manual','client_package']::text[]));
CREATE UNIQUE INDEX IF NOT EXISTS invoices_client_package_source_unique ON public.invoices(source_id) WHERE source_type='client_package';
CREATE OR REPLACE FUNCTION public.sync_client_package_invoice() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_invoice uuid; v_name text; v_order text;
BEGIN
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
END $$;
REVOKE ALL ON FUNCTION public.sync_client_package_invoice() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER sync_client_package_invoice AFTER INSERT OR UPDATE OF status,paid_at ON public.client_package_offers FOR EACH ROW EXECUTE FUNCTION public.sync_client_package_invoice();
UPDATE public.client_package_offers SET status=status WHERE id='0a22ad59-f877-4176-a021-c0a06bcbeafc';
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.invoices WHERE source_type='client_package' AND source_id='0a22ad59-f877-4176-a021-c0a06bcbeafc' AND total=120000 AND amount_paid=0 AND amount_due=120000 AND status='pending') THEN RAISE EXCEPTION 'DGM pending invoice test failed'; END IF;
 BEGIN
  UPDATE public.client_package_offers SET status='paid',paid_at=now() WHERE id='0a22ad59-f877-4176-a021-c0a06bcbeafc';
  UPDATE public.client_package_offers SET status='paid' WHERE id='0a22ad59-f877-4176-a021-c0a06bcbeafc';
  IF (SELECT count(*) FROM public.invoices WHERE source_type='client_package' AND source_id='0a22ad59-f877-4176-a021-c0a06bcbeafc')<>1 THEN RAISE EXCEPTION 'Duplicate package invoice test failed'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.invoices WHERE source_type='client_package' AND source_id='0a22ad59-f877-4176-a021-c0a06bcbeafc' AND status='paid' AND total=120000 AND amount_paid=120000 AND amount_due=0 AND paid_date IS NOT NULL) THEN RAISE EXCEPTION 'Paid invoice sync test failed'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.client_package_offers WHERE id='0a22ad59-f877-4176-a021-c0a06bcbeafc' AND credit_limit=80 AND credits_used=0 AND expires_at='2027-11-09 22:59:59+00') THEN RAISE EXCEPTION 'Package terms changed'; END IF;
  RAISE SQLSTATE 'Z0001' USING MESSAGE='Rollback payment simulation';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL;
 END;
END $$;