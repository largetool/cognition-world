// ============================================
// POST /api/publish-log
// OpenClaw Skill 调用：从微信/Telegram 等渠道远程发布日志
// 认证方式：X-API-Key 请求头
// ============================================

import type { NextApiRequest, NextApiResponse } from 'next';

const SUPABASE_URL = 'https://nbgsichilfrjsopnnvia.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZ3NpY2hpbGZyanNvcG5udmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMTE1MjMsImV4cCI6MjA5NTg4NzUyM30.fWr-ZoDhirVgsKGsL8BWeP36iQ235GuQ4iF_GYK0RH0';

interface PublishRequest {
  content: string;
  tags?: string[];
  category?: 'experience' | 'present' | 'future';
  location?: string;
}

interface PublishResponse {
  success: boolean;
  log?: any;
  error?: string;
  message?: string;
  debug?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublishResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: '仅支持 POST 请求' });
  }

  // 验证 API Key
  const apiKey = req.headers['x-api-key'] as string;
  const expectedKey = process.env.PUBLISH_API_KEY;
  if (!expectedKey) {
    return res.status(500).json({
      success: false,
      error: '服务器未配置 PUBLISH_API_KEY',
    });
  }
  if (apiKey !== expectedKey) {
    return res.status(401).json({ success: false, error: 'API Key 无效' });
  }

  const { content, tags, category, location } = req.body as PublishRequest;

  // 验证必填字段
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ success: false, error: '缺少 content 参数' });
  }
  if (content.length > 5000) {
    return res.status(400).json({ success: false, error: '内容超过 5000 字限制' });
  }

  // 读取 user_id（管理员的 user_id）
  const adminUserId = process.env.ADMIN_USER_ID;
  if (!adminUserId) {
    return res.status(500).json({
      success: false,
      error: '服务器未配置 ADMIN_USER_ID',
    });
  }

  // 获取 service_role key（绕过 RLS）
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return res.status(500).json({
      success: false,
      error: '服务器未配置 SUPABASE_SERVICE_ROLE_KEY',
    });
  }

  try {
    const publishedAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // 用原生 fetch 调 Supabase REST API，绕过 supabase-js 可能的问题
    const body: Record<string, any> = {
      user_id: adminUserId,
      content: content.trim(),
      is_public: false,
      published_at: publishedAt,
      tags: tags || [],
    };
    if (category) body.category = category;
    if (location?.trim()) body.location = location.trim();

    const response = await fetch(`${SUPABASE_URL}/rest/v1/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[publish-log] Supabase 返回错误:', response.status, errorText);
      return res.status(500).json({
        success: false,
        error: `发布失败：${errorText}`,
        debug: `HTTP ${response.status}`,
      });
    }

    const data = await response.json();
    const log = Array.isArray(data) ? data[0] : data;

    return res.status(200).json({
      success: true,
      log,
      message: '日志发布成功',
    });
  } catch (err) {
    console.error('[publish-log] 异常:', err);
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : '服务器内部错误',
    });
  }
}
