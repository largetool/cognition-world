import type { NextApiRequest, NextApiResponse } from 'next';

const STATIC_PAGES = [
  { loc: 'https://uptef.com/', changefreq: 'daily', priority: '1.0' },
  { loc: 'https://uptef.com/login', changefreq: 'monthly', priority: '0.3' },
  { loc: 'https://uptef.com/register', changefreq: 'monthly', priority: '0.3' },
  { loc: 'https://uptef.com/whitepaper', changefreq: 'weekly', priority: '0.8' },
  { loc: 'https://uptef.com/terms', changefreq: 'monthly', priority: '0.3' },
  { loc: 'https://uptef.com/privacy', changefreq: 'monthly', priority: '0.3' },
  { loc: 'https://uptef.com/about', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://uptef.com/contact', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://uptef.com/guestbook', changefreq: 'daily', priority: '0.5' },
  { loc: 'https://uptef.com/example/000000001', changefreq: 'monthly', priority: '0.6' },
];

function generateSitemapXml(userUrls: string[]): string {
  const staticEntries = STATIC_PAGES.map(
    (p) => `  <url>
    <loc>${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  ).join('\n');

  const userEntries = userUrls
    .map(
      (loc) => `  <url>
    <loc>${loc}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${userEntries}
</urlset>`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const SUPABASE_URL = 'https://nbgsichilfrjsopnnvia.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZ3NpY2hpbGZyanNvcG5udmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMTE1MjMsImV4cCI6MjA5NTg4NzUyM30.fWr-ZoDhirVgsKGsL8BWeP36iQ235GuQ4iF_GYK0RH0';

    let userUrls: string[] = [];

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?select=display_id&is_public=eq.true&is_hidden=eq.false&order=created_at.desc&limit=500`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (response.ok) {
        const profiles = await response.json();
        userUrls = (Array.isArray(profiles) ? profiles : []).map(
          (p: any) => `https://uptef.com/${String(p.display_id ?? 0).padStart(9, '0')}`
        );
      }
    } catch {
      // Fallback: 使用空用户列表
    }

    const xml = generateSitemapXml(userUrls);

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.status(200).send(xml);
  } catch {
    const xml = generateSitemapXml([]);
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(xml);
  }
}
