# Lock down analytics columns at the database layer

## Why
Right now Postgres RLS lets anyone (logged out included) call the `jobs`, `companies`, and `posts` tables directly and read `views_count`, `applications_count`, and `followers_count` for every active row — even though the UI hides them. Row-level policies can't filter columns, so we need public-safe views and tighter base-table policies.

## Approach

Create one read-only public view per affected table that excludes the analytics columns. Restrict the base table's SELECT policy to owners and admins. Point every public-facing frontend query at the view. Internal employer/admin pages keep using the base table (they're already gated by ownership/admin in RLS).

## Migration

1. `jobs_public` view with `security_invoker=on` — all columns except `views_count`, `applications_count`.
2. `companies_public` view — all columns except `views_count`, `followers_count`.
3. `posts_public` view — all columns except `views_count` (still filtered to `is_published = true`).
4. Replace the existing public SELECT policies on the base tables:
   - `jobs`: SELECT only for `posted_by = auth.uid()`, company owner, or admin.
   - `companies`: SELECT only for `owner_id = auth.uid()`, company members, or admin.
   - `posts`: SELECT only for author/admin/editor (drop "Anyone can view published posts").
5. Grant SELECT on the three new views to `anon` and `authenticated`.

## Frontend updates

Switch read queries that don't need the hidden columns to the public views:

- `src/pages/Jobs.tsx`, `JobsByCategory.tsx`, `JobsByLocation.tsx`, `JobDetail.tsx`, `Index.tsx`, `TopEmployers.tsx` → `jobs_public`
- `src/pages/Companies.tsx`, `CompanyProfile.tsx`, `FeaturedCompanies.tsx`, `Index.tsx`, `TopEmployers.tsx` → `companies_public`
- `src/pages/Blog.tsx`, `BlogPost.tsx`, `Index.tsx` → `posts_public`

Employer/admin pages (`EmployerDashboard`, `EmployerAnalytics`, `AdminJobs`, `AdminDashboard`, `AdminAnalytics`, `AdminCompanies`, `AdminBlog`, `EmployerCompanyProfile`, `ATSJobApplications`, `EmployerAds*`, `EmployerSubscription`) keep querying the base tables — RLS already permits this for owners/admins.

The `increment_job_views` / `increment_post_views` / `increment_company_views` RPCs already run as `SECURITY DEFINER`, so view-tracking still works for anonymous visitors.

## Verification

- Run the Supabase linter after the migration.
- Hit `jobs_public` and `jobs` as an anonymous user via `supabase--curl_edge_functions` (or the SQL editor) — `jobs_public` returns rows, `jobs` returns none.
- Load `/`, `/jobs`, `/jobs/:slug`, `/companies`, `/blog` in the preview to confirm no regressions.
- Load `/dashboard` and `/employer/analytics` as an employer to confirm counts still display.
