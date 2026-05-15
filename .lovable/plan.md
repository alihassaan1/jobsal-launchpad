## QA Plan — Talent Pool & Corporate Tier

Goal: verify everything built in the last phase works end-to-end with no regressions for live clients.

### 1. Database & RLS audit
- Run `supabase--linter` for new warnings.
- Spot-check policies on new tables (`candidate_visibility`, `resume_unlocks`, `candidate_shortlists`, `candidate_outreach`, `company_members`) — confirm no public read of PII, no employer access without active plan.
- Verify `unlock_candidate` RPC: quota enforcement, idempotency for same-month re-unlock, blocks non-recruiters, blocks non-searchable candidates.
- Confirm `searchable_candidates` view exposes only anonymized fields (initials, no email/phone/full name).
- Confirm Corporate plan seeded correctly (unlimited values, seats, flags).

### 2. Edge function smoke tests
- `unlock-candidate`: call as logged-in employer → success path, quota-exhausted path, unauthorized path.
- `send-candidate-outreach`: validate Resend send, correct `from`, `reply_to`, AL+EN body, error paths.
- Check edge function logs for runtime errors after invocations.

### 3. Frontend route & build check
- Confirm new routes registered in `App.tsx`: `/candidate/visibility`, `/employer/talent`.
- Verify `Navigation` consistency (per the earlier requirement) is preserved on new pages.
- Confirm `Pricing.tsx` Corporate card renders, "Contact Sales" CTA wired, no broken plan mapping.
- Check `EmployerDashboard` and `CandidateDashboard` new cards render and link correctly.

### 4. Browser walkthrough (preview)
Run as job seeker:
- Open `/candidate/visibility` → toggle opt-in, save headline/skills, confirm row in `candidate_visibility`.
- Confirm dashboard promo card appears/dismisses correctly.

Run as employer:
- Open `/employer/talent` → search/filter, results show anonymized cards.
- Click Unlock → quota meter decrements, profile reveals, second unlock of same candidate is free.
- Click Contact → outreach form sends, recorded in `candidate_outreach`.
- Confirm employer without Corporate/Pro plan sees upgrade gate, not raw data.

### 5. Regression sweep
- Auth → employer redirect to dashboard still works.
- Draft-profile banner still shows.
- Job posting, ATS, applications flows unaffected (quick navigation pass).
- Homepage navigation consistent across new pages.

### 6. Report
- Single summary: pass/fail per area, list of any bugs found, severity, and proposed fixes.
- Fix critical/high issues immediately; queue low-severity for follow-up.

No code changes during QA unless a bug blocks a live-client flow — those get fixed inline and re-tested.