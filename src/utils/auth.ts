import { supabase } from '../supabase/client';
import type { Profile } from '../types';

/** 敏感字段列表 — 公开页面不得泄露 */
const SENSITIVE_PROFILE_FIELDS = [
  'email',
  'is_admin',
  'onboarding_completed',
  'account_status',
  'geo_enabled',
  'role',
  'daily_posts_count',
  'last_post_date',
  'slogan_approved',
  'is_frozen',
  'frozen_at',
  'frozen_reason',
  'frozen_by',
  'hide_status',
  'hide_requested_at',
  'cooling_ends_at',
  'frozen_ends_at',
  'hide_canceled_at',
  'restored_at',
] as const;

/** 从 profile 对象中移除敏感字段 */
export function sanitizeProfile(profile: Profile): Profile {
  const sanitized = { ...profile };
  for (const field of SENSITIVE_PROFILE_FIELDS) {
    delete (sanitized as any)[field];
  }
  return sanitized;
}

// 认证状态变更监听器，自动处理清理
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return subscription;
}

// 检查会话是否过期
export function isSessionExpired(session: any): boolean {
  if (!session?.expires_at) return true;
  return Date.now() >= session.expires_at * 1000;
}

export async function getUserById(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return sanitizeProfile(data as Profile);
}

/** 通过 display_id（数字编号）查找用户 */
export async function getUserByDisplayId(displayId: number): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('display_id', displayId)
    .maybeSingle();
  if (error || !data) return null;
  return sanitizeProfile(data as Profile);
}

/** 判断字符串是否为纯数字（displayId） */
export function isNumericDisplayId(value: string): boolean {
  return /^\d+$/.test(value);
}

// 检查邮箱是否已存在（仅检查 profiles 表，避免安全风险）
export async function checkEmailExists(email: string): Promise<boolean> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('检查邮箱存在性失败:', error);
    return false; // 出错时保守返回不存在
  }

  return !!profile;
}

export async function registerWithEmail(email: string, password: string, metadata: {
  username: string;
  user_id: string;
  tag: string;
  slogan: string;
  location: string;
  is_public: boolean;
  phone?: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        ...metadata
      }
    }
  });
  return { user: data?.user, error };
}

export async function loginWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { session: data?.session, user: data?.user, error };
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return { user: null, profile: null, error };
    }
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    return { user, profile, error: profileError };
  } catch (err) {
    console.error('获取当前用户失败:', err);
    return { user: null, profile: null, error: err as Error };
  }
}

/** 获取下一个可用的 display_id（max + 1） */
export async function getNextDisplayId(): Promise<number> {
  const { data } = await supabase
    .from('profiles')
    .select('display_id')
    .order('display_id', { ascending: false })
    .limit(1);
  return (data?.[0]?.display_id ?? 0) + 1;
}

export async function updateProfile(userId: string, updates: {
  tag?: string;
  slogan?: string;
  location?: string;
  is_public?: boolean;
}) {
  try {
    // 过滤掉 undefined 值
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(cleanUpdates).length === 0) {
      return { profile: null, error: new Error('没有要更新的字段') };
    }

    // 如果更新了 slogan，自动将 slogan_approved 设为 false
    if (cleanUpdates.slogan !== undefined) {
      (cleanUpdates as any).slogan_approved = cleanUpdates.slogan ? false : null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .maybeSingle();

    return { profile: data, error };
  } catch (err) {
    console.error('更新资料失败:', err);
    return { profile: null, error: err as Error };
  }
}
