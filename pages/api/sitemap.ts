import type { NextApiRequest, NextApiResponse } from 'next';

const STATIC_PAGES = [
  { loc: 'https://uptef.com/', changefreq: 'daily', priority: '1.0' },
  { loc: 'https://uptef.com/whitepaper', changefreq: 'weekly', priority: '0.8' },
  { loc: 'https://uptef.com/terms', changefreq: 'monthly', priority: '0.4' },
  { loc: 'https://uptef.com/privacy', changefreq: 'monthly', priority: '0.4' },
  { loc: 'https://uptef.com/about', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://uptef.com/guestbook', changefreq: 'daily', priority: '0.5' },
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
      // 获取公开用户
      const profileRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?select=display_id&is_public=eq.true&is_hidden=eq.false&order=created_at.desc&limit=500`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (profileRes.ok) {
        const profiles = await profileRes.json();
        const validProfiles: any[] = Array.isArray(profiles) ? profiles : [];

        // 每个用户的个人主页
        userUrls = validProfiles.map(
          (p: any) => `https://uptef.com/${String(p.display_id ?? 0).padStart(9, '0')}`
        );

        // 每个用户的最近动态（每个用户取最近 10 条）
        try {
          const logRes = await fetch(
            `${SUPABASE_URL}/rest/v1/logs?select=id,user_id&order=created_at.desc&limit=500`,
            {
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              },
            }
          );

          if (logRes.ok) {
            const logs = await logRes.json();
            if (Array.isArray(logs)) {
              // 获取 display_id 映射
              const userIdToDisplayId = new Map<string, string>();
              validProfiles.forEach((p: any) => {
                userIdToDisplayId.set(p.user_id, String(p.display_id ?? 0).padStart(9, '0'));
              });

              const thoughtUrls = logs
                .filter((log: any) => userIdToDisplayId.has(log.user_id))
                .map((log: any) => {
                  const displayId = userIdToDisplayId.get(log.user_id);
                  return `https://uptef.com/${displayId}/thought/${log.id}`;
                });

              userUrls.push(...thoughtUrls);
            }
          }
        } catch {
          // 日志获取失败不影响用户页面
        }
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
