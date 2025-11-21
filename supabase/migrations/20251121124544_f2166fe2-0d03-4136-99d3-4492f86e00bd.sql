-- Add premium placement fields to companies table for revenue tracking
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS is_top_employer boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS top_employer_start_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS top_employer_end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS top_employer_plan_type text; -- e.g., 'monthly', 'quarterly', 'yearly'

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_companies_top_employer ON companies(is_top_employer) WHERE is_top_employer = true;

-- Add comment for documentation
COMMENT ON COLUMN companies.is_top_employer IS 'Paid feature: Company appears in Top Employers section on homepage';
COMMENT ON COLUMN companies.top_employer_start_date IS 'When the top employer placement started';
COMMENT ON COLUMN companies.top_employer_end_date IS 'When the top employer placement expires';
COMMENT ON COLUMN companies.top_employer_plan_type IS 'Type of top employer subscription plan';

-- Create a revenue tracking table for all premium placements
CREATE TABLE IF NOT EXISTS premium_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  placement_type text NOT NULL, -- 'top_employer', 'sponsored_company', 'featured_banner', etc.
  amount_paid numeric NOT NULL,
  currency text DEFAULT 'EUR',
  payment_method text, -- 'stripe', 'bank_transfer', 'cash', etc.
  payment_reference text,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  status text DEFAULT 'active', -- 'active', 'expired', 'cancelled'
  notes text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on premium_placements
ALTER TABLE premium_placements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for premium_placements
CREATE POLICY "Admins can manage all placements"
  ON premium_placements
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active placements"
  ON premium_placements
  FOR SELECT
  USING (status = 'active');

-- Create indexes for premium_placements
CREATE INDEX IF NOT EXISTS idx_premium_placements_company ON premium_placements(company_id);
CREATE INDEX IF NOT EXISTS idx_premium_placements_type ON premium_placements(placement_type);
CREATE INDEX IF NOT EXISTS idx_premium_placements_status ON premium_placements(placement_type, status);

-- Add trigger to auto-update updated_at
CREATE TRIGGER update_premium_placements_updated_at
  BEFORE UPDATE ON premium_placements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();