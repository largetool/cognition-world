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
        <meta property="og:url" content={`${APP_CONFIG.url}/example/${ssrUserId}`} />
        <link rel="canonical" href={`${APP_CONFIG.url}/example/${ssrUserId}`} />
      </Head>
      <AppRoutes />
    </>
  );
}

function generateUserJsonLd(profile: Profile, logs: any[]): object {
  const profileUrl = `${APP_CONFIG.url}/example/${profile.user_id}`;
  const profilePage = generateProfilePageSchema(profile);
  const blogPostings = logs.slice(0, 10).map((log) => {
    const posting = generateBlogPostingSchema(
      { content: log.content || '', created_at: log.created_at || '' },
      profile,
    );
    posting['@id'] = `${profileUrl}/thought/${log.id}`;
    posting.url = `${profileUrl}/thought/${log.id}`;
    posting.isPartOf = { '@type': 'ProfilePage', '@id': profileUrl };
    return posting;
  });
  const breadcrumb = generateBreadcrumbList([
    { name: '认知界', url: APP_CONFIG.url },
    { name: `${profile.username}（示例）`, url: profileUrl },
  ]);
  return { '@context': 'https://schema.org', '@graph': [profilePage, breadcrumb, ...blogPostings] };
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { userId } = context.params as { userId: string };

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile) {
      return { props: { ssrUserId: userId, ssrNotFound: true } };
    }

    // 示例页只取公开日志
    const { data: logs } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    const typedProfile = profile as Profile;
    const ssrLogs = (logs || []).map((log: any) => ({ ...log, canDelete: false }));
    const activeBg = typedProfile.background_image ? { url: typedProfile.background_image } : null;

    return {
      props: {
        ssrUserId: userId,
        ssrProfile: typedProfile,
        ssrLogs,
        ssrActiveBg: activeBg,
        ssrJsonLd: generateUserJsonLd(typedProfile, ssrLogs),
        ssrMetaDescription: `${typedProfile.tag}。${typedProfile.slogan?.slice(0, 80) || ''}`,
      },
    };
  } catch (err) {
    console.error('[getServerSideProps example] 获取失败:', err);
    return { props: { ssrUserId: userId, ssrNotFound: true } };
  }
};
