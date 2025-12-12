-- Create billing_settings table for platform configuration
CREATE TABLE public.billing_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text,
  description text,
  is_encrypted boolean DEFAULT false,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create company_billing_profiles table
CREATE TABLE public.company_billing_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  billing_name text,
  billing_email text,
  billing_address text,
  billing_city text,
  billing_country text DEFAULT 'Albania',
  billing_postal_code text,
  tax_id text,
  vat_number text,
  payment_terms_days integer DEFAULT 30,
  preferred_payment_method text DEFAULT 'bank_transfer',
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(company_id)
);

-- Create invoices table
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number text NOT NULL UNIQUE,
  company_id uuid REFERENCES public.companies(id),
  user_id uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded', 'void')),
  issue_date timestamp with time zone NOT NULL DEFAULT now(),
  due_date timestamp with time zone,
  paid_date timestamp with time zone,
  subtotal integer NOT NULL DEFAULT 0,
  tax_rate numeric DEFAULT 0,
  tax_amount integer DEFAULT 0,
  discount_amount integer DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  amount_paid integer DEFAULT 0,
  amount_due integer GENERATED ALWAYS AS (total - amount_paid) STORED,
  currency text NOT NULL DEFAULT 'EUR',
  notes text,
  terms text,
  billing_name text,
  billing_email text,
  billing_address text,
  billing_city text,
  billing_country text,
  billing_postal_code text,
  tax_id text,
  payment_reference text,
  payment_method text,
  pdf_url text,
  sent_at timestamp with time zone,
  reminder_sent_at timestamp with time zone,
  overdue_notice_sent_at timestamp with time zone,
  source_type text CHECK (source_type IN ('subscription', 'ad_purchase', 'premium_placement', 'manual')),
  source_id uuid,
  promo_code_id uuid REFERENCES public.promo_codes(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create invoice_items table
CREATE TABLE public.invoice_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price integer NOT NULL DEFAULT 0,
  tax_rate numeric DEFAULT 0,
  tax_amount integer DEFAULT 0,
  discount_amount integer DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  product_type text,
  product_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Create credit_notes table
CREATE TABLE public.credit_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_note_number text NOT NULL UNIQUE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id),
  company_id uuid REFERENCES public.companies(id),
  user_id uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'applied', 'void')),
  reason text NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  issued_date timestamp with time zone DEFAULT now(),
  applied_date timestamp with time zone,
  notes text,
  pdf_url text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create invoice_sequence for auto-incrementing invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1001;
CREATE SEQUENCE IF NOT EXISTS credit_note_number_seq START WITH 101;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  year_prefix text;
  seq_num bigint;
BEGIN
  year_prefix := to_char(now(), 'YYYY');
  seq_num := nextval('invoice_number_seq');
  RETURN 'INV-' || year_prefix || '-' || lpad(seq_num::text, 6, '0');
END;
$$;

-- Function to generate credit note number
CREATE OR REPLACE FUNCTION generate_credit_note_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  year_prefix text;
  seq_num bigint;
BEGIN
  year_prefix := to_char(now(), 'YYYY');
  seq_num := nextval('credit_note_number_seq');
  RETURN 'CN-' || year_prefix || '-' || lpad(seq_num::text, 5, '0');
END;
$$;

-- Trigger to auto-generate invoice number
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_invoice_number
BEFORE INSERT ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION set_invoice_number();

-- Trigger to auto-generate credit note number
CREATE OR REPLACE FUNCTION set_credit_note_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.credit_note_number IS NULL OR NEW.credit_note_number = '' THEN
    NEW.credit_note_number := generate_credit_note_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_credit_note_number
BEFORE INSERT ON public.credit_notes
FOR EACH ROW
EXECUTE FUNCTION set_credit_note_number();

-- Update timestamps triggers
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_items_updated_at
BEFORE UPDATE ON public.invoice_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_notes_updated_at
BEFORE UPDATE ON public.credit_notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_settings_updated_at
BEFORE UPDATE ON public.billing_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_billing_profiles_updated_at
BEFORE UPDATE ON public.company_billing_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_billing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for billing_settings
CREATE POLICY "Admins can manage billing settings"
ON public.billing_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view non-encrypted settings"
ON public.billing_settings FOR SELECT
USING (is_encrypted = false);

-- RLS Policies for company_billing_profiles
CREATE POLICY "Admins can manage all billing profiles"
ON public.company_billing_profiles FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Company owners can manage their billing profile"
ON public.company_billing_profiles FOR ALL
USING (EXISTS (
  SELECT 1 FROM companies WHERE companies.id = company_billing_profiles.company_id AND companies.owner_id = auth.uid()
));

-- RLS Policies for invoices
CREATE POLICY "Admins can manage all invoices"
ON public.invoices FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own invoices"
ON public.invoices FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Company owners can view their company invoices"
ON public.invoices FOR SELECT
USING (EXISTS (
  SELECT 1 FROM companies WHERE companies.id = invoices.company_id AND companies.owner_id = auth.uid()
));

-- RLS Policies for invoice_items
CREATE POLICY "Admins can manage all invoice items"
ON public.invoice_items FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their invoice items"
ON public.invoice_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()
));

CREATE POLICY "Company owners can view their invoice items"
ON public.invoice_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM invoices i
  JOIN companies c ON c.id = i.company_id
  WHERE i.id = invoice_items.invoice_id AND c.owner_id = auth.uid()
));

-- RLS Policies for credit_notes
CREATE POLICY "Admins can manage all credit notes"
ON public.credit_notes FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own credit notes"
ON public.credit_notes FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Company owners can view their credit notes"
ON public.credit_notes FOR SELECT
USING (EXISTS (
  SELECT 1 FROM companies WHERE companies.id = credit_notes.company_id AND companies.owner_id = auth.uid()
));

-- Create indexes
CREATE INDEX idx_invoices_company_id ON public.invoices(company_id);
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX idx_invoices_issue_date ON public.invoices(issue_date);
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX idx_credit_notes_invoice_id ON public.credit_notes(invoice_id);
CREATE INDEX idx_company_billing_profiles_company_id ON public.company_billing_profiles(company_id);

-- Insert default billing settings
INSERT INTO public.billing_settings (key, value, description) VALUES
('default_tax_rate', '20', 'Default VAT/TVSH rate in Albania (%)'),
('invoice_prefix', 'INV', 'Prefix for invoice numbers'),
('credit_note_prefix', 'CN', 'Prefix for credit note numbers'),
('default_payment_terms', '30', 'Default payment terms in days'),
('company_name', 'Jobs.al', 'Company name for invoices'),
('company_address', 'Tirana, Albania', 'Company address for invoices'),
('company_email', 'billing@jobs.al', 'Billing contact email'),
('company_phone', '+355 69 XXX XXXX', 'Company phone number'),
('company_tax_id', '', 'Company tax identification number'),
('bank_name', '', 'Bank name for wire transfers'),
('bank_account', '', 'Bank account number'),
('bank_iban', '', 'IBAN for international transfers'),
('invoice_footer_text', 'Thank you for your business!', 'Footer text on invoices'),
('overdue_reminder_days', '7', 'Days after due date to send overdue notice');