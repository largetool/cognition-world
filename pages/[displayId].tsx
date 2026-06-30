import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { supabase } from '../src/supabase/client';
import AppRoutes from '../src/App';
import { APP_CONFIG } from '../src/types';
import {
  generateProfilePageSchema,
  generateBlogPostingSchema,
  generateBreadcrumbList,
} from '../src/utils/seo';
import { generateUserBio } from '../src/utils/agnes';
import type { Profile } from '../src/types';

/** 统一小写域名 */
const BASE_URL = 'https://uptef.com';

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

function sanitizeProfile(profile: Profile): Profile {
  const sanitized = { ...profile };
  for (const field of SENSITIVE_PROFILE_FIELDS) {
    delete (sanitized as any)[field];
  }
  return sanitized;
}

function padId(id: number | null): string {
  return String(id ?? 0).padStart(9, '0');
}

function userUrl(id: number | null): string {
  return `${BASE_URL}/${padId(id)}`;
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  // 统一使用北京时间
  const parts = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Shanghai',
    hour12: false,
  }).formatToParts(d);
  const vals: Record<string, string> = {};
  parts.forEach(p => { vals[p.type] = p.value; });
  return `${vals.year}/${vals.month}/${vals.day} ${vals.hour}:${vals.minute}`;
}

/** 判断是否为爬虫/AI 索引机器人 */
function isCrawler(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  const botPattern = /bot|crawler|spider|googlebot|bingbot|slurp|baiduspider|yandexbot|duckduckbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|chatgpt|claude|anthropic|perplexity/i;
  return botPattern.test(userAgent);
}

