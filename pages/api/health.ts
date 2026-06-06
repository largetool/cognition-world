/**
 * GET /api/health
 *
 * 系统健康检查端点 — 检测所有外部依赖的运行状态
 * 用途：配合外部监控服务（UptimeRobot等）定时 ping，API 出问题自动发告警
 *
 * 返回格式：
 * {
 *   status: "ok" | "degraded" | "error",
 *   checks: { ... },
 *   timestamp: "2026-06-06T..."
 * }
 */

import type { NextApiRequest, NextApiResponse } from 'next';

const AGNES_BASE_URL = 'https://apihub.agnes-ai.com/v1';
const AGNES_KEY =
  process.env.AGNES_API_KEY ||
  'sk-jL3EUaJnpXF04B6C13468Q0RCRuuJjcUvd1qErWECjMdrLHc';

const SUPABASE_URL = 'https://nbgsichilfrjsopnnvia.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZ3NpY2hpbGZyanNvcG5udmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMTE1MjMsImV4cCI6MjA5NTg4NzUyM30.fWr-ZoDhirVgsKGsL8BWeP36iQ235GuQ4iF_GYK0RH0';

const API_BASE = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'https://uptef.com';

interface CheckResult {
  status: 'ok' | 'error' | 'skipped';
  latencyMs?: number;
  error?: string;
}

async function checkAgnes(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${AGNES_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AGNES_KEY}`,
      },
      body: JSON.stringify({
        model: 'agnes-2.0-flash',
        messages: [
          {
            role: 'user',
            content: '请回复"ok"',
          },
        ],
        max_tokens: 10,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        status: 'error',
        latencyMs: Date.now() - start,
        error: `HTTP ${res.status}: ${text.slice(0, 100)}`,
      };
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || '';
    if (!reply.toLowerCase().includes('ok')) {
      return {
        status: 'error',
        latencyMs: Date.now() - start,
        error: `返回内容异常: "${reply.slice(0, 30)}"`,
      };
    }

    return { status: 'ok', latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: 'error',
      latencyMs: Date.now() - start,
      error: (err as Error).message.slice(0, 100),
    };
  }
}

async function checkSupabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=display_id&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!res.ok) {
      return {
        status: 'error',
        latencyMs: Date.now() - start,
        error: `HTTP ${res.status}`,
      };
    }

    return { status: 'ok', latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: 'error',
      latencyMs: Date.now() - start,
      error: (err as Error).message.slice(0, 100),
    };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 外部监控服务用的简单文本响应
  const format = req.query.format as string;

  const [agnes, supabase] = await Promise.all([checkAgnes(), checkSupabase()]);

  const allOk = agnes.status === 'ok' && supabase.status === 'ok';
  const allError = agnes.status === 'error' && supabase.status === 'error';
  const overallStatus = allOk ? 'ok' : allError ? 'error' : 'degraded';

  const body = {
    status: overallStatus,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    checks: {
      supabase,
      agnes_ai: agnes,
    },
  };

  // UptimeRobot / Pingdom 等需要纯文本响应
  if (format === 'text') {
    res.setHeader('Content-Type', 'text/plain');
    res.status(overallStatus === 'ok' ? 200 : 500);
    return res.send(
      `status=${overallStatus}\nsupabase=${supabase.status} ${supabase.latencyMs || '-'}ms\nagnes_ai=${agnes.status} ${agnes.latencyMs || '-'}ms\ntimestamp=${body.timestamp}`,
    );
  }

  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(overallStatus === 'ok' ? 200 : 503).json(body);
}
