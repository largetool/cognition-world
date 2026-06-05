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
import type { Profile } from '../src/types';

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

/** display_id 转 9 位定长显示 ID */
function padId(id: number | null): string {
  return String(id ?? 0).padStart(9, '0');
}

/** 用户公开主页完整 URL */
function userUrl(id: number | null): string {
  return `${APP_CONFIG.url}/${padId(id)}`;
}

export default function UserSSRPage({
  ssrUserId,
  ssrDisplayId,
  ssrProfile,
  ssrLogs,
  ssrJsonLd,
  ssrMetaDescription,
  ssrOgTitle,
  ssrOgDescription,
  ssrOgImage,
  ssrCanonicalUrl,
  ssrNotFound,
  ssrActiveBg,
}: SSRProps) {
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
        <title>{ssrOgTitle || `${ssrProfile.username} - ${APP_CONFIG.name}`}</title>
        <meta name="description" content={ssrMetaDescription || ''} />
        <meta property="og:title" content={ssrOgTitle || `${ssrProfile.username} - ${APP_CONFIG.name}`} />
        <meta property="og:description" content={ssrOgDescription || ''} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={ssrCanonicalUrl || ''} />
        {ssrOgImage ? (
          <meta property="og:image" content={ssrOgImage} />
        ) : (
          <meta property="og:image" content={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(ssrProfile.username)}&backgroundColor=1a1a2e&textColor=e6e6e6`} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ssrOgTitle || `${ssrProfile.username} - ${APP_CONFIG.name}`} />
        <meta name="twitter:description" content={ssrOgDescription || ''} />
        <link rel="canonical" href={ssrCanonicalUrl || ''} />
      </Head>
      <AppRoutes />
    </>
  );
}

interface SSRProps {
  ssrUserId?: string;
  ssrDisplayId?: number;
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

function generateUserJsonLd(profile: Profile, logs: any[]): object {
  const pUrl = userUrl(profile.display_id);
  const profilePage = generateProfilePageSchema(profile);

  const blogPostings = logs.slice(0, 10).map((log) => {
    const posting: any = generateBlogPostingSchema(
      { content: log.content || '', created_at: log.created_at || log.published_at || '' },
      profile,
    );
    posting['@id'] = `${pUrl}/thought/${log.id}`;
    posting.url = `${pUrl}/thought/${log.id}`;
    posting.isPartOf = { '@type': 'ProfilePage', '@id': pUrl };
    return posting;
  });

  const breadcrumb = generateBreadcrumbList([
    { name: '认知界', url: APP_CONFIG.url },
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
      // 纯数字 → 按 display_id 查找
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('display_id', displayId)
        .maybeSingle();
      profile = data as Profile | null;
    }

    // 如果纯数字没找到，或者不是纯数字（可能是旧格式 user_id），按 user_id 查找
    if (!profile) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', param)
        .maybeSingle();
      // 如果找到的是旧格式 user_id，301 跳转到新的 display_id URL
      if (data) {
        return {
          redirect: {
            destination: `/${String(data.display_id).padStart(9, '0')}`,
            permanent: true,
          },
        };
      }
      return { props: { ssrDisplayId: displayId, ssrNotFound: true } };
    }

    if (!profile) {
      return { props: { ssrDisplayId: displayId, ssrNotFound: true } };
    }

    const typedProfile = sanitizeProfile(profile as Profile);

    if (typedProfile.is_hidden) {
      return { props: { ssrDisplayId: displayId, ssrNotFound: true } };
    }

    const { data: logs } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', typedProfile.user_id)
      .order('created_at', { ascending: false })
      .limit(100);

    const activeBg = typedProfile.background_image
      ? { url: typedProfile.background_image }
      : null;

    const ssrLogs = (logs || []).map((log: any) => ({ ...log, canDelete: false }));
    const pUrl = userUrl(typedProfile.display_id);
    const ssrJsonLd = generateUserJsonLd(typedProfile, ssrLogs);
    const ssrMetaDescription = generateMetaDescription(typedProfile, ssrLogs);

    return {
      props: {
        ssrUserId: typedProfile.user_id,
        ssrDisplayId: typedProfile.display_id,
        ssrProfile: typedProfile,
        ssrLogs,
        ssrActiveBg: activeBg,
        ssrJsonLd,
        ssrMetaDescription,
        ssrOgTitle: `${typedProfile.username} - ${APP_CONFIG.name}`,
        ssrOgDescription: ssrMetaDescription,
        ssrOgImage: typedProfile.background_image || '',
        ssrCanonicalUrl: pUrl,
      },
    };
  } catch (err) {
    console.error('[getServerSideProps] 获取用户数据失败:', err);
    return { props: { ssrNotFound: true } };
  }
};
