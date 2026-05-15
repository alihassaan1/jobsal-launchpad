
-- =========================================================
-- 1. ENUMS
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.company_member_role AS ENUM ('owner', 'recruiter', 'viewer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.candidate_availability AS ENUM ('immediate', 'one_month', 'three_months', 'passive');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =========================================================
-- 2. SUBSCRIPTION PLAN ADDITIONS
-- =========================================================
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS talent_pool_access boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS talent_pool_views_limit integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seat_limit integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS bulk_export boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS branded_page boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_corporate boolean DEFAULT false;

-- =========================================================
-- 3. COMPANY BRANDED PAGE FIELDS
-- =========================================================
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS branded_page_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS brand_video_url text,
  ADD COLUMN IF NOT EXISTS brand_gallery jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS testimonials jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS mission text,
  ADD COLUMN IF NOT EXISTS culture text,
  ADD COLUMN IF NOT EXISTS benefits_summary text;

-- =========================================================
-- 4. CANDIDATE VISIBILITY
-- =========================================================
CREATE TABLE IF NOT EXISTS public.candidate_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  is_searchable boolean NOT NULL DEFAULT false,
  headline text,
  desired_role text,
  desired_categories text[] DEFAULT '{}'::text[],
  desired_locations text[] DEFAULT '{}'::text[],
  min_salary integer,
  salary_currency text DEFAULT 'EUR',
  years_experience integer,
  top_skills text[] DEFAULT '{}'::text[],
  availability public.candidate_availability DEFAULT 'passive',
  allow_contact boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.candidate_visibility ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_candidate_visibility_searchable
  ON public.candidate_visibility (is_searchable) WHERE is_searchable = true;
CREATE INDEX IF NOT EXISTS idx_candidate_visibility_skills
  ON public.candidate_visibility USING GIN (top_skills);
CREATE INDEX IF NOT EXISTS idx_candidate_visibility_categories
  ON public.candidate_visibility USING GIN (desired_categories);
CREATE INDEX IF NOT EXISTS idx_candidate_visibility_locations
  ON public.candidate_visibility USING GIN (desired_locations);

-- =========================================================
-- 5. RESUME UNLOCKS (quota tracking)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.resume_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  employer_user_id uuid NOT NULL,
  candidate_user_id uuid NOT NULL,
  month_bucket text NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, candidate_user_id, month_bucket)
);

ALTER TABLE public.resume_unlocks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_resume_unlocks_company_month
  ON public.resume_unlocks (company_id, month_bucket);
CREATE INDEX IF NOT EXISTS idx_resume_unlocks_candidate
  ON public.resume_unlocks (candidate_user_id);

-- =========================================================
-- 6. SHORTLISTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.candidate_shortlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.candidate_shortlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shortlist_id uuid NOT NULL REFERENCES public.candidate_shortlists(id) ON DELETE CASCADE,
  candidate_user_id uuid NOT NULL,
  notes text,
  added_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shortlist_id, candidate_user_id)
);

ALTER TABLE public.candidate_shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_shortlist_items ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 7. OUTREACH
-- =========================================================
CREATE TABLE IF NOT EXISTS public.candidate_outreach (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  sender_user_id uuid NOT NULL,
  candidate_user_id uuid NOT NULL,
  job_id uuid,
  subject text NOT NULL,
  message text NOT NULL,
  email_status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  read_at timestamptz,
  replied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.candidate_outreach ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_candidate_outreach_company ON public.candidate_outreach(company_id);
CREATE INDEX IF NOT EXISTS idx_candidate_outreach_candidate ON public.candidate_outreach(candidate_user_id);

-- =========================================================
-- 8. COMPANY MEMBERS (multi-seat)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role public.company_member_role NOT NULL DEFAULT 'recruiter',
  invited_by uuid,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.company_member_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  email text NOT NULL,
  role public.company_member_role NOT NULL DEFAULT 'recruiter',
  token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  invited_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_member_invites ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_company_members_user ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company ON public.company_members(company_id);

-- =========================================================
-- 9. HELPER FUNCTIONS
-- =========================================================

-- Is the user a member of this company (with at least the given role)?
CREATE OR REPLACE FUNCTION public.is_company_member(_company_id uuid, _user_id uuid, _min_role public.company_member_role DEFAULT 'viewer')
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.company_id = _company_id
      AND cm.user_id = _user_id
      AND (
        _min_role = 'viewer'
        OR (_min_role = 'recruiter' AND cm.role IN ('recruiter', 'owner'))
        OR (_min_role = 'owner' AND cm.role = 'owner')
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = _company_id AND c.owner_id = _user_id
  );
$$;

-- Does the company have an active subscription with talent pool access?
CREATE OR REPLACE FUNCTION public.company_has_talent_pool(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    JOIN public.subscription_plans p ON p.id = s.plan_id
    JOIN public.companies c ON c.owner_id = s.user_id
    WHERE c.id = _company_id
      AND s.status = 'active'
      AND p.talent_pool_access = true
  );
$$;

-- Does the *current* user belong to a company that has talent pool access?
CREATE OR REPLACE FUNCTION public.current_user_has_talent_pool()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = auth.uid()
      AND public.company_has_talent_pool(cm.company_id)
  )
  OR EXISTS (
    SELECT 1
    FROM public.companies c
    WHERE c.owner_id = auth.uid()
      AND public.company_has_talent_pool(c.id)
  );
