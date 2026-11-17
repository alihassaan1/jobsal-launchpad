# Current verification and reliability round
- [x] Re-enabled and ran daily job alerts, email reminders and PayPal subscription sync with task-scoped single-use headers; welcome queue is limited to confirmed sign-ups from the last 7 days; both AI content schedules remain paused
- [x] Fixed job-seeker registration through Resend confirmation; verified desktop/mobile sign-up, sign-in, CV creation and a stored job application; removed all test records
- [x] Prevented public company-view inflation and verified job/company views each increment once, with forced duplicates rejected
- [x] Replaced demo ad activation with verified PayPal capture and transactional settlement; tested activation atomically with rollback. A real buyer-approved live payment was not completed.

# Urgent backend and rendering security
- [x] Trace callers and enforce shared admin/internal authorization on 14 endpoints
- [x] Escape email template data and restrict dynamic link URLs
- [x] Delete production seed/aggregation functions and remove their admin caller
- [x] Move applicant notification and employer contact lookup into authenticated server function
- [x] Revoke requested database execution grants and remove public promo-code reads
- [x] Activate tested sanitization on job description, requirements and responsibilities
- [x] Restore the three requested schedules with single-use internal tokens; the two AI content schedules remain paused
- [x] Process queued welcome emails only for confirmed users whose sign-up is within seven days
- [x] Verify Resend confirmation delivery using Resend's accepted test recipients for both account types
- [ ] Enable leaked-password protection in external Supabase Auth settings (no settings-write tool available)
- [ ] Complete remaining broader HTML rendering and legacy promo checkout audit
- [x] Deploy protected functions; verify live 401 rejections and deleted function 404; 8 security tests passed
- [x] Run database scan; deep scan started against pre-edit saved source and awaits notification

# Premium resume templates

# Company deletion safeguard regression
- [x] Check all deletion blockers before any invoice, package, or PayPal changes; fail closed on lookup errors
- [x] Run request-level regression tests for blocked and permitted deletion (8 passed with mocked records; no real customer deletion performed)

# Unified employer pricing and private packages
- [x] Keep admin English and add Create package with select/add company and editable quotation terms; isolated desktop/mobile form verified, 30 tests passed
- [x] Replace legacy employer upgrade prices with the PayPal catalog and checkout
- [x] Make private employer quotations configurable under admin Packages
- [x] Validate PayPal amounts, package credits and publication limits
- [x] Verify public prices, redirects, mobile layout and 28 pricing/offer tests; deploy payment functions
- [ ] Verify signed-in company creation, admin assignment, employer purchase and credit readback (external Supabase authenticated testing unavailable)
- [x] Enable live PayPal mode using the user's confirmed live credentials; full payment verification awaits a signed-in employer

- [x] Add four A4 premium template renderers
- [x] Register premium metadata and aliases
- [x] Add premium/free-now labels in the selector and gallery
- [x] Insert active premium template records
- [x] Verify thumbnails, previews, PDFs, and existing templates

# Premium resume templates announcement

- [x] Capture real screenshots of the new templates
- [x] Publish an SEO-optimized blog post with screenshots
- [x] Add a clear call to action to browse templates and build a resume
- [x] Verify the published article and links

# Responsive navigation and adaptive layouts

- [x] Add accessible navigation for foldables, phones, and tablets
- [x] Tune homepage typography, controls, cards, and grids for narrow screens
- [x] Verify representative foldable, phone, tablet, iPad, and desktop widths

# Legal pages and IndexNow

- [x] Add bilingual Privacy Policy and Terms of Service pages, link them in the footer and sitemap
- [x] Automatically submit every new job, blog post and company page to IndexNow
- [x] Fix duplicate SEO titles and duplicate AI blog posts (waiting on user's choice for the 6 duplicates)

# Employer PayPal payments

- [x] Confirm listing prices, monthly package allowances, and test-first preference
- [x] Securely connect PayPal sandbox credentials
- [x] Implement verified PayPal one-time checkout (test mode)
- [x] Recurring auto-renew billing and webhook reconciliation
- [x] Enforce one free 30-day listing per employer per calendar month and paid listing/package allowances
- [x] Update employer pricing and purchase controls without breaking existing client access
- [x] Add concrete pricing/allowance tests and verify checkout, cancellation and payment readback
- [x] Confirm yearly rates before enabling yearly package billing (not supplied)

## PayPal auto-renewal (done 2026-10-16)
- [x] Monthly packages are PayPal subscriptions (auto-created billing plans, stored in paypal_plans)
- [x] subscriptions table extended with paypal_subscription_id, period start/end, last payment
- [x] API-credentials-only setup: no webhook; renewals sync via daily pg_cron (03:15) + on-return activation
- [x] EmployerPayPal page: subscribe/cancel UI, active package card
- [x] Yearly prices still needed before yearly billing

## Employer payment UX redesign (done 2026-10-16)
- [x] Central pricing config (src/lib/pricingConfig.ts) — single source, lek approx, VAT note
- [x] Rewrite /pricing: Per job | Monthly toggle, Recommended badges, Enterprise quote row, lek + VAT + PayPal notes
- [x] New /post-job/:jobId/checkout: visibility cards, urgent checkbox, free/slot pre-select, review + PayPal SDK buttons, success + FB share
- [x] EmployerDashboard: save new jobs as awaiting_payment, "Awaiting payment" section with Pay now
- [x] /employer/billing: current package, usage, receipts, upgrade
- [x] /employer/paypal → redirect to /employer/billing; remove old page
- [x] Bilingual via language toggle (no double labels); test-mode badge admin-only
- [x] PayPal client-id exposure for JS SDK (public config action in paypal-checkout)

Note: authenticated checkout flow (PayPal SDK buttons, free-slot publish) not tested end-to-end — no managed session (external Supabase). User should test with a sandbox buyer account.

# TIA client-only quotation
- [x] Add quoted fixed-term products without changing public prices
- [x] Add admin assignment, agreed activation date and private PayPal purchase controls
- [x] Grant expiring total credits only after verified payment and consume them atomically
- [x] Test prices, durations, limits and service-only settlement access; signed-in payment verification tracked above

## Open
- Admin must click "Migrate Resumes to R2" in Admin → Settings → Storage to move legacy Supabase-bucket resumes into R2 (one-time, idempotent).
