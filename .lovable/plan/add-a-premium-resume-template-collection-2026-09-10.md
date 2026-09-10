# Add a premium resume template collection

## What will be added

Four brand-new, high-end resume designs, each built as real A4 HTML rather than a preview image:

1. **Signature** — refined editorial layout for leadership and consulting roles.
2. **Nordic** — minimal, airy layout for modern professional roles.
3. **Vanguard** — structured two-column layout for product, design, and commercial roles.
4. **Ledger** — precise, compact layout for finance, legal, and operations roles.

All four will carry a **Premium** label but remain selectable and downloadable for free during the promotional period.

## Experience

- Add the designs to the public template gallery and the builder's “Change Template” window.
- Clearly label premium templates and show that they are currently free.
- Keep existing resumes and all five current templates working unchanged.
- Use the exact same template renderer for gallery thumbnails, full previews, the live builder, and PDF export.

## Technical details

- Create four A4-safe React template renderers with solid colours, print-safe typography, stable spacing, and section break protection.
- Extend the shared template registry with premium metadata and database slug aliases.
- Add the four active `resume_templates` records through a safe, repeatable database migration (`is_premium = true`), without introducing payment enforcement yet.
- Resolve saved and gallery-selected templates to canonical slugs so premium selections persist correctly.
- Improve the selector's premium/free-now labels without changing access rules.

## Quality checks

- Check TypeScript and the current build diagnostics.
- Render every new gallery thumbnail and full A4 preview in the running app.
- Generate sample PDFs for all four templates, convert them to images, and visually inspect them for clipping, overlaps, broken fonts, poor contrast, and thumbnail/PDF differences.
- Verify the existing five templates still open and render.