$$;

-- Server-side unlock with quota enforcement
CREATE OR REPLACE FUNCTION public.unlock_candidate(_company_id uuid, _candidate_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_limit integer;
  v_used integer;
  v_bucket text := to_char(now(), 'YYYY-MM');
  v_already boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_company_member(_company_id, v_user_id, 'recruiter') THEN
    RAISE EXCEPTION 'Not authorized for this company';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.candidate_visibility v
    WHERE v.user_id = _candidate_user_id AND v.is_searchable = true
  ) THEN
    RAISE EXCEPTION 'Candidate not searchable';
  END IF;

  -- Already unlocked this month? free.
  SELECT EXISTS (
    SELECT 1 FROM public.resume_unlocks
    WHERE company_id = _company_id
      AND candidate_user_id = _candidate_user_id
      AND month_bucket = v_bucket
  ) INTO v_already;

  IF NOT v_already THEN
    -- Get limit
    SELECT COALESCE(p.talent_pool_views_limit, 0) INTO v_limit
    FROM public.subscriptions s
    JOIN public.subscription_plans p ON p.id = s.plan_id
    JOIN public.companies c ON c.owner_id = s.user_id
    WHERE c.id = _company_id AND s.status = 'active'
    ORDER BY p.talent_pool_views_limit DESC NULLS LAST
    LIMIT 1;

    IF v_limit IS NULL OR v_limit = 0 THEN
      RAISE EXCEPTION 'No talent pool access on current plan';
    END IF;

    IF v_limit <> -1 THEN
      SELECT COUNT(*) INTO v_used
      FROM public.resume_unlocks
      WHERE company_id = _company_id AND month_bucket = v_bucket;

      IF v_used >= v_limit THEN
        RAISE EXCEPTION 'Monthly talent pool quota exceeded (% of %)', v_used, v_limit;
      END IF;
    END IF;

    INSERT INTO public.resume_unlocks (company_id, employer_user_id, candidate_user_id, month_bucket)
    VALUES (_company_id, v_user_id, _candidate_user_id, v_bucket);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'candidate_user_id', _candidate_user_id,
    'month_bucket', v_bucket,
    'already_unlocked', v_already
  );
END;
$$;

-- =========================================================
-- 10. ANONYMIZED SEARCHABLE VIEW
-- =========================================================
DROP VIEW IF EXISTS public.searchable_candidates;
CREATE VIEW public.searchable_candidates
WITH (security_invoker = on) AS
SELECT
  v.user_id,
  v.headline,
  v.desired_role,
  v.desired_categories,
  v.desired_locations,
  v.min_salary,
  v.salary_currency,
  v.years_experience,
  v.top_skills,
  v.availability,
  v.allow_contact,
  v.updated_at,
  -- Anonymized hint only:
  left(coalesce(p.full_name, ''), 1) AS initial,
  p.location AS profile_location,
  p.avatar_url
FROM public.candidate_visibility v
LEFT JOIN public.profiles p ON p.id = v.user_id
WHERE v.is_searchable = true;

-- =========================================================
-- 11. RLS POLICIES
-- =========================================================

-- candidate_visibility
DROP POLICY IF EXISTS "Candidates manage own visibility" ON public.candidate_visibility;
CREATE POLICY "Candidates manage own visibility"
  ON public.candidate_visibility FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Talent pool subscribers can read searchable" ON public.candidate_visibility;
CREATE POLICY "Talent pool subscribers can read searchable"
  ON public.candidate_visibility FOR SELECT
  USING (is_searchable = true AND public.current_user_has_talent_pool());

DROP POLICY IF EXISTS "Admins manage all visibility" ON public.candidate_visibility;
CREATE POLICY "Admins manage all visibility"
  ON public.candidate_visibility FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- resume_unlocks
DROP POLICY IF EXISTS "Company members view their unlocks" ON public.resume_unlocks;
CREATE POLICY "Company members view their unlocks"
  ON public.resume_unlocks FOR SELECT
  USING (public.is_company_member(company_id, auth.uid(), 'viewer'));

DROP POLICY IF EXISTS "Candidates see who unlocked them" ON public.resume_unlocks;
CREATE POLICY "Candidates see who unlocked them"
  ON public.resume_unlocks FOR SELECT
  USING (auth.uid() = candidate_user_id);

DROP POLICY IF EXISTS "Admins manage all unlocks" ON public.resume_unlocks;
CREATE POLICY "Admins manage all unlocks"
  ON public.resume_unlocks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- shortlists
DROP POLICY IF EXISTS "Members view shortlists" ON public.candidate_shortlists;
CREATE POLICY "Members view shortlists"
  ON public.candidate_shortlists FOR SELECT
  USING (public.is_company_member(company_id, auth.uid(), 'viewer'));

