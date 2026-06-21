import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, User, ThumbsUp, Flag, MapPin } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { Footer } from '../components/Footer';
import { supabase } from '../supabase/client';
import { getUserSEO, APP_CONFIG, getDefaultSEO, formatDateTime } from '../types';
import { generateProfilePageSchema, generateBreadcrumbList, breadcrumbs } from '../utils/seo';
import { t, getCurrentLanguage } from '../locales';
import { getLikes, hasUserLiked, toggleLike } from '../utils/storage';
import { getCurrentUser } from '../utils/auth';
import type { Profile } from '../types';

// 生成用户头像 URL
function generateUserAvatar(username: string): string {
  return `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(username)}&backgroundColor=1a1a2e&textColor=e6e6e6&size=1200`;
}

function padId(id: number | null): string {
  return String(id ?? 0).padStart(9, '0');
}

// 生成动态页面的 JSON-LD 结构化数据
function generateThoughtSchema(log: Log, profile: Profile, displayId: number | null, currentUrl: string) {
  const userProfileUrl = `${APP_CONFIG.url}/${padId(displayId)}`;
  const avatarUrl = generateUserAvatar(profile.username);

  const schema: any = {
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
  if (log.tags && log.tags.length > 0) {
    schema.about = log.tags.map(tag => ({ '@type': 'Thing', name: tag }));
  }
  if (log.category) {
    schema.articleSection = CATEGORY_CONFIG[log.category]?.label || log.category;
  }
  if (log.location) {
    schema.contentLocation = {
      '@type': 'Place',
      name: log.location,
    };
  }
  return schema;
}

interface Log {
  id: string;
  user_id: string;
  content: string;
  created_at: string | null;
  tags?: string[] | null;
  category?: string | null;
  location?: string | null;
}

// 分类显示配置（与 LogItem 一致）
const CATEGORY_CONFIG: Record<string, { label: string; textColor: string; bgColor: string; borderColor: string }> = {
  experience: { label: '经历', textColor: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
  present:   { label: '此刻', textColor: 'text-sky-400',  bgColor: 'bg-sky-500/10',   borderColor: 'border-sky-500/20' },
  future:    { label: '将来', textColor: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
};

/** 从时间戳提取"年月"显示 */
function categoryDateLabel(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月`;
  } catch {
    return '';
  }
}

export default function ThoughtPage() {
  const { displayId, thoughtId } = useParams<{ displayId: string; thoughtId: string }>();
  const [log, setLog] = useState<Log | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<{ user_id: string } | null>(null);

  // 点赞
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!displayId || !thoughtId) {
        setError('参数错误');
        setIsLoading(false);
        return;
      }

      const displayIdNum = parseInt(displayId, 10);
      if (isNaN(displayIdNum)) {
        setError('参数错误');
        setIsLoading(false);
        return;
      }

      // 获取当前登录用户
      const { user: authUser, profile: userProfile } = await getCurrentUser();
      if (userProfile) setCurrentUser({ user_id: userProfile.user_id });

      // 先通过 display_id 获取用户
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('display_id', displayIdNum)
        .single();

      if (!profileData) {
        setError('用户不存在');
        setIsLoading(false);
        return;
      }

      // 再通过 user_id 获取动态
      const { data: logData, error: logError } = await supabase
        .from('logs')
        .select('*')
        .eq('id', thoughtId)
        .eq('user_id', profileData.user_id)
        .single();

      if (logError || !logData) {
        setError('动态不存在');
        setIsLoading(false);
        return;
      }

      setLog(logData);
      setProfile(profileData);

      // 加载点赞数据
      const count = await getLikes(thoughtId, 'log');
      setLikeCount(count);
      if (userProfile) {
        const userLiked = await hasUserLiked(thoughtId, 'log', userProfile.user_id);
        setLiked(userLiked);
      }

      setIsLoading(false);
    };

    loadData();
  }, [displayId, thoughtId]);

  const handleToggleLike = async () => {
    if (!currentUser || likeLoading) return;
    setLikeLoading(true);
    const result = await toggleLike(thoughtId!, 'log', currentUser.user_id);
    if (!result.error) {
      setLiked(result.liked);
      setLikeCount(result.count);
    }
    setLikeLoading(false);
  };

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

  const displayIdPadded = padId(profile.display_id);
  const currentUrl = `${APP_CONFIG.url}/${displayIdPadded}/thought/${thoughtId}`;
  const avatarUrl = generateUserAvatar(profile.username);

  const seoData = {
    title: `${profile.username}的动态 - ${APP_CONFIG.name}`,
    description: log.content.slice(0, 200),
    keywords: [profile.username, profile.tag, '动态', '认知日志', 'GEO', '个人SEO', 'AI可索引', ...(log.tags || [])],
    ogType: 'article' as const,
    ogImage: avatarUrl,
    canonicalUrl: currentUrl,
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <SEOHead
        data={seoData}
        jsonLd={generateThoughtSchema(log, profile, profile.display_id, currentUrl)}
      />

      <nav className="glass border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to={`/${padId(profile.display_id)}`}
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
            <Link to={`/${padId(profile.display_id)}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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
            {log.category && <meta itemProp="articleSection" content={CATEGORY_CONFIG[log.category]?.label || log.category} />}
            {log.location && <meta itemProp="contentLocation" content={log.location} />}
            <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] mb-4">
              <Clock className="w-4 h-4" />
              <time itemProp="datePublished" dateTime={log.created_at || new Date().toISOString()}>
                {formatDateTime(log.created_at || '')}
              </time>
            </div>

            {/* 分类 + 地理位置 标签 */}
            {(log.category || log.location) && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {log.category && (() => {
                  const cfg = CATEGORY_CONFIG[log.category];
                  if (!cfg) return null;
                  return (
                    <span className={`text-xs px-3 py-1 rounded-full ${cfg.bgColor} ${cfg.textColor} border ${cfg.borderColor} font-medium`}>
                      {cfg.label} · {categoryDateLabel(log.created_at)}
                    </span>
                  );
                })()}
                {log.location && (
                  <span className="text-xs px-3 py-1 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {log.location}
                  </span>
                )}
              </div>
            )}

            {/* 完整内容 - SEO友好 */}
            <div itemProp="text" className="prose prose-lg max-w-none text-[var(--text-primary)] whitespace-pre-wrap">
              {log.content}
            </div>

            {/* 标签 */}
            {log.tags && log.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {log.tags.map((tag: string, ti: number) => (
                  <span
                    key={ti}
                    className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--border-light)]">
              {/* 点赞按钮 */}
              {currentUser && (
                <button
                  onClick={handleToggleLike}
                  disabled={likeLoading}
                  className={`text-sm transition-colors flex items-center gap-1.5 ${
                    liked ? 'text-blue-500' : 'text-[var(--text-tertiary)] hover:text-blue-500'
                  }`}
                  title={liked ? '取消点赞' : '点赞'}
                >
                  <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-blue-500' : ''}`} />
                  <span>{liked ? '已点赞' : '点赞'}</span>
                  {likeCount > 0 && <span className="text-xs opacity-70">({likeCount})</span>}
                </button>
              )}
              {/* 举报按钮 - 非自己的内容可举报 */}
              {currentUser && log.user_id !== currentUser.user_id && (
                <button
                  onClick={() => alert('如需举报，请到用户页面点击举报按钮')}
                  className="text-sm text-[var(--text-tertiary)] hover:text-red-500 transition-colors flex items-center gap-1"
                  title="举报"
                >
                  <Flag className="w-4 h-4" />
                  <span>举报</span>
                </button>
              )}
            </div>

            {/* 作者信息 - 微数据 */}
            <div itemProp="author" itemScope itemType="https://schema.org/Person" className="mt-6 pt-4 border-t border-[var(--border-light)]">
              <meta itemProp="name" content={profile.username} />
              <meta itemProp="url" content={`${APP_CONFIG.url}/${padId(profile.display_id)}`} />
            </div>
          </article>

          {/* 相关链接 */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              to={`/${padId(profile.display_id)}`}
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
