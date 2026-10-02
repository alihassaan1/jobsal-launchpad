# Add the shared footer across the entire site

## Implementation
- Render the existing Jobs.al footer once at the application level so every page receives it automatically, including job details, search pages, account pages, employer pages, and admin pages.
- Remove page-specific footer instances and the older custom footer on My Resumes to prevent duplicate footers and inconsistent content.
- Keep all page content and existing actions unchanged.

## Verification
- Check representative public, job-detail, candidate, employer, admin, authentication, and missing-page screens.
- Confirm each screen has exactly one footer, no horizontal overflow, and no new browser or build errors.

## Technical details
- Use the existing shared Footer component below the page router rather than adding it separately to every screen.
- Preserve all current footer links, translations, and social media settings.
