ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS reference text, ADD COLUMN IF NOT EXISTS payment_link text;

CREATE OR REPLACE FUNCTION public.prevent_invoice_delete()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  RAISE EXCEPTION 'Invoices cannot be deleted. Void the invoice instead; its number is kept.';
END $$;

DROP TRIGGER IF EXISTS prevent_invoice_delete ON public.invoices;
CREATE TRIGGER prevent_invoice_delete BEFORE DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.prevent_invoice_delete();

DROP TRIGGER IF EXISTS update_invoice_items_updated_at ON public.invoice_items;

UPDATE public.invoices SET
  tax_id='M41901009H',
  billing_address='Rinas, Aeroporti Nënë Tereza',
  billing_city='Tiranë',
  billing_country='Albania',
  reference='Contract JA-DGM-2026-001',
  payment_link='https://jobs.al/pay/0a22ad59-f877-4176-a021-c0a06bcbeafc?t=c84b037fc73ef72be13777739444fa19ae0580856afa8b34'
WHERE invoice_number='INV-2026-001004';

UPDATE public.invoice_items SET description='Annual package: 80 job posts, 10 Nov 2026 to 9 Nov 2027'
WHERE invoice_id=(SELECT id FROM public.invoices WHERE invoice_number='INV-2026-001004');