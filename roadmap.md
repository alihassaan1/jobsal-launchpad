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
- [ ] Fix duplicate SEO titles and duplicate AI blog posts (waiting on user's choice for the 6 duplicates)

# Employer PayPal payments

- [x] Confirm listing prices, monthly package allowances, and test-first preference
- [x] Securely connect PayPal sandbox credentials
- [x] Implement verified PayPal one-time checkout (test mode)
- [ ] Recurring auto-renew billing and webhook reconciliation
- [ ] Enforce one free 30-day listing per employer per calendar month and paid listing/package allowances
- [ ] Update employer pricing and purchase controls without breaking existing client access
- [ ] Add concrete pricing/allowance tests and verify checkout, cancellation and payment readback
- [ ] Confirm yearly rates before enabling yearly package billing (not supplied)

## PayPal auto-renewal (done 2026-10-16)
- [x] Monthly packages are PayPal subscriptions (auto-created billing plans, stored in paypal_plans)
- [x] subscriptions table extended with paypal_subscription_id, period start/end, last payment
- [x] paypal-webhook function handles renewals/cancellations (needs PAYPAL_WEBHOOK_ID secret + webhook registered in PayPal dashboard)
- [x] Daily pg_cron sync (03:15) as webhook fallback
- [x] EmployerPayPal page: subscribe/cancel UI, active package card
- [ ] User: register webhook URL https://vbnrmpudzcxjfdytlgks.supabase.co/functions/v1/paypal-webhook in PayPal Developer (events: BILLING.SUBSCRIPTION.*, PAYMENT.SALE.COMPLETED) and provide webhook ID as PAYPAL_WEBHOOK_ID secret
- [ ] Yearly prices still needed before yearly billing