DROP POLICY IF EXISTS "Members manage shortlists" ON public.candidate_shortlists;
CREATE POLICY "Members manage shortlists"
  ON public.candidate_shortlists FOR ALL
  USING (public.is_company_member(company_id, auth.uid(), 'recruiter'))
  WITH CHECK (public.is_company_member(company_id, auth.uid(), 'recruiter'));

DROP POLICY IF EXISTS "Members view shortlist items" ON public.candidate_shortlist_items;
CREATE POLICY "Members view shortlist items"
  ON public.candidate_shortlist_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.candidate_shortlists s
    WHERE s.id = shortlist_id
      AND public.is_company_member(s.company_id, auth.uid(), 'viewer')
  ));

DROP POLICY IF EXISTS "Members manage shortlist items" ON public.candidate_shortlist_items;
CREATE POLICY "Members manage shortlist items"
  ON public.candidate_shortlist_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.candidate_shortlists s
    WHERE s.id = shortlist_id
      AND public.is_company_member(s.company_id, auth.uid(), 'recruiter')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.candidate_shortlists s
    WHERE s.id = shortlist_id
      AND public.is_company_member(s.company_id, auth.uid(), 'recruiter')
  ));

-- outreach
DROP POLICY IF EXISTS "Company members view outreach" ON public.candidate_outreach;
CREATE POLICY "Company members view outreach"
  ON public.candidate_outreach FOR SELECT
  USING (public.is_company_member(company_id, auth.uid(), 'viewer'));

DROP POLICY IF EXISTS "Candidates view outreach to them" ON public.candidate_outreach;
CREATE POLICY "Candidates view outreach to them"
  ON public.candidate_outreach FOR SELECT
  USING (auth.uid() = candidate_user_id);

DROP POLICY IF EXISTS "Admins manage all outreach" ON public.candidate_outreach;
CREATE POLICY "Admins manage all outreach"
  ON public.candidate_outreach FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- company_members
DROP POLICY IF EXISTS "Members view their teams" ON public.company_members;
CREATE POLICY "Members view their teams"
  ON public.company_members FOR SELECT
  USING (user_id = auth.uid() OR public.is_company_member(company_id, auth.uid(), 'viewer'));

DROP POLICY IF EXISTS "Owners manage members" ON public.company_members;
CREATE POLICY "Owners manage members"
  ON public.company_members FOR ALL
  USING (public.is_company_member(company_id, auth.uid(), 'owner'))
  WITH CHECK (public.is_company_member(company_id, auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Admins manage all members" ON public.company_members;
CREATE POLICY "Admins manage all members"
  ON public.company_members FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- company_member_invites
DROP POLICY IF EXISTS "Owners manage invites" ON public.company_member_invites;
CREATE POLICY "Owners manage invites"
  ON public.company_member_invites FOR ALL
  USING (public.is_company_member(company_id, auth.uid(), 'owner'))
  WITH CHECK (public.is_company_member(company_id, auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Admins manage all invites" ON public.company_member_invites;
CREATE POLICY "Admins manage all invites"
  ON public.company_member_invites FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 12. EXTEND RESUMES POLICY: allow read after unlock
-- =========================================================
DROP POLICY IF EXISTS "Talent pool unlocked resume access" ON public.resumes;
CREATE POLICY "Talent pool unlocked resume access"
  ON public.resumes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.resume_unlocks ru
    WHERE ru.candidate_user_id = resumes.user_id
      AND public.is_company_member(ru.company_id, auth.uid(), 'viewer')
  ));

-- =========================================================
-- 13. TRIGGERS
-- =========================================================
DROP TRIGGER IF EXISTS update_candidate_visibility_updated_at ON public.candidate_visibility;
CREATE TRIGGER update_candidate_visibility_updated_at
  BEFORE UPDATE ON public.candidate_visibility
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidate_shortlists_updated_at ON public.candidate_shortlists;
CREATE TRIGGER update_candidate_shortlists_updated_at
  BEFORE UPDATE ON public.candidate_shortlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 14. BACKFILL company_members from existing companies.owner_id
-- =========================================================
INSERT INTO public.company_members (company_id, user_id, role, accepted_at)
SELECT c.id, c.owner_id, 'owner'::public.company_member_role, c.created_at
FROM public.companies c
WHERE c.owner_id IS NOT NULL
ON CONFLICT (company_id, user_id) DO NOTHING;

-- =========================================================
-- 15. SEED CORPORATE PLAN
-- =========================================================
INSERT INTO public.subscription_plans (
  name, slug, description, price_monthly, price_yearly, currency,
  job_posts_limit, featured_jobs_limit, resume_views_limit,
  ats_access, ai_access, company_page, analytics_enabled, support_level,
  is_popular, is_active, display_order,
  talent_pool_access, talent_pool_views_limit, seat_limit, bulk_export, branded_page, is_corporate
)
SELECT
  'Corporate', 'corporate',
  'Unlimited everything for enterprise hiring teams. Full talent pool access, branded company page, multi-seat, bulk CV export, and dedicated support.',
  49900, 499000, 'EUR',
  -1, -1, -1,
  true, true, true, true, 'priority',
  true, true, 100,
  true, -1, 10, true, true, true
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE slug = 'corporate');