export default function UserSSRPage({
  ssrUserId,
  ssrProfile,
  ssrLogs,
  ssrJsonLd,
  ssrMetaDescription,
  ssrOgTitle,
  ssrOgDescription,
  ssrOgImage,
  ssrCanonicalUrl,
  ssrNotFound,
  ssrGeoBio,
  ssrKeywords,
  ssrIsCrawler,
}: SSRProps) {
  if (ssrNotFound || !ssrProfile) {
    return (
      <>
        <Head>
          <meta name="robots" content="noindex, follow" />
        </Head>
        <AppRoutes />
      </>
    );
  }

  const pUrl = userUrl(ssrProfile.display_id);
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(ssrProfile.username)}&backgroundColor=1a1a2e&textColor=e6e6e6`;
  const bgImage = ssrProfile.background_image || '';
  const joinYear = ssrProfile.created_at
    ? new Date(ssrProfile.created_at).getFullYear()
    : '';
  const displayIdStr = padId(ssrProfile.display_id);

  return (
    <>
      {ssrJsonLd && (
        <Head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ssrJsonLd) }}
          />
        </Head>
      )}
      <Head>
        <title>{ssrOgTitle || `${ssrProfile.username} - ${APP_CONFIG.name}`}</title>
        <meta name="description" content={ssrMetaDescription || ''} />

        {/* Open Graph */}
        <meta property="og:title" content={ssrOgTitle || `${ssrProfile.username} - ${APP_CONFIG.name}`} />
        <meta property="og:description" content={ssrOgDescription || ''} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={pUrl} />
        <meta property="og:image" content={ssrOgImage || avatarUrl} />
        <meta property="og:site_name" content="认知界 Cognition World" />
        <meta property="og:locale" content="zh_CN" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ssrOgTitle || `${ssrProfile.username} - ${APP_CONFIG.name}`} />
        <meta name="twitter:description" content={ssrOgDescription || ''} />

        {/* SEO essentials */}
        <meta name="keywords" content={ssrKeywords || ''} />
        <link rel="canonical" href={pUrl} />
        <meta name="robots" content="index, follow, max-image-preview:large" />

        {/* hreflang */}
        <link rel="alternate" hrefLang="zh-CN" href={pUrl} />
        <link rel="alternate" hrefLang="en" href={`${BASE_URL}/en/${displayIdStr}`} />
        <link rel="alternate" hrefLang="x-default" href={pUrl} />
      </Head>

      {/* 爬虫/机器人：渲染可读的 HTML 内容供索引 */}
      {/* 人类用户：不渲染，只由下文的 AppRoutes 提供交互界面 */}
      {ssrIsCrawler && (
        <main
          id="ssr-content"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            maxWidth: '720px',
            margin: '0 auto',
            padding: '32px 16px',
            color: '#e6e6e6',
            background: '#0d0d1a',
            lineHeight: 1.7,
          }}
        >
          {/* 导航 */}
          <nav style={{ marginBottom: 24, fontSize: 14 }}>
            <a
              href={BASE_URL}
              style={{ color: '#a0a0b8', textDecoration: 'none' }}
            >
              ← 认知界首页
            </a>
          </nav>

          {/* 用户信息卡片 */}
          <header
            style={{
              background: bgImage
                ? `linear-gradient(180deg, rgba(13,13,26,0.3) 0%, rgba(13,13,26,0.95) 80%), url(${bgImage}) center top / cover no-repeat`
                : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              borderRadius: 16,
              padding: '40px 24px',
              marginBottom: 32,
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* 头像 */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 16,
                background: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
              }}
            >
              {ssrProfile.username.charAt(0).toUpperCase()}
            </div>

            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#fff',
                margin: '0 0 8px 0',
              }}
            >
              {ssrProfile.username}
            </h1>

            {ssrProfile.tag && (
              <p style={{ fontSize: 16, color: '#a0a0b8', margin: '0 0 8px 0' }}>
                {ssrProfile.tag}
              </p>
            )}

            <div
              style={{
                display: 'inline-block',
                fontSize: 12,
                fontFamily: 'monospace',
                color: '#6b7280',
                background: 'rgba(255,255,255,0.06)',
                padding: '2px 10px',
                borderRadius: 20,
                marginBottom: 16,
              }}
            >
              ID {displayIdStr}
            </div>

            {(ssrGeoBio || ssrProfile.slogan) && (
              <p
                style={{
                  fontSize: 16,
                  color: '#d1d5db',
                  maxWidth: 560,
                  margin: '0 0 16px 0',
                }}
              >
                {ssrGeoBio || ssrProfile.slogan}
              </p>
            )}
            {ssrGeoBio && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  color: '#4f46e5',
                  background: 'rgba(79,70,229,0.1)',
                  padding: '2px 8px',
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                ✨ AI 生成
              </div>
            )}

            <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#9ca3af' }}>
              {ssrProfile.location && (
                <span>📍 {ssrProfile.location}</span>
              )}
              {joinYear && (
                <span>🕐 加入于 {joinYear}</span>
              )}
            </div>
          </header>

          {/* 日志列表 */}
          <section>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: '#fff',
                margin: '0 0 16px 0',
                paddingBottom: 8,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              认知日志
            </h2>

            {ssrLogs && ssrLogs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ssrLogs.slice(0, 20).map((log: any, i: number) => (
                  <article
                    key={log.id || i}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 12,
                      padding: '16px 20px',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <p
                      style={{
                        fontSize: 15,
                        color: '#e6e6e6',
                        margin: '0 0 10px 0',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {log.content || ''}
                    </p>
                    {log.tags && log.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                        {log.tags.map((tag: string, ti: number) => (
                          <span
                            key={ti}
                            style={{
                              fontSize: 11,
                              color: '#818cf8',
                              background: 'rgba(79,70,229,0.12)',
                              padding: '2px 8px',
                              borderRadius: 6,
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <time
                        dateTime={log.created_at || log.published_at || ''}
                        style={{ fontSize: 12, color: '#6b7280' }}
                      >
                        {fmtDate(log.published_at || log.created_at)}
                      </time>
                      {log.id && (
                        <a
                          href={`${pUrl}/thought/${log.id}`}
                          style={{ fontSize: 12, color: '#818cf8', textDecoration: 'none' }}
                        >
                          查看详情
                        </a>
                      )}
                    </footer>
                  </article>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280', fontSize: 14 }}>
                暂无公开日志
              </p>
            )}
          </section>

          {/* 底部 CTA */}
          <div
            style={{
              marginTop: 32,
              textAlign: 'center',
              padding: '24px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(79,70,229,0.15) 0%, rgba(79,70,229,0.05) 100%)',
              border: '1px solid rgba(79,70,229,0.2)',
            }}
          >
            <p style={{ color: '#e6e6e6', fontSize: 15, margin: '0 0 12px 0' }}>
              快速创建个人页面，让 AI 和搜索引擎带你连接全球
            </p>
            <a
              href={`${BASE_URL}/register`}
              style={{
                display: 'inline-block',
                padding: '10px 28px',
                background: '#4f46e5',
                color: '#fff',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              立即注册
            </a>
          </div>
        </main>
      )}

      {/* 客户端 React 应用（对所有用户渲染，JS 启用后接管交互） */}
      <AppRoutes />
    </>
  );
}

interface SSRProps {
  ssrUserId?: string;
  ssrProfile?: Profile | null;
  ssrLogs?: any[];
  ssrActiveBg?: { url: string } | null;
  ssrNotFound?: boolean;
  ssrJsonLd?: object;
  ssrMetaDescription?: string;
  ssrOgTitle?: string;
  ssrOgDescription?: string;
  ssrOgImage?: string;
  ssrCanonicalUrl?: string;
  ssrGeoBio?: string;
  ssrKeywords?: string;
  ssrIsCrawler?: boolean;
}

function generateKeywords(profile: Profile, logs: any[]): string {
  const keywords: string[] = [];
  if (profile.username) keywords.push(profile.username);
  if (profile.tag) keywords.push(profile.tag);
  if (profile.location) keywords.push(profile.location);
  // 从日志标签提取关键词
  const tagSet = new Set<string>();
  logs.slice(0, 10).forEach(l => {
    if (Array.isArray(l.tags)) l.tags.forEach((t: string) => tagSet.add(t));
  });
  tagSet.forEach(t => keywords.push(t));
  // 从日志内容提取关键词
  if (logs.length > 0) {
    logs.slice(0, 3).forEach(l => {
      const word = (l.content || '').slice(0, 20).trim();
      if (word) keywords.push(word);
    });
  }
  // 固定 GEO/SEO 关键词
  keywords.push('个人主页', '个人GEO', '个人SEO', '数字身份', 'AI可索引', '认知界', '公开日志');
  return keywords.join(',');
}

function generateMetaDescription(profile: Profile, logs: any[]): string {
  const parts: string[] = [];
  if (profile.tag) parts.push(profile.tag);
  if (profile.slogan) parts.push(profile.slogan.slice(0, 80));
  if (logs.length > 0) {
    const topics = logs.slice(0, 3).map(l => (l.content || '').slice(0, 30)).join('、');
    parts.push(`近期话题：${topics}`);
  }
  return parts.join('。') || `${profile.username}在${APP_CONFIG.name}的个人公开主页`;
}

function generateUserJsonLd(profile: Profile, logs: any[], aiDescription?: string): object {
  const pUrl = userUrl(profile.display_id);
  const profilePage = generateProfilePageSchema(profile, aiDescription);

  const blogPostings = logs.slice(0, 10).map((log) => {
    const posting: any = generateBlogPostingSchema(
      { content: log.content || '', created_at: log.created_at || log.published_at || '', tags: log.tags || [] },
      profile,
    );
    posting['@id'] = `${pUrl}/thought/${log.id}`;
    posting.url = `${pUrl}/thought/${log.id}`;
    posting.isPartOf = { '@type': 'ProfilePage', '@id': pUrl };
    return posting;
  });

  const breadcrumb = generateBreadcrumbList([
    { name: '认知界', url: BASE_URL },
    { name: profile.username, url: pUrl },
  ]);

  return { '@context': 'https://schema.org', '@graph': [profilePage, breadcrumb, ...blogPostings] };
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const param = context.params?.displayId as string;

  if (!param || param.length > 20) {
    return { notFound: true };
  }

  try {
    const displayId = parseInt(param, 10);
    let profile: Profile | null = null;

    if (!isNaN(displayId)) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('display_id', displayId)
        .maybeSingle();
      profile = data as Profile | null;
    }

    if (!profile) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', param)
        .maybeSingle();
      if (data) {
        return {
          redirect: {
            destination: `/${String(data.display_id).padStart(9, '0')}`,
            permanent: true,
          },
        };
      }
      return { props: { ssrNotFound: true } };
    }

    if (!profile) {
      return { props: { ssrNotFound: true } };
    }

    const typedProfile = sanitizeProfile(profile as Profile);

    if (typedProfile.is_hidden) {
      return { props: { ssrNotFound: true } };
    }

    const { data: logs } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', typedProfile.user_id)
      .order('created_at', { ascending: false })
      .limit(100);

    const ssrLogs = (logs || []).map((log: any) => ({ ...log, canDelete: false }));
    const pUrl = userUrl(typedProfile.display_id);

    // Agnes AI: 生成用户的 GEO 简介（Person.description）
    // 优先使用数据库中已有的 geo_bio（由每日批量富化任务预生成）
    let geoBio: string | undefined;
    if ((typedProfile as any).geo_bio) {
      geoBio = (typedProfile as any).geo_bio;
      console.log(`[SSR] 使用预生成 geo_bio: ${typedProfile.username}`);
    } else {
      const logContents = (logs || []).map((l: any) => l.content || '').filter(Boolean);
      if (logContents.length > 0) {
        try {
          geoBio = await generateUserBio({
            username: typedProfile.username,
            tag: typedProfile.tag || '',
            slogan: typedProfile.slogan || '',
            location: typedProfile.location || '',
            logContents,
          });
        } catch (e) {
          console.warn('[Agnes] 生成简介失败，使用 slogan 降级:', (e as Error).message);
        }
      }
    }

    const ssrJsonLd = generateUserJsonLd(typedProfile, ssrLogs, geoBio);
    const ssrMetaDescription = geoBio || generateMetaDescription(typedProfile, ssrLogs);
    const ssrKeywords = generateKeywords(typedProfile, ssrLogs);

    // 检测是否为爬虫
    const userAgent = context.req?.headers['user-agent'];
    const ssrIsCrawler = isCrawler(userAgent);

    return {
      props: {
        ssrUserId: typedProfile.user_id,
        ssrProfile: typedProfile,
        ssrActiveBg: typedProfile.background_image
          ? { url: typedProfile.background_image }
          : null,
        ssrLogs,
        ssrJsonLd,
        ssrMetaDescription,
        ssrGeoBio: geoBio || '',
        ssrKeywords,
        ssrOgTitle: `${typedProfile.username} - ${APP_CONFIG.name}`,
        ssrOgDescription: geoBio || ssrMetaDescription,
        ssrOgImage: typedProfile.background_image || '',
        ssrCanonicalUrl: pUrl,
        ssrIsCrawler,
      },
    };
  } catch (err) {
    console.error('[getServerSideProps] 获取用户数据失败:', err);
    return { props: { ssrNotFound: true } };
  }
};
