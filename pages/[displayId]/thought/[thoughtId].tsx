import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { supabase } from '../../../src/supabase/client';
import AppRoutes from '../../../src/App';
import { APP_CONFIG } from '../../../src/types';
import type { Profile } from '../../../src/types';

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

export default function ThoughtSSRPage({
  ssrProfile,
  ssrThought,
  ssrJsonLd,
  ssrMetaDescription,
}: any) {
  if (!ssrProfile || !ssrThought) return <AppRoutes />;

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
        <title>{ssrThought.content?.slice(0, 60)} - {ssrProfile.username} - {APP_CONFIG.name}</title>
        <meta name="description" content={ssrMetaDescription || ssrThought.content?.slice(0, 160) || ''} />
        <meta property="og:title" content={`${ssrProfile.username}：「${ssrThought.content?.slice(0, 60)}」`} />
        <meta property="og:description" content={ssrThought.content?.slice(0, 200) || ''} />
        <meta property="og:type" content="article" />
        <link rel="canonical" href={ssrJsonLd?.url || ''} />
      </Head>
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

    const pUrl = `${APP_CONFIG.url}/${padId(profile.display_id)}/thought/${thoughtId}`;
    const ssrJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'SocialMediaPosting',
      headline: log.content.slice(0, 60),
      articleBody: log.content,
      datePublished: log.created_at,
      author: {
        '@type': 'Person',
        name: profile.username,
        url: `${APP_CONFIG.url}/${padId(profile.display_id)}`,
      },
      url: pUrl,
      isPartOf: {
        '@type': 'ProfilePage',
        url: `${APP_CONFIG.url}/${padId(profile.display_id)}`,
      },
    };

    return {
      props: {
        ssrProfile: sanitizeProfile(profile as Profile),
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
