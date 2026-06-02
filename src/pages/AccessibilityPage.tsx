import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, ArrowUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { Footer } from '../components/Footer';
import { APP_CONFIG } from '../types';
import { generateBreadcrumbList, breadcrumbs } from '../utils/seo';

export default function AccessibilityPage() {
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

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <SEOHead
        data={{
          title: '无障碍声明 - 认知界',
          description: '认知界无障碍访问声明',
        }}
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            generateBreadcrumbList([breadcrumbs.home, breadcrumbs.accessibility]),
          ],
        }}
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
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
              无障碍声明
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              认知界致力于让每个人都能平等地访问和使用本平台
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-[var(--bg-secondary)] rounded-2xl p-8 sm:p-12"
          >
            <div className="prose prose-slate max-w-none">
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">当前状态</h2>
                <p className="text-[var(--text-secondary)] mb-4">
                  认知界目前处于 Beta 测试阶段，我们正在持续优化网站的可访问性。当前已实现的无障碍特性包括：
                </p>
                <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2">
                  <li><strong>语义化 HTML 结构</strong>：使用正确的标题层级（h1-h6）和地标元素（nav、main、footer），方便屏幕阅读器导航</li>
                  <li><strong>文本对比度</strong>：主要文本和背景之间保持足够的颜色对比度</li>
                  <li><strong>键盘导航</strong>：所有互动元素（链接、按钮、表单）可通过键盘访问</li>
                  <li><strong>可缩放文本</strong>：页面支持浏览器文本缩放，内容不会因此丢失或重叠</li>
                  <li><strong>焦点指示器</strong>：键盘操作时有清晰的焦点可见标识</li>
                  <li><strong>替代文本</strong>：所有非装饰性图片均包含有意义的 alt 文本描述</li>
                  <li><strong>减少动效</strong>：尊重用户的操作系统"减少动效"偏好设置</li>
                </ul>
              </section>

              <hr className="my-8 border-gray-200" />

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">无障碍标准</h2>
                <p className="text-[var(--text-secondary)]">
                  我们以 <strong>WCAG 2.1（网页内容无障碍指南）AA 级</strong> 为努力目标，并将在后续迭代中逐步达到 AAA 级标准。
                </p>
              </section>

              <hr className="my-8 border-gray-200" />

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">已知局限</h2>
                <p className="text-[var(--text-secondary)] mb-4">作为 Beta 阶段的产品，以下方面仍在改进中：</p>
                <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2">
                  <li>部分新功能的无障碍测试尚未完成</li>
                  <li>个别第三方组件的键盘操作体验有待优化</li>
                  <li>复杂交互（如拖拽操作）的无障碍支持仍在开发中</li>
                </ul>
              </section>

              <hr className="my-8 border-gray-200" />

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">如何联系我们</h2>
                <p className="text-[var(--text-secondary)] mb-4">
                  如果你在使用认知界时遇到任何无障碍方面的问题，或有改进建议，请通过以下方式联系我们：
                </p>
                <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2">
                  <li><strong>站内留言板：</strong>登录后向系统账号发送消息</li>
                  <li><strong>邮箱：</strong>contact@uptef.com</li>
                </ul>
                <p className="text-[var(--text-secondary)] mt-4">
                  我们会认真对待每一条反馈，并在合理时间内回复。
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

      {/* 返回顶部按钮 */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-purple-500 text-white rounded-full shadow-lg hover:bg-purple-600 transition-colors flex items-center justify-center"
            aria-label="返回顶部"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
