## Plan

### 1. Sort companies list by latest signup
In `src/pages/AdminCompanies.tsx` (`fetchCompanies`), the final list is built as `[...companiesEnriched, ...orphanRows]`, which appends orphan employers at the end regardless of date. Fix by sorting the combined array by `created_at` descending before `setCompanies(...)`.

### 2. Remove email confirmation completely
Two parts:

**a) Disable it in Lovable Cloud (you do this once):**
Cloud → Users → Auth settings → Email provider → turn **Confirm email** OFF → Save. This is a platform setting, not code — I cannot toggle it for you.

**b) Simplify signup code so it no longer relies on the confirmation workaround:**
- `supabase/functions/employer-signup/index.ts` — keep but no longer needed for confirmation bypass; either delete or leave (it still does role + company seed). Recommend keeping it for the role-assignment side-effect, just remove `email_confirm: true` reasoning from comments.
- `src/pages/Auth.tsx` / `src/contexts/AuthContext.tsx` — remove any "check your email to confirm" messaging and the post-signup branching that handles unconfirmed users. After signup, sign the user in directly and redirect.
- Remove the admin "Reset password to Login123" button workaround from `src/pages/AdminUsers.tsx`? → Leave it (still useful), but stop surfacing it as the recovery path for new signups.

### Files to change
- `src/pages/AdminCompanies.tsx` — sort merged list by `created_at` desc.
- `src/pages/Auth.tsx` — remove "confirm your email" UI/messaging; always proceed to signed-in state after signup.
- `src/contexts/AuthContext.tsx` — drop confirmation-pending branches in `signUp`.
- `supabase/functions/employer-signup/index.ts` — comment cleanup only.

### What I will NOT do
- Will not toggle the Supabase auth setting (you do that in Cloud → Users).
- Will not touch unrelated business logic.
