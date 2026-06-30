/**
 * POST /api/geo/batch-enrich
 *
 * 批量 GEO 富化 — 为尚无 AI 简介的用户生成 Person.description
 * 使用 service_role key 直接写入 profiles.geo_bio / geo_tags / geo_updated_at
 *
 * 认证: X-API-Key 请求头 (与 publish-log 相同的 key)
 *
 * 请求体可选:
 *   limit: number (默认 20, 最大 50) — 本次处理用户数
 *   force: boolean (默认 false) — 是否重新处理已有 geo_bio 的用户
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { generateUserGeoProfile } from '../../../src/utils/agnes';

const SUPABASE_URL = 'https://nbgsichilfrjsopnnvia.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZ3NpY2hpbGZyanNvcG5udmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMTE1MjMsImV4cCI6MjA5NTg4NzUyM30.fWr-ZoDhirVgsKGsL8BWeP36iQ235GuQ4iF_GYK0RH0';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZ3NpY2hpbGZyanNvcG5udmlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDMxMTUyMywiZXhwIjoyMDk1ODg3NTIzfQ.eGTQAFSjT-HI0LAtHrERBN8a2h98VqQMyb1GDPA7g00';
const PUBLISH_API_KEY = process.env.PUBLISH_API_KEY || 'woyaofaburizhi2026';

interface BatchResult {
  success: boolean;
  processed: number;
  errors: number;
  results: Array<{
    displayId: number;
    username: string;
    status: 'ok' | 'skipped' | 'error';
    error?: string;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BatchResult | { error: string }>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

  // 验证 API Key
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey !== PUBLISH_API_KEY) {
    return res.status(401).json({ error: 'API Key 无效' });
  }

  const limit = Math.min(Math.max(Number(req.body?.limit) || 20, 1), 50);
  const force = req.body?.force === true;

  try {
    // 1. 获取待处理用户
    let query = `${SUPABASE_URL}/rest/v1/profiles?select=user_id,display_id,username,tag,slogan,location&is_hidden=eq.false&order=display_id.asc&limit=${limit}`;

    if (!force) {
      query += '&geo_bio=is.null';
    }

    const userRes = await fetch(query, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!userRes.ok) {
      return res.status(500).json({ error: '获取用户列表失败' });
    }

    const users = await userRes.json();
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(200).json({
        success: true,
        processed: 0,
        errors: 0,
        results: [],
      });
    }

    // 2. 为每个用户生成 GEO 画像
    const results: BatchResult['results'] = [];

    for (const user of users) {
      try {
        // 获取日志
        const logsRes = await fetch(
          `${SUPABASE_URL}/rest/v1/logs?select=content&user_id=eq.${user.user_id}&order=created_at.desc&limit=20`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          },
        );

        const logs = logsRes.ok ? await logsRes.json() : [];
        const logContents = (logs || []).map((l: any) => l.content || '').filter(Boolean);

        if (logContents.length === 0) {
          // 没有日志的用户暂时跳过，无法生成有意义的 bio
          results.push({
            displayId: user.display_id,
            username: user.username,
            status: 'skipped',
            error: '无日志内容',
          });
          continue;
        }

        // 调用 Agnes AI
        const geoProfile = await generateUserGeoProfile({
          username: user.username,
          tag: user.tag || '',
          slogan: user.slogan || '',
          location: user.location || '',
          logContents,
        });

        // 写入数据库
        const now = new Date().toISOString();
        const updateRes = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${user.user_id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({
              geo_bio: geoProfile.bio,
              geo_tags: geoProfile.tags,
              geo_updated_at: now,
            }),
          },
        );

        if (!updateRes.ok) {
          throw new Error(`写入失败 HTTP ${updateRes.status}`);
        }

        results.push({
          displayId: user.display_id,
          username: user.username,
          status: 'ok',
        });

        console.log(`[batch-enrich] ✓ ${user.username} (${user.display_id})`);
      } catch (e) {
        results.push({
          displayId: user.display_id,
          username: user.username,
          status: 'error',
          error: (e as Error).message.slice(0, 100),
        });
        console.error(`[batch-enrich] ✗ ${user.username} (${user.display_id}):`, e);
      }
    }

    const processed = results.filter((r) => r.status === 'ok').length;
    const errors = results.filter((r) => r.status === 'error').length;

    return res.status(200).json({
      success: true,
      processed,
      errors,
      results,
    });
  } catch (err) {
    console.error('[batch-enrich] 异常:', err);
    return res.status(500).json({ error: (err as Error).message.slice(0, 200) });
  }
}
