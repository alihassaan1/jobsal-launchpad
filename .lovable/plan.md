# Fix the Employer → Company flow

## Why it's broken today

Two separate concepts are being confused:

- **Role** (`user_roles.role = 'employer'`) — a permission flag.
- **Company** (`companies` row with `owner_id = user.id`) — the actual business entity that appears in Admin → Companies.

Promoting a user to `employer` in Admin → Users only flips the role. It does **not** create a `companies` row. Admin → Companies lists rows from the `companies` table, so the newly promoted employer never appears there until they (or an admin) explicitly create a company. There is also no prompt forcing the employer to complete `SetupCompany` after promotion, so many employers sit in limbo.

## Goal

Make "promote to employer" produce a usable employer account end-to-end, and make Admin → Companies reflect every employer (even those who haven't finished setup).

## Plan

### 1. Auto-create a draft company on employer promotion
- In `AdminUsers.tsx`, when a role change sets a user to `employer`, after upserting `user_roles`, check `companies` for a row with `owner_id = userId`.
- If none exists, insert a draft company:
  - `name`: user's `full_name` or email prefix + " (Draft)"
  - `slug`: generated from name + short uuid suffix to guarantee uniqueness
  - `owner_id`: that user
  - `email`: user's email
  - `is_verified: false`
- Same logic runs when an admin manually creates a user with the employer role.

### 2. Same auto-create on self-signup as employer
- In `AuthContext.signUp` (or the post-signup hook in `Auth.tsx`), when the chosen account type is "employer", create the draft company immediately after the role is assigned. This keeps signup and admin promotion consistent.

### 3. Make Admin → Companies show all employers
- Update `AdminCompanies.tsx` to also fetch all users with the `employer` role and left-merge them with the companies list.
- Employers without a `companies` row appear with a "No company yet" badge and a one-click **"Create company"** action that opens the existing Add Company dialog pre-filled with that owner.
- Add a status filter: All / Has company / Missing company / Unverified.

### 4. Force employer onboarding in the app
- Add a guard in `EmployerDashboard` (and other Employer* pages) that, if the logged-in employer has no `companies` row, redirects to `/setup-company` with an explanatory banner.
- After successful company creation in `SetupCompany`, redirect to `EmployerDashboard`.

### 5. Notification + audit
- Reuse the existing `role-upgrade-employer` email and append a CTA linking to `/setup-company`.
- Log the auto-created draft company in `ai_agent_logs` (or a simple console log) so admins can trace it.

## Technical notes

- No schema migration required — `companies` already supports everything needed.
- RLS already allows admins to insert any company and employers to insert their own; the auto-create from `AdminUsers` runs as the admin, so it satisfies the admin policy. The signup-time auto-create runs as the new user, which satisfies the existing `Employers can create companies` policy because the role is assigned first.
- Slug uniqueness: use `slugify(name) + '-' + crypto.randomUUID().slice(0,6)` to avoid collisions on common names.
- Keep the existing manual "Add Company" dialog — it's still useful for admins creating companies on behalf of users who don't yet have an account.

## Out of scope

- Redesigning the employer onboarding wizard itself.
- Changing the role data model (still `user_roles` table, no role column on profiles).
