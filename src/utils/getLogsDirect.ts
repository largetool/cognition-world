/**
 * getUserLogs 的零依赖独立版本
 * 不 import 任何项目模块，只用浏览器原生 API
 * 目的：完全避开 webpack chunk 拆分导致的 TDZ 问题
 */

const SUPABASE_URL = 'https://nbgsichilfrjsopnnvia.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZ3NpY2hpbGZyanNvcG5udmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMTE1MjMsImV4cCI6MjA5NTg4NzUyM30.fWr-ZoDhirVgsKGsL8BWeP36iQ235GuQ4iF_GYK0RH0';

export async function getLogsDirect(
  userId: string,
  currentUserId?: string,
  isAdmin?: boolean
): Promise<any[]> {
  // 从 localStorage 获取 Supabase session token
  let token: string | null = null;
  try {
    const raw = localStorage.getItem('sb-' + SUPABASE_URL.replace('https://', '') + '-auth-token');
    if (raw) {
      const parsed = JSON.parse(raw);
      token = parsed?.access_token || null;
    }
  } catch (_) {
    // 忽略
  }

  const params = new URLSearchParams({
    select: '*',
    user_id: `eq.${userId}`,
    order: 'created_at.desc',
    limit: '100',
  });

  const res = await fetch(`${SUPABASE_URL}/rest/v1/logs?${params.toString()}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    console.error('[getLogsDirect] HTTP', res.status);
    return [];
  }

  const data = await res.json();

  const now = new Date();
  return (Array.isArray(data) ? data : []).map((log: any) => {
    // TIMESTAMP 列存 UTC 但无时区标记，JS 会错当成本地时间，补 'Z' 修正
    const rawCreatedAt = log.created_at || '';
    const ct = typeof rawCreatedAt === 'string' && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}$/.test(rawCreatedAt.trim())
      ? new Date(rawCreatedAt.trim().replace(' ', 'T') + 'Z')
      : new Date(rawCreatedAt);
    const tenMin = new Date(ct.getTime() + 10 * 60 * 1000);
    const isPublic = log.is_public === true || now >= tenMin;
    const canDelete = isAdmin === true || (currentUserId === userId && now < tenMin);
    return { ...log, is_public: isPublic, canDelete };
  });
}
