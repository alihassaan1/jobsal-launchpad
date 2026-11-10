ALTER TABLE public.client_package_offers ADD COLUMN IF NOT EXISTS pay_token text UNIQUE, ADD COLUMN IF NOT EXISTS receipt_emails text[] NOT NULL DEFAULT '{}';
REVOKE SELECT (pay_token) ON public.client_package_offers FROM anon, authenticated;
UPDATE public.client_package_offers SET pay_token = encode(extensions.gen_random_bytes(24),'hex'),
  receipt_emails = ARRAY['gentjan.jorgaqi@dgm.al','info@jobs.al'],
  expires_at = '2027-11-09 23:59:59+01'
WHERE id = '0a22ad59-f877-4176-a021-c0a06bcbeafc' AND status = 'offered';