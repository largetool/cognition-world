import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, AlertCircle } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { Footer } from '../components/Footer';
import { APP_CONFIG, getDefaultSEO } from '../types';

export default function NotFoundPage() {
  const seoData = {
    ...getDefaultSEO(),
    title: `页面未找到 - ${APP_CONFIG.name}`,
    description: '您访问的页面不存在或已被移除。请返回首页或尝试其他操作。',
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <SEOHead data={seoData} />

      {/* 测试版顶部横幅 */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-50 border-b border-amber-200">
        <p className="text-center text-xs text-amber-700 py-1.5">
          Beta 测试版 - 部分功能仍在开发中
        </p>
      </div>

      {/* 导航栏 */}
      <nav className="fixed top-7 left-0 right-0 z-50 glass border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="flex items-center space-x-2 text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回首页</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* 404 图标 */}
            <div className="w-24 h-24 bg-[var(--bg-secondary)] rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Search className="w-12 h-12 text-[var(--text-tertiary)]" />
            </div>

            {/* 404 标题 */}
            <h1 className="text-6xl sm:text-7xl font-bold text-[var(--text-primary)] mb-4">
              404
            </h1>

            <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)] mb-4">
              页面未找到
            </h2>

            <p className="text-lg text-[var(--text-secondary)] mb-8">
              您访问的页面不存在或已被移除
            </p>

            {/* 测试版提示 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3 max-w-md mx-auto"
            >
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 text-left">
                <p className="font-medium mb-1">Beta 测试版提示</p>
                <p>当前为功能测试阶段，部分页面可能尚未上线。感谢您的理解与耐心。</p>
              </div>
            </motion.div>

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 px-8 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                返回首页
              </Link>

              <Link
                to="/register"
                className="flex items-center gap-2 px-8 py-3 border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors font-medium"
              >
                创建账户
              </Link>
            </div>
          </motion.div>

          {/* 装饰性元素 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 pt-8 border-t border-[var(--border-subtle)]"
          >
            <p className="text-sm text-[var(--text-tertiary)]">
              {APP_CONFIG.name} {APP_CONFIG.nameEn} · {APP_CONFIG.geoAnchor}
            </p>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
