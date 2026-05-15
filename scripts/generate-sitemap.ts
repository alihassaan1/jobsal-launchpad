// Generates public/sitemap.xml at build time (runs via predev/prebuild).
// Fetches dynamic content (jobs, posts, companies) from Supabase using the
// publishable anon key. Falls back to static routes only if Supabase is
// unreachable so the build never fails.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://jobs.al";
const SUPABASE_URL = "https://vbnrmpudzcxjfdytlgks.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibnJtcHVkemN4amZkeXRsZ2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDI3NTEsImV4cCI6MjA3NTQ3ODc1MX0.mE_xVN6bD2vwrEeifW__4vfQHv1qpRsm0mLGo4W-9BE";

interface Entry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

const staticRoutes: Entry[] = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/jobs", changefreq: "hourly", priority: "0.95" },
  { loc: "/companies", changefreq: "daily", priority: "0.9" },
  { loc: "/blog", changefreq: "daily", priority: "0.85" },
  { loc: "/ai-resume-builder", changefreq: "weekly", priority: "0.8" },
  { loc: "/resume-builder-al", changefreq: "weekly", priority: "0.8" },
  { loc: "/resume-templates", changefreq: "weekly", priority: "0.75" },
  { loc: "/pricing", changefreq: "monthly", priority: "0.7" },
  { loc: "/recommended-jobs", changefreq: "daily", priority: "0.65" },
];

async function fetchAll(table: string, select: string, filter?: { col: string; val: any }) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const pageSize = 1000;
  let offset = 0;
  let all: any[] = [];
  while (true) {
    let q: any = (supabase.from(table) as any).select(select).range(offset, offset + pageSize - 1);
    if (filter) q = q.eq(filter.col, filter.val);
    const { data, error } = await q;
    if (error) {
      console.warn(`[sitemap] ${table} fetch error:`, error.message);
      break;
    }
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

function urlTag(e: Entry) {
  return [
    "  <url>",
    `    <loc>${BASE_URL}${e.loc}</loc>`,
    e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
    e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
    e.priority ? `    <priority>${e.priority}</priority>` : null,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

async function main() {
  const now = new Date().toISOString();
  const entries: Entry[] = [...staticRoutes];

  try {
    const [jobs, posts, companies] = await Promise.all([
      fetchAll("jobs", "slug, updated_at, category, location", { col: "is_active", val: true }),
      fetchAll("posts", "slug, updated_at", { col: "is_published", val: true }),
      fetchAll("companies", "slug, updated_at"),
    ]);

    const categories = [...new Set(jobs.map((j: any) => j.category).filter(Boolean))];
    const locations = [...new Set(jobs.map((j: any) => j.location).filter(Boolean))];

    categories.forEach((c: any) =>
      entries.push({
        loc: `/jobs?category=${encodeURIComponent(c)}`,
        lastmod: now,
        changefreq: "daily",
        priority: "0.8",
      })
    );
    locations.forEach((l: any) =>
      entries.push({
        loc: `/jobs?location=${encodeURIComponent(l)}`,
        lastmod: now,
        changefreq: "daily",
        priority: "0.8",
      })
    );
    jobs.forEach((j: any) =>
      entries.push({
        loc: `/jobs/${j.slug}`,
        lastmod: new Date(j.updated_at).toISOString(),
        changefreq: "weekly",
        priority: "0.9",
      })
    );
    posts.forEach((p: any) =>
      entries.push({
        loc: `/blog/${p.slug}`,
        lastmod: new Date(p.updated_at).toISOString(),
        changefreq: "monthly",
        priority: "0.65",
      })
    );
    companies.forEach((c: any) =>
      entries.push({
        loc: `/companies/${c.slug}`,
        lastmod: new Date(c.updated_at).toISOString(),
        changefreq: "weekly",
        priority: "0.75",
      })
    );

    console.log(
      `[sitemap] dynamic: ${jobs.length} jobs, ${posts.length} posts, ${companies.length} companies, ${categories.length} categories, ${locations.length} locations`
    );
  } catch (err) {
    console.warn("[sitemap] dynamic fetch failed, writing static-only sitemap:", err);
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(urlTag),
    "</urlset>",
  ].join("\n");

  writeFileSync(resolve("public/sitemap.xml"), xml);
  console.log(`[sitemap] wrote public/sitemap.xml (${entries.length} entries)`);
}

main().catch((e) => {
  console.error("[sitemap] fatal:", e);
  process.exit(0); // never block the build
});
