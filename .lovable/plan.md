## Goal
After signup or login, employers land on the Employer Dashboard (not the homepage). If their company profile is missing or still a draft, a prominent banner blocks job posting until they complete it.

## Changes

### 1. Redirect employers to `/employer-dashboard`
Currently `src/pages/Auth.tsx` sends employers to `/setup-company` after login/register, and the "already logged in" guard does the same. Job seekers go to `/`.

Update both the post-login, post-register, and "already authenticated" branches so:
- `userRole === 'employer'` → `/employer-dashboard`
- everyone else → `/` (unchanged)

The dashboard itself will surface the setup CTA via the banner below, so users still get pushed to complete their profile — just with full context around them.

### 2. "Complete your company profile" banner on Employer Dashboard
In `src/pages/EmployerDashboard.tsx`, after the `company` query resolves, compute:

```
const isDraft = !company
  || !company.name
  || company.name.endsWith("(Draft)")
  || !company.description
  || !company.industry
  || !company.location;
```

(Treats the auto-created draft row from `ensureCompanyForUser` as incomplete; also treats any company missing core fields as incomplete.)

When `isDraft` is true, render a prominent banner at the top of the dashboard (above the jobs section) using existing design tokens:
- Title: "Complete your company profile"
- Body: "You need to finish setting up your company before you can post jobs."
- Primary CTA button: "Complete profile" → navigates to `/setup-company`
- Use `bg-primary/10`, `border-primary/30`, `text-primary` styling consistent with the rest of the app (Albanian Red theme).

### 3. Gate job posting while draft
While `isDraft` is true:
- Disable the "Post a Job" / Create Job button (and any "New Job" trigger) with a tooltip or helper text: "Complete your company profile first."
- If a user somehow opens the create-job dialog, show the same message inside the dialog instead of the form.

### 4. No backend changes
No schema migrations, no edge function changes. Pure frontend routing + UI.

## Files touched
- `src/pages/Auth.tsx` — redirect employers to `/employer-dashboard` in 3 spots (already-logged-in guard, `handleLogin`, `handleRegister`).
- `src/pages/EmployerDashboard.tsx` — add `isDraft` derivation, banner component, and disabled state on the create-job CTA.

## Out of scope
- Changing what `ensureCompanyForUser` writes (the "(Draft)" suffix stays as the draft signal).
- Any changes to `SetupCompany.tsx` itself.
