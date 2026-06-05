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
import type { Profile } from '../../src/types';

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

function userUrl(id: number | null): string {
  return `${APP_CONFIG.url}/example/${padId(id)}`;
}

export default function ExampleSSRPage({
  ssrUserId,
  ssrProfile,
  ssrLogs,
  ssrJsonLd,
  ssrMetaDescription,
  ssrNotFound,
  ssrActiveBg,
}: any) {
  if (ssrNotFound || !ssrProfile) {
    return <AppRoutes />;
  }

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
        <meta property="og:url" content={`${APP_CONFIG.url}/example/${padId(ssrProfile.display_id)}`} />
        <link rel="canonical" href={`${APP_CONFIG.url}/example/${padId(ssrProfile.display_id)}`} />
      </Head>
      <AppRoutes />
    </>
  );
}

function generateUserJsonLd(profile: Profile, logs: any[]): object {
  const pUrl = userUrl(profile.display_id);
  const profilePage = generateProfilePageSchema(profile);
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
    { name: '认知界', url: APP_CONFIG.url },
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
    const activeBg = typedProfile.background_image ? { url: typedProfile.background_image } : null;

    return {
      props: {
        ssrUserId: typedProfile.user_id,
        ssrProfile: typedProfile,
        ssrLogs,
        ssrActiveBg: activeBg,
        ssrJsonLd: generateUserJsonLd(typedProfile, ssrLogs),
        ssrMetaDescription: `${typedProfile.tag}。${typedProfile.slogan?.slice(0, 80) || ''}`,
      },
    };
  } catch (err) {
    console.error('[getServerSideProps example] 获取失败:', err);
    return { props: { ssrNotFound: true } };
  }
};
