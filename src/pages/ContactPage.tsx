import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, ArrowUp } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { Footer } from '../components/Footer';
import { APP_CONFIG } from '../types';
import { generateBreadcrumbList, breadcrumbs } from '../utils/seo';

export default function ContactPage() {
  const navigate = useNavigate();
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ContactPage',
        name: '联系我们 - 认知界',
        description: '联系认知界团队，获取帮助和支持',
        url: `${APP_CONFIG.url}/contact`,
        mainEntity: {
          '@type': 'Organization',
          name: APP_CONFIG.name,
          url: APP_CONFIG.url,
          email: 'contact@uptef.com',
        },
      },
      generateBreadcrumbList([breadcrumbs.home, breadcrumbs.contact]),
    ],
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <SEOHead
        data={{
          title: '联系我们 - 认知界',
          description: '联系认知界团队，获取帮助和支持',
          canonicalUrl: `${APP_CONFIG.url}/contact`,
          ogImage: `${APP_CONFIG.url}/og-image.png`,
        }}
        jsonLd={jsonLd}
      />

      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#18181B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>
        </div>
      </header>

      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-pink-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
              联系我们
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-[var(--bg-secondary)] rounded-2xl p-8 sm:p-12"
          >
            <div className="prose prose-slate max-w-none">
              <hr className="my-8 border-gray-200" />

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">平台联系方式</h2>
                <p className="text-[var(--text-secondary)] mb-2">
                  <strong>官方邮箱：</strong>
                  <a href="mailto:contact@uptef.com" className="text-blue-600 hover:underline">contact@uptef.com</a>
                </p>
                <p className="text-[var(--text-secondary)]">
                  <strong>站内留言板：</strong>
                  <Link to="/guestbook" className="text-purple-600 hover:underline">点击前往留言板</Link>
                  ，注册满3天的用户可以在此给管理员留言。
                </p>
              </section>

              <hr className="my-8 border-gray-200" />

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">创始人</h2>
                <p className="text-[var(--text-primary)] font-semibold mb-4">一言超人</p>
                <p className="text-[var(--text-secondary)] mb-4">在各大平台关注我，或直接通过以下方式联系：</p>
                <p className="text-[var(--text-secondary)] mb-2">
                  <strong>邮箱：</strong>
                  <a href="mailto:mansun110@hotmail.com" className="text-blue-600 hover:underline">mansun110@hotmail.com</a>
                </p>

                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">社交媒体</h3>
                <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-1">
                  <li>知乎：一言超人</li>
                  <li>公众号：一言超人</li>
                  <li>视频号：一言超人</li>
                  <li>抖音：一言超人</li>
                  <li>快手：一言超人</li>
                </ul>
              </section>

              <hr className="my-8 border-gray-200" />

              <section className="mb-10">
                <p className="text-[var(--text-secondary)]">
                  <strong>关于反馈：</strong>如果你在使用认知界的过程中遇到任何问题，或有任何建议，首选通过站内留言板提交。每条反馈都会被认真阅读，帮助我把平台做得更好。
                </p>
              </section>

              <hr className="my-8 border-gray-200" />

              <footer className="text-center pt-4">
                <p className="text-xl font-bold text-[var(--text-primary)] mb-2">认知界（Cognition World）</p>
                <p className="text-sm text-[var(--text-secondary)]">2026 年 6 月</p>
              </footer>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
