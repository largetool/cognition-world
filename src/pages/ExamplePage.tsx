import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, MapPin, Calendar, Eye, Send } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { Footer } from '../components/Footer';
import { GlassCard } from '../components/GlassCard';
import { getInitials, APP_CONFIG } from '../types';
import type { Profile } from '../types';

const galaxyBg = '/assets/C2283395-46CF-48E8-B1EC-3813518039AE_2.jpg';

// 示例用户数据 - 展示虚拟身份风格
const EXAMPLE_USER: Partial<Profile> = {
  id: 'example-000000001',
  user_id: 'EXAMPLE001',
  username: '星际旅人',
  tag: '代码诗人',
  slogan: '在数字宇宙中流浪，用代码书写星辰大海',
  location: '中国 浙江省 杭州市 西湖区',
  is_public: true,
  is_hidden: false,
  is_admin: false,
  display_id: 1,
  created_at: '2024-01-15T08:30:00Z',
  updated_at: '2024-12-20T14:20:00Z',
};

// 示例认知日志
const EXAMPLE_LOGS = [
  {
    id: 'log-1',
    content: '今天完成了一个复杂的算法优化项目，性能提升了40%，很有成就感！',
    created_at: '2025-01-10T09:30:00Z',
  },
  {
    id: 'log-2',
    content: '周末去西湖边拍了些照片，秋天的杭州真的很美，银杏叶黄了，湖面波光粼粼。',
    created_at: '2025-01-08T16:45:00Z',
  },
  {
    id: 'log-3',
    content: '读完了《黑客与画家》，对技术创造力和艺术的关系有了新的理解。',
    created_at: '2025-01-05T20:15:00Z',
  },
  {
    id: 'log-4',
    content: '第一次尝试做红烧肉，虽然卖相一般，但味道还不错，继续练习！',
    created_at: '2025-01-03T12:00:00Z',
  },
  {
    id: 'log-5',
    content: '新年愿望：希望今年能去更多的地方旅行，认识更多有趣的人。',
    created_at: '2025-01-01T00:01:00Z',
  },
];

export default function ExamplePage() {
  const [profile] = useState(EXAMPLE_USER as Profile);
  const [logs] = useState(EXAMPLE_LOGS);

  const pageSEO = {
    title: '示例用户页面 - 认知界｜全民 GEO 公开信息平台',
    description: '这是一个示例用户页面，展示认知界平台的个人主页样式和功能。面向全球化的个人黄页索引，让 AI 认识每一个具体的普通人。',
    keywords: ['示例', '个人主页', '黄页', 'GEO', '认知界', 'Cognition World'],
    ogType: 'profile' as const,
    canonicalUrl: `${APP_CONFIG.url}/example/000000001`,
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: `${profile.username} - ${APP_CONFIG.name}`,
    description: profile.slogan || `${profile.tag} | ${APP_CONFIG.name}`,
    url: `${APP_CONFIG.url}/example/000000001`,
    inLanguage: 'zh-CN',
    example: true,
    geoRegion: APP_CONFIG.geoAnchor,
    geoPosition: profile.location,
    isPartOf: {
      '@type': 'WebSite',
      name: APP_CONFIG.name,
      url: APP_CONFIG.url,
    },
    mainEntity: {
      '@type': 'Person',
      '@id': profile.user_id,
      name: profile.username,
      alternateName: profile.user_id,
      jobTitle: profile.tag,
      description: profile.slogan,
      identifier: {
        '@type': 'PropertyValue',
        name: 'display_id',
        value: String(profile.display_id).padStart(9, '0'),
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: profile.location,
        addressRegion: 'Zhejiang',
        addressCountry: 'CN',
      },
      url: `${APP_CONFIG.url}/example/000000001`,
      sameAs: [],
    },
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <SEOHead data={pageSEO} jsonLd={jsonLd} />

      <div className="relative">
        <div
          className="absolute top-0 left-0 right-0 h-[50vh] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${galaxyBg}')`,
            backgroundPosition: 'center top',
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-[50vh] bg-user-gradient" />

        <div className="relative z-10">
          <div className="glass border-b border-white/20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <Link
                  to="/"
                  className="flex items-center space-x-2 text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>返回首页</span>
                </Link>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={async () => {
                      const url = `${window.location.origin}/#/example/000000001`;
                      if (navigator.share) {
                        await navigator.share({
                          title: '示例用户 - 认知界',
                          text: '查看认知界示例用户页面',
                          url,
                        });
                      } else {
                        await navigator.clipboard.writeText(url);
                        alert('链接已复制到剪贴板');
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <Share2 className="w-5 h-5 text-[var(--text-primary)]" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center"
            >
              <div className="w-full max-w-md mb-6">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Beta 测试版示例页面</p>
                    <p>此页面为示例页面，不代表真实用户。仅用于展示平台功能和样式。</p>
                  </div>
                </div>
              </div>

              <div className="w-24 h-24 rounded-2xl bg-[var(--accent)] flex items-center justify-center text-white text-4xl font-bold mb-6">
                {getInitials(profile.username)}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-2">
                {profile.username}
              </h1>

              <p className="text-[var(--text-secondary)] mb-2">
                {profile.tag}
              </p>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--bg-secondary)] rounded-full mb-4">
                <span className="text-xs text-[var(--text-tertiary)]">ID</span>
                <span className="text-xs font-mono font-medium text-[var(--text-primary)]">
                  {String(profile.display_id ?? 0).padStart(9, '0')}
                </span>
              </div>

              <p className="text-lg text-[var(--text-tertiary)] text-center max-w-xl mb-8">
                {profile.slogan}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[var(--text-secondary)]">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>加入于 {new Date(profile.created_at || '').getFullYear()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>公开</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <GlassCard className="mb-8">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            发布认知日志
          </h3>
          <div className="bg-[var(--bg-secondary)] rounded-lg p-4 mb-4">
            <p className="text-sm text-[var(--text-tertiary)]">
              登录后可以发布认知日志，记录你的想法和经历。
            </p>
          </div>
          <div className="flex justify-end">
            <Link
              to="/login"
              className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>去登录</span>
            </Link>
          </div>
        </GlassCard>

        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
            认知日志
          </h2>

          <div>
            {logs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
                className="glass-card rounded-xl p-4 mb-3"
              >
                <p className="text-[var(--text-primary)] whitespace-pre-wrap">
                  {log.content}
                </p>
                <div className="mt-2 text-xs text-[var(--text-tertiary)]">
                  {new Date(log.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
