import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, Shield, Zap, FileText } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { FeatureCard } from '../components/FeatureCard';
import { getSystemStats, getRandomApprovedSlogan } from '../utils/storage';
import { GlassCard } from '../components/GlassCard';
import { getDefaultSEO, APP_CONFIG } from '../types';
import { generateWebSiteSchema, generateOrganizationSchema, generateBreadcrumbList, breadcrumbs } from '../utils/seo';
import { t, getCurrentLanguage } from '../locales';
import { useAuth } from '../hooks/useAuth';

const heroBg = new URL('../../assets/C2283395-46CF-48E8-B1EC-3813518039AE.jpg', import.meta.url).href;

export default function IndexPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ userCount: 0, logCount: 0 });
  const [randomUser, setRandomUser] = useState<{ username: string; slogan: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [statsData, userData] = await Promise.all([
        getSystemStats(),
        getRandomApprovedSlogan()
      ]);
      setStats(statsData);
      setRandomUser(userData);
    } catch (error) {
      console.error('Failed to load index data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const features = [
    {
      icon: Globe,
      title: '全球索引',
      description: '让世界透过AI认识每一个具体的普通人',
    },
    {
      icon: Shield,
      title: '透明优先',
      description: '向世界宣告你的存在',
    },
    {
      icon: Zap,
      title: 'SEO、GEO',
      description: '结构化数据友好',
    },
  ];

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <SEOHead
        data={getDefaultSEO()}
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            generateWebSiteSchema(),
            generateOrganizationSchema(),
            generateBreadcrumbList([breadcrumbs.home]),
          ],
        }}
      />
      <Navbar user={user} transparent />

      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-no-repeat will-change-transform"
          style={{
            backgroundImage: `url('${heroBg}')`,
            backgroundPosition: 'center 40%',
            filter: 'brightness(1.08) contrast(0.95) saturate(1.11)',
          }}
          role="img" aria-label="Hero background"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-[120px] sm:pt-0 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-sm mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-gray-700">
                Beta 测试阶段
              </span>
            </motion.div>

            <h1
              className="text-6xl sm:text-7xl lg:text-8xl font-bold text-gray-900 mb-4 tracking-tight"
              style={{ fontWeight: 800, letterSpacing: '-0.02em' }}
            >
              认知界
            </h1>

            <p className="text-xl sm:text-2xl text-gray-800 mb-3 font-medium">
              人本位 —— 在 AI 时代，重建真实的人类连接
            </p>

            <p className="text-base sm:text-lg text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
              面向全球化的个人 GEO 公开信息平台
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-medium text-lg shadow-xl shadow-gray-200/50 hover:bg-gray-800 transition-all"
                >
                  <Zap className="w-5 h-5" />
                  立即入驻
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to="/whitepaper"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/70 backdrop-blur-xl text-gray-800 rounded-2xl font-medium text-lg border border-white/90 shadow-lg shadow-slate-200/40 hover:bg-white/90 transition-all"
                >
                  <FileText className="w-5 h-5" />
                  阅读白皮书
                </Link>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="grid grid-cols-3 md:grid-cols-3 gap-2 sm:gap-6 max-w-4xl mx-auto mt-8"
          >
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={0.1 * index}
              />
            ))}
          </motion.div>
        </div>

        {/* 认知界Slogan - 首屏底部 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="absolute bottom-4 sm:bottom-20 left-0 right-0 px-3 sm:px-4 z-10"
        >
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-8 bg-white/60 backdrop-blur-2xl border border-white/80 shadow-2xl shadow-slate-200/50 text-center">
              <p className="text-lg sm:text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 leading-relaxed">
                让世界透过AI认识每一个具体的普通人
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">认</span>
                </div>
                <p className="text-lg font-semibold text-gray-600">
                  {APP_CONFIG.name}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            {randomUser ? (
              <GlassCard className="text-center py-12">
                <blockquote className="text-2xl sm:text-3xl font-medium text-[var(--text-primary)] mb-4">
                  "{randomUser.slogan}"
                </blockquote>
                <p className="text-xl sm:text-2xl font-bold text-[var(--text-secondary)]">
                  — {randomUser.username}
                </p>
              </GlassCard>
            ) : (
              <h2 className="text-2xl sm:text-3xl font-medium text-[var(--text-primary)]">
                从此，我们被世界认知
              </h2>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center"
            >
              <div className="text-4xl sm:text-5xl font-semibold text-[var(--text-primary)] mb-2">
                {formatNumber(stats.userCount)}
              </div>
              <div className="text-sm text-[var(--text-tertiary)]">
                人拥有先发优势
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center"
            >
              <div className="text-4xl sm:text-5xl font-semibold text-[var(--text-primary)] mb-2">
                {formatNumber(stats.logCount)}
              </div>
              <div className="text-sm text-[var(--text-tertiary)]">
                篇日志拥有先发优势
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-center"
            >
              <div className="text-4xl sm:text-5xl font-semibold text-[var(--text-primary)] mb-2">
                ∞
              </div>
              <div className="text-sm text-[var(--text-tertiary)]">
                无限可能
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
