// ============================================
// POST /api/publish-log
// OpenClaw Skill 调用：从微信/Telegram 等渠道远程发布日志
// 认证方式：X-API-Key 请求头
// ============================================

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import type { Log } from '../../src/types';

const SUPABASE_URL = 'https://nbgsichilfrjsopnnvia.supabase.co';

interface PublishRequest {
  content: string;
  tags?: string[];
  category?: 'experience' | 'present' | 'future';
  location?: string;
}

interface PublishResponse {
  success: boolean;
  log?: Log;
  error?: string;
  message?: string;
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

  try {
    // 使用 service_role key 创建管理端客户端（绕过 RLS）
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return res.status(500).json({
        success: false,
        error: '服务器未配置 SUPABASE_SERVICE_ROLE_KEY',
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 与 createLog() 一致的逻辑
    const publishedAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('logs')
      .insert({
        user_id: adminUserId,
        content: content.trim(),
        is_public: false,
        published_at: publishedAt,
        tags: tags || [],
        ...(category ? { category } : {}),
        ...(location && location.trim() ? { location: location.trim() } : {}),
      })
      .select()
      .single();

    if (error) {
      console.error('[publish-log] 插入失败:', error);
      return res.status(500).json({
        success: false,
        error: `发布失败：${error.message}`,
      });
    }

    return res.status(200).json({
      success: true,
      log: data as Log,
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
