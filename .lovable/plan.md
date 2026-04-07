

# Bing Webmaster Tools Keyword Analysis & SEO Update Plan

## Key Findings from Bing Data (436 keywords)

### Bing vs Google — What's New

Bing reveals keyword clusters that barely appeared in GSC, representing untapped audiences:

**1. Foreigners/Expats Cluster (HIGH VALUE — 50+ combined impressions)**
| Keyword | Impressions | Clicks | Position |
|---------|-------------|--------|----------|
| albania jobs for foreigners | 17 | 3 | 5.6 |
| jobs in albania for expats | 5 | 0 | 2.0 |
| english speaking jobs in albania | 5 | 0 | 6.4 |
| jobs in albania for british people | 4 | 1 | 6.0 |
| jobs albania foreigners | 4 | 0 | 2.0 |
| jobs for americans in albania | 2 | 0 | 7.0 |
| albania jobs for indian | 2 | 0 | 5.0 |

This is a completely new audience segment not targeted anywhere on the site.

**2. Job Synonyms Missing from Current Meta**
| Keyword | Impressions | Position |
|---------|-------------|----------|
| job openings in albania | 9 | 2.2 |
| job opportunities in albania | 8 | 2.5 |
| vacancies albania | 8 | 3.2 |
| albania job apply | 12 | 4.2 |
| hiring in albania | 3 | 2.0 |
| job offers in albania | 2 | 1.0 |

**3. Industry-Specific Queries (not targeted at all)**
- banking jobs albania (13 imp)
- nursing jobs, hotel jobs, aviation jobs, pharmacy jobs, engineering jobs

**4. City Queries Beyond Tirana**
- jobs in durres albania (3 imp, 1 click)
- vlore albania jobs (1 imp)
- jobs in south albania (1 imp)

**5. Competitor Brand Queries (people looking for alternatives)**
- indeed albania (9 imp, 0 clicks, pos 3.4)
- indeed.com albania (3 imp)
- indeed jobs albania (2 imp)

### Performance Summary
- Top keyword: "jobs in albania" — 125 impressions, 19 clicks, position 2.6 (much better than Google's 46.6!)
- "albania jobs" — 34 imp, 14 clicks, 41% CTR at position 1.8
- Brand query "jobs.al" — only 2 impressions (low brand awareness on Bing)

---

## Implementation Plan

### 1. Update Homepage Meta (Index.tsx)
Add Bing-discovered keywords to the `keywords` meta tag:
- Add: "job openings in albania", "job opportunities in albania", "albania jobs for foreigners", "english speaking jobs in albania", "hiring in albania", "vacancies albania", "job offers albania"
- Update description to naturally include "job openings" and "job opportunities"

### 2. Update Jobs Page Meta (Jobs.tsx)
- Add to keywords: "job openings", "job opportunities", "vacancies", "albania job apply", "hiring in albania"
- Update description to include "job openings" and "hiring" synonyms

### 3. Update Blog Page Meta (Blog.tsx)
- Add career-related Bing terms: "career opportunities albania", "employment in albania"

### 4. Update index.html Global Meta
- Add new keyword terms to the default keywords meta tag
- Update description with "job openings" and "opportunities" synonyms

### 5. Update Companies Page (Companies.tsx)
- Add "employment company in albania", "companies hiring in albania" to keywords

### 6. Update ResumeBuilderLanding Meta
- Add "job apply albania", "cv for albania jobs" terms

### 7. Update JobsByLocation (JobsByLocation.tsx)
- Ensure Durres and other cities have keyword coverage for "jobs in durres albania", "jobs tirana"

---

### Files to Modify
1. **`index.html`** — Expand default keywords with Bing-discovered terms
2. **`src/pages/Index.tsx`** — Add foreigners/expats and synonym keywords
3. **`src/pages/Jobs.tsx`** — Add "job openings", "opportunities", "hiring" terms
4. **`src/pages/Blog.tsx`** — Add employment-related long-tail keywords
5. **`src/pages/Companies.tsx`** — Add "companies hiring" keywords
6. **`src/pages/ResumeBuilderLanding.tsx`** — Add application-related terms
7. **`src/pages/JobsByLocation.tsx`** — Verify city-specific keyword coverage

