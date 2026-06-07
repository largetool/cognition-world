import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { supabase } from '../../../src/supabase/client';
import AppRoutes from '../../../src/App';
import { APP_CONFIG } from '../../../src/types';
import type { Profile } from '../../../src/types';

const BASE_URL = 'https://uptef.com';

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

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const parts = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Shanghai', hour12: false,
  }).formatToParts(d);
  const vals: Record<string, string> = {};
  parts.forEach(p => { vals[p.type] = p.value; });
  return `${vals.year}/${vals.month}/${vals.day} ${vals.hour}:${vals.minute}`;
}

export default function ThoughtSSRPage({
  ssrProfile,
  ssrThought,
  ssrJsonLd,
  ssrMetaDescription,
}: any) {
  if (!ssrProfile || !ssrThought) {
    return (
      <>
        <Head>
          <meta name="robots" content="noindex, follow" />
        </Head>
        <AppRoutes />
      </>
    );
  }

  const profileUrl = `${BASE_URL}/${padId(ssrProfile.display_id)}`;
  const thoughtUrl = ssrJsonLd?.url || '';
  const headline = ssrThought.content?.slice(0, 60) || '';
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
        <title>{headline} - {ssrProfile.username} - {APP_CONFIG.name}</title>
        <meta name="description" content={ssrMetaDescription || ssrThought.content?.slice(0, 160) || ''} />

        <meta property="og:title" content={`${ssrProfile.username}：「${headline}」`} />
        <meta property="og:description" content={ssrThought.content?.slice(0, 200) || ''} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={thoughtUrl} />
        <meta property="og:site_name" content="认知界 Cognition World" />
        <meta property="og:locale" content="zh_CN" />
        <meta property="article:author" content={ssrProfile.username} />
        <meta property="article:published_time" content={ssrThought.created_at || ssrThought.published_at || ''} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${ssrProfile.username}：「${headline}」`} />
        <meta name="twitter:description" content={ssrThought.content?.slice(0, 200) || ''} />

        <link rel="canonical" href={thoughtUrl} />
        <meta name="robots" content="index, follow, max-image-preview:large" />

        {/* hreflang */}
        <link rel="alternate" hrefLang="zh-CN" href={thoughtUrl} />
        <link rel="alternate" hrefLang="en" href={`${BASE_URL}/en/${displayIdStr}/thought/${ssrThought.id}`} />
        <link rel="alternate" hrefLang="x-default" href={thoughtUrl} />

        {/* 作者链接 */}
        <link rel="author" href={profileUrl} />
      </Head>

      {/* P0: SSR 页面内容 */}
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
        <nav style={{ marginBottom: 24, fontSize: 14 }}>
          <a href={BASE_URL} style={{ color: '#a0a0b8', textDecoration: 'none' }}>
            ← 认知界首页
          </a>
          {' · '}
          <a href={profileUrl} style={{ color: '#a0a0b8', textDecoration: 'none' }}>
            {ssrProfile.username}的主页
          </a>
        </nav>

        <article>
          <header style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {ssrProfile.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <a
                  href={profileUrl}
                  style={{ fontSize: 15, fontWeight: 600, color: '#fff', textDecoration: 'none' }}
                >
                  {ssrProfile.username}
                </a>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {fmtDate(ssrThought.created_at || ssrThought.published_at)}
                </div>
              </div>
            </div>
          </header>

          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 12,
              padding: '24px 20px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p
              style={{
                fontSize: 17,
                color: '#e6e6e6',
                margin: 0,
                whiteSpace: 'pre-wrap',
                lineHeight: 1.8,
              }}
            >
              {ssrThought.content || ''}
            </p>
          </div>
        </article>

        <div style={{ marginTop: 32, textAlign: 'center' }}>
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
            创建你的个人页面
          </a>
        </div>
      </main>

      <AppRoutes />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { displayId, thoughtId } = context.params as { displayId: string; thoughtId: string };

  try {
    const displayIdNum = parseInt(displayId, 10);
    if (isNaN(displayIdNum)) return { props: { ssrNotFound: true } };

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('display_id', displayIdNum)
      .maybeSingle();

    if (!profile) return { props: { ssrNotFound: true } };

    const { data: log } = await supabase
      .from('logs')
      .select('*')
      .eq('id', thoughtId)
      .eq('user_id', profile.user_id)
      .single();

    if (!log) return { props: { ssrNotFound: true } };

    const sanitizedProfile = sanitizeProfile(profile as Profile);
    const pUrl = `${BASE_URL}/${padId(profile.display_id)}/thought/${thoughtId}`;
    const ssrJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'SocialMediaPosting',
      '@id': pUrl,
      headline: log.content.slice(0, 60),
      articleBody: log.content,
      datePublished: log.created_at,
      author: {
        '@type': 'Person',
        name: profile.username,
        url: `${BASE_URL}/${padId(profile.display_id)}`,
      },
      url: pUrl,
      isPartOf: {
        '@type': 'ProfilePage',
        url: `${BASE_URL}/${padId(profile.display_id)}`,
      },
    };
    if (log.tags && log.tags.length > 0) {
      ssrJsonLd.about = log.tags.map(tag => ({ '@type': 'Thing', name: tag }));
    }

    return {
      props: {
        ssrProfile: sanitizedProfile,
        ssrThought: log,
        ssrJsonLd,
        ssrMetaDescription: `${profile.username} 的认知日志：${log.content.slice(0, 160)}`,
      },
    };
  } catch (err) {
    console.error('[getServerSideProps thought] 获取失败:', err);
    return { props: { ssrNotFound: true } };
  }
};
