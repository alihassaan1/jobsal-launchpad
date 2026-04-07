

# GSC Data Analysis & SEO Keyword Optimization Plan

## Key Findings from Google Search Console (Last 3 Months)

### Performance Summary
- **72 total clicks, 1,345 impressions, 5.35% avg CTR, 21.9 avg position**
- Mobile dominates (51 clicks / 71%) but desktop has 6x more impressions (858) with terrible CTR (2.1%)
- Almost all traffic lands on homepage (70/72 clicks). Blog, resume-builder, and jobs pages get nearly zero clicks
- Albania is top country (31 clicks) but US has 223 impressions with only 1 click (position 31.6)

### High-Value Keyword Opportunities

**Tier 1 — Already ranking, need CTR improvement (positions 1-10):**
| Keyword | Clicks | Impressions | Position | Action |
|---------|--------|-------------|----------|--------|
| jobsal | 2 | 66 | 1.94 | Brand — already #1, optimize title/desc for CTR |
| jobs al | 5 | 55 | 4.04 | Optimize homepage meta for this exact query |
| job al | 2 | 30 | 5.53 | Same cluster as above |
| al jobs | 2 | 34 | 9.26 | Same cluster |
| work al | 0 | 3 | 6.67 | Include in homepage keywords |

**Tier 2 — High impressions but poor position (10-50), biggest growth potential:**
| Keyword | Impressions | Position | Action |
|---------|-------------|----------|--------|
| jobs in albania | 69 | 46.6 | Create dedicated landing content |
| jobs hiring near me full time | 43 | 8.35 | Already page 1! Optimize for CTR |
| jobs in tirana | 39 | 31.7 | Create Tirana jobs landing page content |
| albania jobs | 34 | 56.8 | Strengthen homepage targeting |
| job vacancies | 25 | 31.7 | Add to page meta + H1 copy |
| job in albania | 24 | 51.5 | Long-tail blog/page target |
| jobs in albanien | 13 | 85.6 | German-language searchers — potential DE content |

**Tier 3 — Zero clicks, moderate impressions, fixable:**
| Keyword | Impressions | Position |
|---------|-------------|----------|
| where to find jobs | 12 | 10.1 |
| albania job portal | 8 | 10.4 |
| jobs hiring near me | 5 | 10.2 |
| job search | 4 | 10.5 |

### Page Performance Issues
- `/jobs` page: 0 clicks, 4 impressions — not indexed well
- `/blog`: 1 click, 21 impressions — needs better meta
- `/companies`: 0 clicks — missing from search targeting
- Blog posts not appearing in queries at all

---

## Implementation Plan

### 1. Optimize Homepage Meta Tags (Index.tsx)
Update `<Helmet>` with GSC-informed keywords:
- Title: "Jobs.al — Jobs in Albania | Job Vacancies & Career Portal"
- Description: Include top query terms: "jobs in Albania", "jobs in Tirana", "job vacancies", "albania job portal"
- Keywords meta: Add all Tier 1 + 2 query terms
- Add structured data (JobPosting aggregate, WebSite with SearchAction)

### 2. Optimize Jobs Page Meta (Jobs.tsx)
- Title: "Job Vacancies in Albania | Find Jobs in Tirana & All Cities"
- Description: Target "job vacancies", "jobs hiring", "jobs in tirana", "full time jobs albania"
- Add `WebSite` SearchAction schema for sitelinks search box

### 3. Optimize Blog Page Meta (Blog.tsx)
- Title: "Career Advice & Job Market Insights Albania | Jobs.al Blog"
- Better description targeting career-related long-tail queries

### 4. Update index.html Default Meta
- Update default `<meta>` keywords and description with top-performing search terms
- Update OG image to actual Jobs.al branded image instead of lovable.dev placeholder

### 5. Add Structured Data to Homepage
- `WebSite` schema with `SearchAction` (enables Google sitelinks search box)
- `Organization` schema with logo, name, social profiles
- `JobPosting` aggregate breadcrumb

### 6. Create/Optimize Landing Pages for High-Value Keywords
- Ensure `/jobs?location=Tirana` pages have proper meta (already exist via JobsByLocation)
- Verify JobsByCategory and JobsByLocation pages have keyword-optimized Helmet tags

### 7. Update robots.txt
- Verify sitemap reference is correct
- Ensure all key pages are crawlable

---

### Files to Modify
1. **`index.html`** — Update default meta tags, OG image, add Organization schema
2. **`src/pages/Index.tsx`** — Rewrite Helmet with GSC-optimized keywords + WebSite schema
3. **`src/pages/Jobs.tsx`** — Optimize title/description for job vacancy queries
4. **`src/pages/Blog.tsx`** — Better meta targeting career advice keywords
5. **`src/pages/Companies.tsx`** — Add meta targeting "companies in albania" queries
6. **`src/pages/JobsByLocation.tsx`** — Verify/optimize location-specific meta
7. **`src/pages/JobsByCategory.tsx`** — Verify/optimize category-specific meta
8. **`src/pages/ResumeBuilderLanding.tsx`** — Target "krijo cv shqip", "resume builder" queries
9. **`public/robots.txt`** — Verify sitemap and crawl rules

