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

// 渲染全量 Routes（让 react-router Link 正常工作），SSR 数据通过 pageProps → SSRDataContext → UserPage
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
  ssrActiveBg,
}: SSRProps) {
  // 不存在的用户直接跳过 SEO
  if (ssrNotFound || !ssrProfile) {
    return <AppRoutes />;
  }

  return (
    <>
      {/* SSR 渲染的 JSON-LD 结构化数据 —— AI 爬虫可直接读取 */}
      {ssrJsonLd && (
        <Head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ssrJsonLd) }}
          />
        </Head>
      )}
      {/* 用户专属 meta 标签 —— 每个用户页动态生成 */}
      <Head>
        <title>{ssrOgTitle || `${ssrProfile.username} - ${APP_CONFIG.name}`}</title>
        <meta name="description" content={ssrMetaDescription || ''} />
        <meta property="og:title" content={ssrOgTitle || `${ssrProfile.username} - ${APP_CONFIG.name}`} />
        <meta property="og:description" content={ssrOgDescription || ''} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={ssrCanonicalUrl || `${APP_CONFIG.url}/${ssrUserId}`} />
        {ssrOgImage ? (
          <meta property="og:image" content={ssrOgImage} />
        ) : (
          <meta property="og:image" content={generateOGImage(ssrProfile.username)} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ssrOgTitle || `${ssrProfile.username} - ${APP_CONFIG.name}`} />
        <meta name="twitter:description" content={ssrOgDescription || ''} />
        <link rel="canonical" href={ssrCanonicalUrl || `${APP_CONFIG.url}/${ssrUserId}`} />
      </Head>
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
}

/** 为用户生成动态 OG 图片（DiceBear 头像作为社交分享图） */
function generateOGImage(username: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}&backgroundColor=1a1a2e&textColor=e6e6e6`;
}

/** 为用户页生成动态 meta description */
function generateMetaDescription(profile: Profile, logs: any[]): string {
  const parts: string[] = [];
  if (profile.tag) parts.push(profile.tag);
  if (profile.slogan) {
    parts.push(profile.slogan.slice(0, 80));
  }
  if (logs.length > 0) {
    const topics = logs.slice(0, 3).map(l => (l.content || '').slice(0, 30)).join('、');
    parts.push(`近期话题：${topics}`);
  }
  return parts.join('。') || `${profile.username}在${APP_CONFIG.name}的个人公开主页`;
}

/** 为用户页生成所有 JSON-LD */
function generateUserJsonLd(profile: Profile, logs: any[]): object {
  const profileUrl = `${APP_CONFIG.url}/${profile.user_id}`;

  // ProfilePage + Person
  const profilePage = generateProfilePageSchema(profile);

  // BlogPosting for each log (最多取 10 条避免 JSON 过大)
  const blogPostings = logs.slice(0, 10).map((log) => {
    const posting = generateBlogPostingSchema(
      { content: log.content || '', created_at: log.created_at || log.published_at || '' },
      profile,
    );
    posting['@id'] = `${profileUrl}/thought/${log.id}`;
    posting.url = `${profileUrl}/thought/${log.id}`;
    posting.isPartOf = { '@type': 'ProfilePage', '@id': profileUrl };
    return posting;
  });

  // BreadcrumbList
  const breadcrumb = generateBreadcrumbList([
    { name: '认知界', url: APP_CONFIG.url },
    { name: profile.username, url: profileUrl },
  ]);

  // 合并为 @graph
  return {
    '@context': 'https://schema.org',
    '@graph': [profilePage, breadcrumb, ...blogPostings],
  };
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { userId } = context.params as { userId: string };

  if (!userId || userId === 'favicon.ico' || userId === 'robots.txt' || userId === 'sitemap.xml') {
    return { notFound: true };
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      return { props: { ssrUserId: userId, ssrNotFound: true } };
    }

    const typedProfile = profile as Profile;

    if (typedProfile.is_hidden) {
      return { props: { ssrUserId: userId, ssrNotFound: true } };
    }

    const { data: logs } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    const activeBg = typedProfile.background_image
      ? { url: typedProfile.background_image }
      : null;

    const ssrLogs = (logs || []).map((log: any) => ({ ...log, canDelete: false }));
    const ssrJsonLd = generateUserJsonLd(typedProfile, ssrLogs);
    const ssrMetaDescription = generateMetaDescription(typedProfile, ssrLogs);

    return {
      props: {
        ssrUserId: userId,
        ssrProfile: typedProfile,
        ssrLogs,
        ssrActiveBg: activeBg,
        ssrJsonLd,
        ssrMetaDescription,
        ssrOgTitle: `${typedProfile.username} - ${APP_CONFIG.name}`,
        ssrOgDescription: ssrMetaDescription,
        ssrOgImage: typedProfile.background_image || '',
        ssrCanonicalUrl: `${APP_CONFIG.url}/${userId}`,
      },
    };
  } catch (err) {
    console.error('[getServerSideProps] 获取用户数据失败:', err);
    return { props: { ssrUserId: userId, ssrNotFound: true } };
  }
};
