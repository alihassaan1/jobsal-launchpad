# Project architecture

- Keep all PayPal prices and allowances in the server product catalog; client views import it so charged and displayed amounts cannot diverge.
- Client quotations are private company-and-employer-bound offers, separate from recurring subscriptions; only server-validated admins assign them, and service-only transactional functions settle payments and consume credits to prevent quota races.
- Derive client publication expiry from stored publication timestamps in the public jobs view rather than polling to hide expired vacancies.