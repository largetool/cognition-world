import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { supabase } from '../../src/supabase/client';
import AppRoutes from '../../src/App';
import { APP_CONFIG } from '../../src/types';
import {
  generateProfilePageSchema,
  generateBlogPostingSchema,
  generateBreadcrumbList,
} from '../../src/utils/seo';
import { generateUserBio } from '../../src/utils/agnes';
import type { Profile } from '../../src/types';

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
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${day} ${h}:${min}`;
}

export default function ExampleSSRPage({
  ssrProfile,
  ssrLogs,
  ssrJsonLd,
  ssrMetaDescription,
  ssrNotFound,
}: any) {
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

  const pUrl = `${BASE_URL}/example/${padId(ssrProfile.display_id)}`;
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
        <title>{ssrProfile.username} - {APP_CONFIG.name}（示例）</title>
        <meta name="description" content={ssrMetaDescription || ''} />
        <meta property="og:title" content={`${ssrProfile.username} - ${APP_CONFIG.name}`} />
        <meta property="og:description" content={ssrMetaDescription || ''} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={pUrl} />
        <meta property="og:site_name" content="认知界 Cognition World" />
        <meta property="og:locale" content="zh_CN" />

        <meta name="twitter:card" content="summary_large_image" />

        <link rel="canonical" href={pUrl} />
        <meta name="robots" content="index, follow, max-image-preview:large" />

        <link rel="alternate" hrefLang="zh-CN" href={pUrl} />
        <link rel="alternate" hrefLang="en" href={`${BASE_URL}/en/example/${displayIdStr}`} />
        <link rel="alternate" hrefLang="x-default" href={pUrl} />
      </Head>

      {/* P0: SSR 页面内容 */}
      <main
        id="ssr-content"
        style={{
          display: 'none',
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
        </nav>

        <header
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            borderRadius: 16,
            padding: '40px 24px',
            marginBottom: 32,
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
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
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>
            {ssrProfile.username}
            <span style={{ fontSize: 14, fontWeight: 400, color: '#6b7280', marginLeft: 8 }}>
              示例
            </span>
          </h1>
          {ssrProfile.tag && (
            <p style={{ fontSize: 16, color: '#a0a0b8', margin: '0 0 8px 0' }}>
              {ssrProfile.tag}
            </p>
          )}
          {ssrProfile.slogan && (
            <p style={{ fontSize: 16, color: '#d1d5db', maxWidth: 560, margin: '0 0 16px 0' }}>
              {ssrProfile.slogan}
            </p>
          )}
        </header>

        <section>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#fff', margin: '0 0 16px 0' }}>
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
                  <p style={{ fontSize: 15, color: '#e6e6e6', margin: '0 0 10px 0', whiteSpace: 'pre-wrap' }}>
                    {log.content || ''}
                  </p>
                  <time dateTime={log.created_at || ''} style={{ fontSize: 12, color: '#6b7280' }}>
                    {fmtDate(log.created_at)}
                  </time>
                </article>
              ))}
            </div>
          ) : (
            <p style={{ color: '#6b7280', fontSize: 14 }}>暂无公开日志</p>
          )}
        </section>

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

      <noscript>
        <style>{`#ssr-content { display: block !important; }`}</style>
      </noscript>

      <AppRoutes />
    </>
  );
}

function generateUserJsonLd(profile: Profile, logs: any[], aiDescription?: string): object {
  const pUrl = `${BASE_URL}/example/${padId(profile.display_id)}`;
  const profilePage = generateProfilePageSchema(profile, aiDescription);
  const blogPostings = logs.slice(0, 10).map((log) => {
    const posting: any = generateBlogPostingSchema(
      { content: log.content || '', created_at: log.created_at || '' },
      profile,
    );
    posting['@id'] = `${pUrl}/thought/${log.id}`;
    posting.url = `${pUrl}/thought/${log.id}`;
    posting.isPartOf = { '@type': 'ProfilePage', '@id': pUrl };
    return posting;
  });
  const breadcrumb = generateBreadcrumbList([
    { name: '认知界', url: BASE_URL },
    { name: `${profile.username}（示例）`, url: pUrl },
  ]);
  return { '@context': 'https://schema.org', '@graph': [profilePage, breadcrumb, ...blogPostings] };
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const displayIdParam = context.params?.displayId as string;
  if (!displayIdParam) return { props: { ssrNotFound: true } };

  try {
    const displayId = parseInt(displayIdParam, 10);
    if (isNaN(displayId)) return { props: { ssrNotFound: true } };

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('display_id', displayId)
      .maybeSingle();

    if (!profile) return { props: { ssrNotFound: true } };

    const { data: logs } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', profile.user_id)
      .order('created_at', { ascending: false })
      .limit(20);

    const typedProfile = sanitizeProfile(profile as Profile);
    const ssrLogs = (logs || []).map((log: any) => ({ ...log, canDelete: false }));

    return {
      props: {
        ssrProfile: typedProfile,
        ssrLogs,
        ssrJsonLd: generateUserJsonLd(typedProfile, ssrLogs),
        ssrMetaDescription: `${typedProfile.tag}。${typedProfile.slogan?.slice(0, 80) || ''}`,
      },
    };
  } catch (err) {
    console.error('[getServerSideProps example] 获取失败:', err);
    return { props: { ssrNotFound: true } };
  }
};
