

# Email Templates & Alerts Setup Plan

## Current State

You already have **6 working email templates** in the `send-email` edge function:
- Welcome, Resume Reminder (Day 3, 7, 14), Weekly Digest, Application Confirmation

And **10 template records** in the `email_templates` DB table (including job-match, reactivation, profile-incomplete, application-status that don't have actual HTML implementations yet).

## What I'll Add

### New Email Templates (HTML implementations in send-email edge function)

| Template | Slug | Trigger | Purpose |
|----------|------|---------|---------|
| Job Match Alert | `job-match` | When AI finds matching jobs | Notifies candidates of new jobs matching their skills/resume |
| Application Status Update | `application-status` | Employer changes status | Tells candidate their app moved to reviewed/shortlisted/rejected |
| Profile Incomplete | `profile-incomplete` | Day 5 after signup, no profile info | Nudges users to complete phone, location, bio |
| Account Reactivation | `reactivation` | 30 days inactive | Win-back email with latest job stats |
| Employer Welcome | `employer-welcome` | Employer signs up | Onboarding for employers with company setup CTA |
| Job Expiring Soon | `job-expiring` | 3 days before job deadline | Alerts candidates who saved/viewed the job |
| New Applicant Notification | `new-applicant` | Candidate applies | Notifies employer of new application |
| Interview Scheduled | `interview-scheduled` | Employer schedules interview | Confirms interview details to candidate |

### Alert Automation (Scheduled Edge Functions)

1. **Job Match Alerts** — New scheduled function `scheduled-job-alerts` that runs daily, checks new jobs posted in last 24h, matches against user resumes/preferences, sends `job-match` emails to top matches.

2. **Profile Completion Reminders** — Add to existing `scheduled-email-reminders` function: Day 5 check for users with incomplete profiles (missing phone, location, or bio).

3. **Inactive User Reactivation** — Add to existing `scheduled-email-reminders`: 30-day inactivity check, sends `reactivation` email with fresh job counts.

4. **Employer Notifications** — Trigger `new-applicant` email when a new application is inserted (called from the application submission flow in the frontend).

### Database Changes

- Add new template records to `email_templates` table for the new slugs (`employer-welcome`, `job-expiring`, `new-applicant`, `interview-scheduled`)
- Add `user_email_preferences` columns for new alert types if not present

### Technical Details

- All new templates follow existing Albanian language style and Jobs.al branding
- All emails use the existing `wrapEmail()` base wrapper for consistent header/footer
- New templates added as functions in `send-email/index.ts` and registered in the template map
- `scheduled-job-alerts` will be a new edge function with `verify_jwt = false`
- Employer notification emails triggered inline from frontend after successful application insert
- All sends logged to `email_logs` table via existing logging logic

### Files to Create/Modify

1. **`supabase/functions/send-email/index.ts`** — Add 8 new template generators and register them
2. **`supabase/functions/scheduled-email-reminders/index.ts`** — Add profile-incomplete and reactivation checks
3. **`supabase/functions/scheduled-job-alerts/index.ts`** — New function for daily job match alerts
4. **`supabase/config.toml`** — Register `scheduled-job-alerts`
5. **DB migration** — Insert new template records into `email_templates`
6. **`src/components/ApplyToJobDialog.tsx`** — Trigger `new-applicant` email after successful application

