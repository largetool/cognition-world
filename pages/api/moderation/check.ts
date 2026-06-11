// ============================================
// POST /api/moderation/check
// 调用阿里云 AI 安全护栏审核用户发布的内容
// ============================================

import type { NextApiRequest, NextApiResponse } from 'next';
import { checkTextModeration } from '../../../src/utils/aliyunModeration';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

  const { content } = req.body;
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: '缺少 content 参数' });
  }

  if (content.length > 2000) {
    return res.status(400).json({ error: '内容超过 2000 字限制' });
  }

  try {
    const result = await checkTextModeration(content);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[审核] API 调用失败:', error);
    return res.status(500).json({
      passed: false,
      suggestion: 'error',
      label: 'api_error',
      description: error.message || '审核服务异常',
      detail: [],
    });
  }
}
