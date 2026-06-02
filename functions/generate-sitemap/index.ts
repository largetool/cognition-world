import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BASE_URL = 'https://cognitionworld.com';

// 生成站点地图XML
async function generateSitemapXml(): Promise<string> {
  // 获取所有动态
  const { data: logs, error } = await supabase
    .from('logs')
    .select('user_id, id, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching logs:', error);
    throw error;
  }

  let urls = `
  <!-- 首页 -->
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

  // 添加动态URL
  (logs || []).forEach((log: { user_id: string; id: string; created_at: string }) => {
    urls += `
  <url>
    <loc>${BASE_URL}/${log.user_id}/thought/${log.id}</loc>
    <lastmod>${new Date(log.created_at).toISOString()}</lastmod>
    <changefreq>never</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
}

// 保存站点地图到存储桶
async function saveSitemap(content: string): Promise<void> {
  const { error } = await supabase.storage
    .from('public')
    .upload('sitemap.xml', new Blob([content], { type: 'application/xml' }), {
      upsert: true,
    });

  if (error) {
    console.error('Error saving sitemap:', error);
    throw error;
  }
}

// 检查是否为动态模式
async function isDynamicMode(): Promise<boolean> {
  const { data, error } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', 'sitemap_mode')
    .single();

  if (error || !data) return false;
  return data.value === 'dynamic';
}

Deno.serve(async (req) => {
  // 处理 CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // 检查是否为动态模式
    const dynamicMode = await isDynamicMode();
    if (!dynamicMode) {
      return new Response(
        JSON.stringify({ success: false, message: '当前为静态模式，不自动生成' }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 生成站点地图
    const sitemapContent = await generateSitemapXml();
    
    // 保存到存储桶
    await saveSitemap(sitemapContent);

    return new Response(
      JSON.stringify({ success: true, message: '站点地图已更新' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
