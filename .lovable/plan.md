
# Talent Pool & Corporate Package

Closes the biggest commercial gap on Jobs.al: employers currently only see resumes from candidates who applied. This plan adds a true searchable CV database, recruiter tools, multi-seat accounts, branded company pages, and a Corporate subscription tier to monetize them.

## Scope confirmed
- Talent pool: search/filter, view (quota-tracked), shortlists, contact/invite
- Visibility: **opt-in** for candidates (default hidden, GDPR-friendly)
- Corporate tier: unlimited talent pool, unlimited featured posts, branded company page, multi-seat + bulk export
- Build everything in one go (phased internally)

---

## Phase 1 — Database & access control

New tables:
- `candidate_visibility` — `user_id`, `is_searchable`, `headline`, `desired_role`, `desired_categories[]`, `desired_locations[]`, `min_salary`, `years_experience`, `top_skills[]`, `availability` (immediate / 1mo / 3mo / passive), `allow_contact`
- `resume_unlocks` — `employer_user_id`, `company_id`, `candidate_user_id`, `unlocked_at`, `month_bucket` (for quota counting)
- `candidate_shortlists` — `company_id`, `name`, `created_by`
- `candidate_shortlist_items` — `shortlist_id`, `candidate_user_id`, `notes`, `added_by`
- `candidate_outreach` — `company_id`, `sender_user_id`, `candidate_user_id`, `job_id` (nullable, for "invite to apply"), `subject`, `message`, `sent_at`, `email_status`, `read_at`, `replied_at`
- `company_members` — `company_id`, `user_id`, `role` (`owner` / `recruiter` / `viewer`), `invited_by`, `accepted_at` — enables multi-seat
- `company_member_invites` — `company_id`, `email`, `role`, `token`, `expires_at`

Schema additions:
- `subscription_plans`: `talent_pool_access` boolean, `talent_pool_views_limit` int (-1 = unlimited), `seat_limit` int, `bulk_export` bool, `branded_page` bool, `is_corporate` bool
- `companies`: `branded_page_enabled`, `brand_video_url`, `brand_gallery jsonb`, `testimonials jsonb`, `mission`, `culture`, `benefits_summary`

RLS — the critical part:
- `candidate_visibility`: candidate can read/update own row; employers with active talent-pool access can read rows where `is_searchable = true`
- A `public.searchable_candidates` view exposes only non-PII fields (no email, no full name, no phone) — that's what employer search hits
- `resumes`: extend SELECT policy so employers with active talent-pool access AND a row in `resume_unlocks` for that candidate can read the full resume; current "via applications" policy stays
- `candidate_outreach`: candidate sees outreach addressed to them; company members see outreach from their company
- `company_members` replaces `companies.owner_id` checks throughout — add `is_company_member(company_id, user_id, min_role)` security-definer helper; existing policies keep working via owner mapping

Quota enforcement via `unlock_candidate(candidate_id)` SECURITY DEFINER RPC: checks active subscription, counts unlocks in current `month_bucket`, inserts into `resume_unlocks`, returns the unlocked resume payload. Frontend never inserts directly.

## Phase 2 — Candidate side (opt-in to talent pool)

New page `/candidate/visibility` (and inline card on `CandidateDashboard`):
- Toggle "Open to opportunities — let employers find me"
- Headline, desired role, categories, locations, min salary, years of experience, top skills, availability, allow direct contact
- Clear privacy copy: name & contact hidden until employer "unlocks" your profile; you'll be notified each time
- Notification email when an employer unlocks or messages them

## Phase 3 — Employer talent pool UI

New routes (all gated by `talent_pool_access` flag on active subscription):
- `/employer/talent` — search & filter (keyword, skills, category, location, experience range, availability). Result cards show anonymized profile: headline, top skills, years exp, location, availability, match indicators. CTA: **Unlock profile** (consumes quota) or **Save to shortlist** (free).
- `/employer/talent/:candidateId` — full unlocked profile + resume preview, **Contact**, **Invite to apply**, **Add to shortlist**
- `/employer/shortlists` — list/create shortlists, view candidates in each, notes
- `/employer/outreach` — sent messages, status (delivered/opened/replied)
- Quota meter in dashboard header: "Talent pool views: 12 / 50 this month"

