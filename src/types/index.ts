import type { Database } from '../supabase/types';
import type { LocalSystemBackground } from '../data/systemBackgrounds';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Log = Database['public']['Tables']['logs']['Row'] & { canDelete?: boolean };
export type BackgroundImage = Database['public']['Tables']['background_images']['Row'];
export type SystemBackground = Database['public']['Tables']['system_backgrounds']['Row'] | LocalSystemBackground;
export type EditToken = Database['public']['Tables']['edit_tokens']['Row'];
export type IPBlacklist = Database['public']['Tables']['ip_blacklist']['Row'];

export interface UserSession {
  user: Profile | null;
  session: import('@supabase/supabase-js').Session | null;
  isLoading: boolean;
}

export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'profile' | 'article';
  canonicalUrl?: string;
}

/**
 * 判断是否为管理员 - 仅依赖后端返回的 is_admin 字段
 * 前端不做任何硬编码判断，所有权限验证由数据库 RLS 策略控制
 */
export function isAdminFromProfile(profile: Profile | null): boolean {
  if (!profile) return false;
  return profile.is_admin === true;
}

export function generateVirtualEmail(phone: string): string {
  return `${phone.replace(/\D/g, '')}@phone.local`;
}

export function isIPInCIDR(ip: string, cidr: string): boolean {
  const [cidrIP, prefix] = cidr.split('/');
  const prefixLen = parseInt(prefix, 10);

  const ipParts = ip.split('.').map(Number);
  const cidrParts = cidrIP.split('.').map(Number);

  const ipBinary = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
  const cidrBinary = (cidrParts[0] << 24) | (cidrParts[1] << 16) | (cidrParts[2] << 8) | cidrParts[3];

  const mask = -1 << (32 - prefixLen);

  return (ipBinary & mask) === (cidrBinary & mask);
}

/** 统一时区：北京时间 (Asia/Shanghai, UTC+8) */
const TIMEZONE = 'Asia/Shanghai';

/** 解析 Supabase 返回的时间戳：TIMESTAMP 列存 UTC 但无时区标记，JS 会错当成本地时间 */
export function parseSupabaseTime(date: string | Date): Date {
  if (date instanceof Date) return date;
  // 匹配 ISO 8601 无时区标记：2026-06-19T02:00:00 或 2026-06-19 02:00:00
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}$/.test(date.trim())) {
    return new Date(date.trim().replace(' ', 'T') + 'Z');
  }
  return new Date(date);
}

export function formatDate(date: string | Date): string {
  const d = parseSupabaseTime(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: TIMEZONE,
  });
}

export function formatDateTime(date: string | Date): string {
  const d = parseSupabaseTime(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  });
}

export function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function generateEditToken(): string {
  return Array.from({ length: 16 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(Math.floor(Math.random() * 36))
  ).join('');
}

// 根据语言返回不同的 SEO 配置
export function getDefaultSEO(lang: string = 'zh'): SEOData {
  if (lang === 'en') {
    return {
      title: `${APP_CONFIG.nameEn} - Personal GEO Index`,
      description: 'A global personal GEO public information platform that helps AI understand each specific ordinary person.',
      keywords: ['personal GEO', 'personal SEO', 'AI-indexable', 'public identity platform', 'digital entity', 'human-centric', 'personal profile', 'GEO', 'SEO', 'AI search', 'Cognition World', 'generative engine optimization', 'Digital Identity', 'Personal Profile', 'LLM Index', 'Global Directory'],
      ogType: 'website',
      canonicalUrl: APP_CONFIG.url,
    };
  }
  return {
    title: `${APP_CONFIG.name} - ${APP_CONFIG.slogan}`,
    description: APP_CONFIG.description,
    keywords: ['个人GEO', '个人SEO', 'AI可索引', '公开身份平台', '数字实体', '人本位', '个人主页', '黄页', 'AI', '认知', '索引', 'Cognition World', 'GEO', 'Digital Identity', 'Personal Profile', 'AI Search', 'LLM Index', 'Global Directory'],
    ogType: 'website',
    canonicalUrl: APP_CONFIG.url,
  };
}

interface LogForSEO {
  id: string;
  content: string;
  created_at: string | null;
}

export function getUserSEO(profile: Profile, recentLogs?: LogForSEO[], lang: string = 'zh'): SEOData {
  const appName = lang === 'en' ? APP_CONFIG.nameEn : APP_CONFIG.name;
  const profileUrl = `${APP_CONFIG.url}/${profile.user_id}`;

  // 生成个性化 OG 图片 URL（使用 Dicebear 头像）
  const ogImage = `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(profile.username)}&backgroundColor=1a1a2e&textColor=e6e6e6&size=1200`;

  // 构建丰富的关键词
  const baseKeywords = lang === 'en'
    ? [profile.username, profile.tag, profile.user_id, 'personal profile', 'GEO Profile', 'Digital Identity', 'AI Searchable', 'Cognition World', 'Personal Brand']
    : [profile.username, profile.tag, profile.user_id, '个人主页', 'GEO Profile', 'Digital Identity', 'AI Searchable', '认知界', '个人品牌', '数字身份'];

  // 从日志内容提取额外关键词（前3条日志的前20个字符）
  const logKeywords = recentLogs?.slice(0, 3).map(log => log.content.slice(0, 20)).filter(Boolean) || [];
  const allKeywords = [...baseKeywords, ...logKeywords];

  // 构建个性化描述
  const description = profile.slogan || `${profile.tag} | ${appName}`;

  if (lang === 'en') {
    return {
      title: `${profile.username} - ${appName}`,
      description,
      keywords: allKeywords,
      ogType: 'profile',
      ogImage,
      canonicalUrl: profileUrl,
    };
  }
  return {
    title: `${profile.username} - ${appName}`,
    description,
    keywords: allKeywords,
    ogType: 'profile',
    ogImage,
    canonicalUrl: profileUrl,
  };
}

export const APP_CONFIG = {
  name: '认知界',
  nameEn: 'Cognition World',
  subTitle: '全民 GEO 公开信息平台',
  slogan: '让AI认识每一个具体的普通人',
  description: '一个面向全球用户的公开信息平台，提供不可删除、不可篡改、可索引的个人 GEO 信誉记录，让搜索引擎与 LLM 能够理解每个用户。',
  version: '1.0.0-beta',
  geoAnchor: 'Beijing, CN',
  timeAnchor: '2026.06.01',
  url: 'https://uptef.com',
};

/** 将 display_id 格式化为 9 位定长显示 ID */
export function fmtDisplayId(id: number | null): string {
  return String(id ?? 0).padStart(9, '0');
}

/** 生成用户公开主页路径（e.g. /000000000） */
export function userPath(id: number | null): string {
  return `/${fmtDisplayId(id)}`;
}

/** 生成用户公开主页完整 URL（e.g. https://uptef.com/000000000） */
export function userProfileWebUrl(id: number | null): string {
  return `${APP_CONFIG.url}/${fmtDisplayId(id)}`;
}

export const DEFAULT_BLACKLIST: string[] = [];
