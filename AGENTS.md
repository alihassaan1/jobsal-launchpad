# Project architecture

- Keep all PayPal prices and allowances in the server product catalog; client views import it so charged and displayed amounts cannot diverge.
- Client quotations are private company-and-employer-bound offers, separate from recurring subscriptions; only server-validated admins assign them, and service-only transactional functions settle payments and consume credits to prevent quota races.
- Derive client publication expiry from stored publication timestamps in the public jobs view rather than polling to hide expired vacancies.
- File storage lives in Cloudflare R2 (S3-compatible via aws4fetch): resumes under `resumes/` (private, owner/admin presigned GET), website images under `images/{blog,logos,banners,ads,jobs,templates,misc}/` (public via R2_PUBLIC_URL, folder allowlisted server-side); the `r2-storage` edge function issues presigned URLs and content generators fall back to the Supabase `blog-images` bucket when R2 is unconfigured.
