# Premium resume templates

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
