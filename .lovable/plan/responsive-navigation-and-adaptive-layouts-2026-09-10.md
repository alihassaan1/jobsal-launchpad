# Responsive navigation and adaptive layouts

## Goal
Make the shared navigation and primary page content comfortable on narrow foldables, phones, tablets, iPads, laptops, and wide screens without changing existing workflows.

## Changes
- Replace the crowded small-screen navigation with a compact header and accessible slide-out menu containing all existing links, language controls, authentication actions, and account destinations.
- Scale navigation labels, spacing, and controls progressively across tablet and desktop widths so labels do not wrap or collide.
- Harden the homepage at narrow widths: reduce oversized headings and spacing, stack the search controls, keep statistics readable, and switch category/job/blog/company grids at content-appropriate breakpoints.
- Add narrow-screen safeguards for long labels, cards, popovers, images, and horizontal overflow.
- Audit pages using the shared navigation so they inherit the improved behavior without changing application logic.

## Technical details
- Reuse the existing Button, Sheet, DropdownMenu, and semantic color tokens.
- Use mobile-first Tailwind breakpoints plus targeted intermediate widths for foldables and tablets.
- Preserve all routes, authentication checks, translations, and click behavior.
- Keep touch targets at least 40–44px where practical and retain keyboard/focus support.

## Verification
- Check representative widths: 280px, 344px, 390px, 768px, 820px, 1024px, and desktop.
- Verify no horizontal scrolling, clipped text, overlapping controls, or broken menus.
- Run TypeScript/build checks and exercise navigation, search, language selection, and authentication actions where accessible.
