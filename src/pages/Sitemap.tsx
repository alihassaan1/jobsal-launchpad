import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Helper to fetch all rows beyond the 1000-row default limit
async function fetchAll<T>(
  table: string,
  select: string,
  filter?: { column: string; value: any }
): Promise<T[]> {
  const pageSize = 1000;
  let offset = 0;
  let allData: T[] = [];
  let hasMore = true;

  while (hasMore) {
    let query = supabase.from(table).select(select).range(offset, offset + pageSize - 1);
    if (filter) {
      query = query.eq(filter.column, filter.value);
    }
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      hasMore = false;
    } else {
      allData = allData.concat(data as T[]);
      offset += pageSize;
      if (data.length < pageSize) hasMore = false;
    }
  }
  return allData;
}

const Sitemap = () => {
  const [xml, setXml] = useState("");

  useEffect(() => {
    generateSitemap();
  }, []);

  const generateSitemap = async () => {
    const baseUrl = "https://jobs.al";

    // Fetch ALL published posts, active jobs, and companies (no 1000-row cap)
    const [posts, jobs, companies] = await Promise.all([
      fetchAll<{ slug: string; updated_at: string }>("posts", "slug, updated_at", { column: "is_published", value: true }),
      fetchAll<{ slug: string; updated_at: string; category: string; location: string }>("jobs", "slug, updated_at, category, location", { column: "is_active", value: true }),
      fetchAll<{ slug: string; updated_at: string }>("companies", "slug, updated_at"),
    ]);

    // Collect unique categories and locations from jobs for index pages
    const categories = [...new Set(jobs.map(j => j.category).filter(Boolean))];
    const locations = [...new Set(jobs.map(j => j.location).filter(Boolean))];

    // Static routes
    const staticRoutes = [
      { loc: "/", priority: "1.0", changefreq: "daily" },
      { loc: "/jobs", priority: "0.95", changefreq: "hourly" },
      { loc: "/companies", priority: "0.9", changefreq: "daily" },
      { loc: "/blog", priority: "0.85", changefreq: "daily" },
      { loc: "/ai-resume-builder", priority: "0.8", changefreq: "weekly" },
      { loc: "/resume-builder-al", priority: "0.8", changefreq: "weekly" },
      { loc: "/resume-templates", priority: "0.75", changefreq: "weekly" },
      { loc: "/pricing", priority: "0.7", changefreq: "monthly" },
      { loc: "/recommended-jobs", priority: "0.65", changefreq: "daily" },
    ];

    const now = new Date().toISOString();
    let x = '<?xml version="1.0" encoding="UTF-8"?>\n';
    x += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Static
    staticRoutes.forEach(r => {
      x += `  <url>\n    <loc>${baseUrl}${r.loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>\n`;
    });

    // Category pages
    categories.forEach(cat => {
      const encoded = encodeURIComponent(cat);
      x += `  <url>\n    <loc>${baseUrl}/jobs?category=${encoded}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    // Location pages
    locations.forEach(loc => {
      const encoded = encodeURIComponent(loc);
      x += `  <url>\n    <loc>${baseUrl}/jobs?location=${encoded}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    // Jobs
    jobs.forEach(job => {
      x += `  <url>\n    <loc>${baseUrl}/jobs/${job.slug}</loc>\n    <lastmod>${new Date(job.updated_at).toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    });

    // Blog posts
    posts.forEach(post => {
      x += `  <url>\n    <loc>${baseUrl}/blog/${post.slug}</loc>\n    <lastmod>${new Date(post.updated_at).toISOString()}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.65</priority>\n  </url>\n`;
    });

    // Companies
    companies.forEach(company => {
      x += `  <url>\n    <loc>${baseUrl}/companies/${company.slug}</loc>\n    <lastmod>${new Date(company.updated_at).toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.75</priority>\n  </url>\n`;
    });

    x += "</urlset>";
    setXml(x);
  };

  useEffect(() => {
    if (xml) {
      document.body.innerHTML = `<pre>${xml}</pre>`;
    }
  }, [xml]);

  return (
    <div style={{ fontFamily: "monospace", whiteSpace: "pre-wrap", padding: "20px" }}>
      {xml || "Generating sitemap..."}
    </div>
  );
};

export default Sitemap;