Edge functions:
- `unlock-candidate` — wraps the RPC, returns full profile
- `send-candidate-outreach` — sends Resend email to candidate (with reply-to recruiter), logs to `candidate_outreach` and `email_logs`
- `invite-candidate-to-job` — same as outreach but with `job_id` and pre-filled "Apply now" CTA
- `export-candidates` — bulk CV export (Corporate only): generates a ZIP of resume PDFs + a CSV manifest, returns signed URL

## Phase 4 — Multi-seat (team accounts)

- `/employer/team` — list members, invite by email, set role (`owner` / `recruiter` / `viewer`)
- Edge function `invite-team-member` — creates token, sends invite email
- `/employer/accept-invite/:token` — accepts invite, creates `company_members` row
- Owner cannot be removed; seat count enforced against `seat_limit`
- Migration: every existing `companies.owner_id` becomes the `owner` row in `company_members`

## Phase 5 — Branded company page

- Extend `/dashboard/company` editor with branded sections (gated by `branded_page` flag): hero video, gallery (3-6 images), mission, culture, benefits list, testimonials (name/role/quote/photo)
- Update public `/companies/:slug` page to render the branded sections when enabled, otherwise fall back to current layout
- Image uploads via existing `blog-images` bucket pattern (or new `company-media` bucket)

## Phase 6 — Pricing: Corporate plan

- Add Corporate plan row via admin (or seed migration): unlimited posts, unlimited featured, `talent_pool_access: true`, `talent_pool_views_limit: -1`, `seat_limit: 10`, `bulk_export: true`, `branded_page: true`, `ats_access: true`, marked `is_popular` for enterprise card
- Update `/pricing`, `/employer/subscription`, and `EmployerSubscription` plan cards to render the new feature flags (Talent Pool, Seats, Branded Page, Bulk Export) — also surface them on Free/Basic/Pro as ❌/limit values so the upgrade story is obvious
- "Contact sales" CTA on Corporate (instead of self-serve) → opens a form that creates a `marketing_leads` row of type `corporate_inquiry` and emails the team

## Phase 7 — Admin

- `/admin/talent-pool` — searchable list of opted-in candidates, monitor unlock volume per company
- `/admin/companies/:id` — manage members, override `talent_pool_access` for trial accounts, override seat limit
- `/admin/subscriptions` — already exists; add the new feature toggle fields to the editor

---

## Non-functional / safety

- Privacy copy on candidate visibility page in AL + EN; default OFF for everyone
- Audit row in `analytics` for every unlock and outreach send
- Rate-limit outreach: max N messages/day per company on non-Corporate plans
- All new pages use `<Navigation />` (consistent with the recent header unification)

## Files touched (high level)

- New pages: `CandidateVisibility.tsx`, `EmployerTalentPool.tsx`, `EmployerCandidateProfile.tsx`, `EmployerShortlists.tsx`, `EmployerOutreach.tsx`, `EmployerTeam.tsx`, `EmployerAcceptInvite.tsx`, `AdminTalentPool.tsx`
- Edited: `App.tsx` (routes), `Navigation.tsx` (employer nav links), `Pricing.tsx`, `EmployerSubscription.tsx`, `EmployerDashboard.tsx` (quota meter), `CandidateDashboard.tsx` (visibility card), `EmployerCompanyProfile.tsx` (branded sections), `AdminSubscriptions.tsx`
- New edge functions: `unlock-candidate`, `send-candidate-outreach`, `invite-candidate-to-job`, `export-candidates`, `invite-team-member`, `corporate-inquiry`
- One large migration covering all schema + RLS + RPC + helper functions + Corporate plan seed

## Out of scope (next iteration)
- AI candidate ranking against a job (re-uses existing `ai_match_score` infra later)
- In-app chat threads (this iteration is one-way email outreach with reply-to recruiter)
- SSO / SAML for enterprise

After you approve, I'll execute the migration first, then build phases 1→7 in order.
