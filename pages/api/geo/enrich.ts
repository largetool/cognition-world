/**
 * GET /api/geo/enrich?displayId=0
 *
 * 为指定用户生成 AI 增强的 GEO 画像（bio + tags + meta description）
 * 用于手动触发或定时批量处理
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { generateUserGeoProfile } from '../../../src/utils/agnes';

const SUPABASE_URL = 'https://nbgsichilfrjsopnnvia.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZ3NpY2hpbGZyanNvcG5udmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMTE1MjMsImV4cCI6MjA5NTg4NzUyM30.fWr-ZoDhirVgsKGsL8BWeP36iQ235GuQ4iF_GYK0RH0';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '仅支持 GET 请求' });
  }

  const displayId = parseInt(req.query.displayId as string, 10);
  if (isNaN(displayId)) {
    return res.status(400).json({ error: '缺少 displayId 参数' });
  }

  try {
    // 获取用户资料
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=*&display_id=eq.${displayId}&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      },
    );

    if (!profileRes.ok) {
      return res.status(404).json({ error: '用户未找到' });
    }

    const profiles = await profileRes.json();
    const profile = profiles?.[0];
    if (!profile) {
      return res.status(404).json({ error: '用户未找到' });
    }

    // 获取日志
    const logsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/logs?select=content&user_id=eq.${profile.user_id}&order=created_at.desc&limit=20`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      },
    );

    const logs = logsRes.ok ? await logsRes.json() : [];
    const logContents = (logs || []).map((l: any) => l.content || '').filter(Boolean);

    // 调用 Agnes AI 生成 GEO 画像
    const result = await generateUserGeoProfile({
      username: profile.username,
      tag: profile.tag || '',
      slogan: profile.slogan || '',
      location: profile.location || '',
      logContents,
    });

    console.log(`[geo/enrich] 已生成 ${profile.username} (${displayId}) 的 GEO 画像`);

    return res.status(200).json({
      displayId,
      ...result,
    });
  } catch (err) {
    console.error('[geo/enrich] 错误:', err);
    return res.status(500).json({
      error: '生成失败',
      detail: (err as Error).message.slice(0, 200),
    });
  }
}
