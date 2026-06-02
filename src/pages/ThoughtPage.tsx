import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, User } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { Footer } from '../components/Footer';
import { supabase } from '../supabase/client';
import { getUserSEO, APP_CONFIG, getDefaultSEO } from '../types';
import { generateProfilePageSchema, generateBreadcrumbList, breadcrumbs } from '../utils/seo';
import { t, getCurrentLanguage } from '../locales';
import type { Profile } from '../types';

// 生成用户头像 URL
function generateUserAvatar(username: string): string {
  return `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(username)}&backgroundColor=1a1a2e&textColor=e6e6e6&size=1200`;
}

// 生成动态页面的 JSON-LD 结构化数据
function generateThoughtSchema(log: Log, profile: Profile, currentUrl: string) {
  const userProfileUrl = `${APP_CONFIG.url}/${profile.user_id}`;
  const avatarUrl = generateUserAvatar(profile.username);

  return {
    '@context': 'https://schema.org',
    '@type': 'SocialMediaPosting',
    '@id': currentUrl,
    headline: log.content.slice(0, 100),
    articleBody: log.content,
    text: log.content,
    datePublished: log.created_at,
    dateModified: log.created_at,
    url: currentUrl,
    author: {
      '@type': 'Person',
      '@id': `${userProfileUrl}#person`,
      name: profile.username,
      url: userProfileUrl,
      image: avatarUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: APP_CONFIG.name,
      url: APP_CONFIG.url,
      logo: {
        '@type': 'ImageObject',
        url: `${APP_CONFIG.url}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': currentUrl,
    },
  };
}

interface Log {
  id: string;
  user_id: string;
  content: string;
  created_at: string | null;
}

export default function ThoughtPage() {
  const { userId, thoughtId } = useParams<{ userId: string; thoughtId: string }>();
  const [log, setLog] = useState<Log | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!userId || !thoughtId) {
        setError('参数错误');
        setIsLoading(false);
        return;
      }

      // 获取动态
      const { data: logData, error: logError } = await supabase
        .from('logs')
        .select('*')
        .eq('id', thoughtId)
        .eq('user_id', userId)
        .single();

      if (logError || !logData) {
        setError('动态不存在');
        setIsLoading(false);
        return;
      }

      // 获取用户信息
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      setLog(logData);
      setProfile(profileData);
      setIsLoading(false);
    };

    loadData();
  }, [userId, thoughtId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]" />
      </div>
    );
  }

  if (error || !log || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            动态不存在
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">
            该动态已被删除或不存在
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const currentUrl = `${APP_CONFIG.url}/${userId}/thought/${thoughtId}`;
  const avatarUrl = generateUserAvatar(profile.username);

  const seoData = {
    title: `${profile.username}的动态 - ${APP_CONFIG.name}`,
    description: log.content.slice(0, 200),
    keywords: [profile.username, profile.tag, '动态', '认知日志', 'GEO'],
    ogType: 'article' as const,
    ogImage: avatarUrl,
    canonicalUrl: currentUrl,
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <SEOHead
        data={seoData}
        jsonLd={generateThoughtSchema(log, profile, currentUrl)}
      />

      <nav className="glass border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to={`/${userId}`}
              className="flex items-center space-x-2 text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回个人主页</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* 作者信息 */}
          <div className="flex items-center gap-3 mb-6">
            <Link to={`/${userId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xl font-bold">
                {profile.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="font-semibold text-[var(--text-primary)]">{profile.username}</h2>
                <p className="text-sm text-[var(--text-secondary)]">{profile.tag}</p>
              </div>
            </Link>
          </div>

          {/* 动态内容 */}
          <article className="bg-[var(--bg-secondary)] rounded-2xl p-6 sm:p-8" itemScope itemType="https://schema.org/SocialMediaPosting">
            <meta itemProp="headline" content={log.content.slice(0, 100)} />
            <meta itemProp="articleBody" content={log.content} />
            <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] mb-4">
              <Clock className="w-4 h-4" />
              <time itemProp="datePublished" dateTime={log.created_at || new Date().toISOString()}>
                {new Date(log.created_at || Date.now()).toLocaleString('zh-CN')}
              </time>
            </div>

            {/* 完整内容 - SEO友好 */}
            <div itemProp="text" className="prose prose-lg max-w-none text-[var(--text-primary)] whitespace-pre-wrap">
              {log.content}
            </div>

            {/* 作者信息 - 微数据 */}
            <div itemProp="author" itemScope itemType="https://schema.org/Person" className="mt-6 pt-4 border-t border-[var(--border-light)]">
              <meta itemProp="name" content={profile.username} />
              <meta itemProp="url" content={`${APP_CONFIG.url}/${profile.user_id}`} />
            </div>
          </article>

          {/* 相关链接 */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              to={`/${userId}`}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
            >
              <User className="w-4 h-4" />
              查看更多动态
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
