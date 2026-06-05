import { GetServerSideProps } from 'next';
import { supabase } from '../src/supabase/client';
import AppRoutes from '../src/App';
import type { Profile } from '../src/types';

// 渲染全量 Routes（让 react-router Link 正常工作），SSR 数据通过 pageProps → SSRDataContext → UserPage
export default function UserSSRPage() {
  return <AppRoutes />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { userId } = context.params as { userId: string };

  if (!userId || userId === 'favicon.ico' || userId === 'robots.txt' || userId === 'sitemap.xml') {
    return { notFound: true };
  }

  try {
    // 1. 获取用户 Profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      return { props: { ssrUserId: userId, ssrNotFound: true } };
    }

    const typedProfile = profile as Profile;

    // 隐藏用户对搜索引擎也不可见
    if (typedProfile.is_hidden) {
      return { props: { ssrUserId: userId, ssrNotFound: true } };
    }

    // 2. 获取最近日志
    const { data: logs } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    // 3. 获取背景图
    const activeBg = typedProfile.background_image
      ? { url: typedProfile.background_image }
      : null;

    return {
      props: {
        ssrUserId: userId,
        ssrProfile: typedProfile,
        ssrLogs: (logs || []).map((log: any) => ({ ...log, canDelete: false })),
        ssrActiveBg: activeBg,
      },
    };
  } catch (err) {
    console.error('[getServerSideProps] 获取用户数据失败:', err);
    return { props: { ssrUserId: userId, ssrNotFound: true } };
  }
};
