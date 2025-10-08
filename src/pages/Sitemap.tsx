import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Sitemap = () => {
  const [xml, setXml] = useState("");

  useEffect(() => {
    generateSitemap();
  }, []);

  const generateSitemap = async () => {
    const baseUrl = "https://jobs.al";
    
    // Fetch all published posts
    const { data: posts } = await supabase
      .from('posts')
      .select('slug, updated_at')
      .eq('is_published', true);

    // Fetch all companies
    const { data: companies } = await supabase
      .from('companies')
      .select('slug, updated_at');

    // Static routes
    const staticRoutes = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/jobs', priority: '0.9', changefreq: 'daily' },
      { loc: '/companies', priority: '0.9', changefreq: 'daily' },
      { loc: '/blog', priority: '0.9', changefreq: 'daily' },
      { loc: '/ai-resume-builder', priority: '0.8', changefreq: 'weekly' },
      { loc: '/resume-builder-al', priority: '0.8', changefreq: 'weekly' },
      { loc: '/resume-templates', priority: '0.7', changefreq: 'weekly' },
      { loc: '/pricing', priority: '0.7', changefreq: 'monthly' },
    ];

    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static routes
    staticRoutes.forEach(route => {
      xmlContent += '  <url>\n';
      xmlContent += `    <loc>${baseUrl}${route.loc}</loc>\n`;
      xmlContent += `    <changefreq>${route.changefreq}</changefreq>\n`;
      xmlContent += `    <priority>${route.priority}</priority>\n`;
      xmlContent += '  </url>\n';
    });

    // Add blog posts
    posts?.forEach(post => {
      xmlContent += '  <url>\n';
      xmlContent += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`;
      xmlContent += `    <lastmod>${new Date(post.updated_at).toISOString()}</lastmod>\n`;
      xmlContent += `    <changefreq>monthly</changefreq>\n`;
      xmlContent += `    <priority>0.6</priority>\n`;
      xmlContent += '  </url>\n';
    });

    // Add company profiles
    companies?.forEach(company => {
      xmlContent += '  <url>\n';
      xmlContent += `    <loc>${baseUrl}/companies/${company.slug}</loc>\n`;
      xmlContent += `    <lastmod>${new Date(company.updated_at).toISOString()}</lastmod>\n`;
      xmlContent += `    <changefreq>weekly</changefreq>\n`;
      xmlContent += `    <priority>0.7</priority>\n`;
      xmlContent += '  </url>\n';
    });

    xmlContent += '</urlset>';

    setXml(xmlContent);
  };

  useEffect(() => {
    if (xml) {
      // Set response headers for XML
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      
      // Download the sitemap
      const link = document.createElement('a');
      link.href = url;
      link.download = 'sitemap.xml';
      document.head.appendChild(link);
      
      // Display XML in the page
      document.body.innerHTML = `<pre>${xml}</pre>`;
    }
  }, [xml]);

  return (
    <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', padding: '20px' }}>
      {xml || 'Generating sitemap...'}
    </div>
  );
};

export default Sitemap;
