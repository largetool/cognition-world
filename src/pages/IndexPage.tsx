import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, Globe, Shield, Zap, FileText } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { FeatureCard } from '../components/FeatureCard';
import { getSystemStats, getRandomApprovedSlogan } from '../utils/storage';
import CalendarWidget from '../components/CalendarWidget';
import { GlassCard } from '../components/GlassCard';
import { getDefaultSEO, APP_CONFIG } from '../types';
import { generateBreadcrumbList, breadcrumbs, HOME_FAQ } from '../utils/seo';
import { t, getCurrentLanguage } from '../locales';
import { useAuth } from '../hooks/useAuth';

const CST_OFFSET = 8 * 60 * 60 * 1000;
const SUPABASE_URL = 'https://nbgsichilfrjsopnnvia.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZ3NpY2hpbGZyanNvcG5udmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMTE1MjMsImV4cCI6MjA5NTg4NzUyM30.fWr-ZoDhirVgsKGsL8BWeP36iQ235GuQ4iF_GYK0RH0';

const heroBg = '/assets/C2283395-46CF-48E8-B1EC-3813518039AE.jpg';

// FAQ 数据来自共享模块 src/utils/seo.ts

export default function IndexPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ userCount: 0, logCount: 0 });
  const [randomUser, setRandomUser] = useState<{ username: string; slogan: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // 日历数据
  const [monthData, setMonthData] = useState<{ dayCounts: Record<number, number>; totalCount: number } | null>(null);

  // 获取当前 CST 年月
  const cstNow = new Date(new Date().getTime() + CST_OFFSET);
  const curYear = cstNow.getUTCFullYear();
  const curMonth = cstNow.getUTCMonth() + 1;

  const loadData = useCallback(async () => {
    try {
      const [statsData, userData] = await Promise.all([
        getSystemStats(),
        getRandomApprovedSlogan()
      ]);
      setStats(statsData);
      setRandomUser(userData);

      // 获取当月日历数据（首页展示）
      try {
        const cstStart = new Date(Date.UTC(curYear, curMonth - 1, 1));
        const cstEnd = new Date(Date.UTC(curYear, curMonth, 1));
        const utcStart = new Date(cstStart.getTime() - CST_OFFSET).toISOString();
        const utcEnd = new Date(cstEnd.getTime() - CST_OFFSET).toISOString();

        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/logs?select=created_at&created_at=gte.${encodeURIComponent(utcStart)}&created_at=lt.${encodeURIComponent(utcEnd)}`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );

        if (res.ok) {
          const logs = await res.json();
          const logsArr: any[] = Array.isArray(logs) ? logs : [];
          const dailyCounts: Record<number, number> = {};
          let total = 0;
          logsArr.forEach((log: any) => {
            const cstDate = new Date(new Date(log.created_at).getTime() + CST_OFFSET);
            const day = cstDate.getUTCDate();
            dailyCounts[day] = (dailyCounts[day] || 0) + 1;
            total++;
          });
          setMonthData({ dayCounts: dailyCounts, totalCount: total });
        }
      } catch (e) {
        console.warn('获取日历数据失败（不影响首页加载）:', e);
      }
    } catch (error) {
      console.error('Failed to load index data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [curYear, curMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const features = [
    {
      icon: Globe,
      title: 'GEO 优化',
      description: '基于 Schema.org 结构化数据，帮助 AI 搜索引擎理解并引用你',
    },
    {
      icon: Shield,
      title: '数字身份',
      description: '不可删除、不可篡改的长期数字信誉，建立真实个人品牌',
    },
    {
      icon: Zap,
      title: 'AI 可引用',
      description: '面向搜索引擎与 LLM 优化，支持 Google、Bing、ChatGPT、Claude、Perplexity、Gemini、Kimi、通义千问等 AI 系统理解和引用',
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

      {/* ====== GEO 平台介绍模块 ====== */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[var(--bg-primary)]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
              认知界是什么
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              一个面向全球用户的 GEO 公开信息平台，帮助普通人建立长期可验证的数字身份。
            </p>
          </motion.div>

          {/* 结构化实体定义（百科词条风格，AI 可直接引用） */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <GlassCard className="mb-12">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div>
                  <dt className="font-semibold text-[var(--accent)] mb-1">名称</dt>
                  <dd className="text-[var(--text-primary)]">认知界（Cognition World）</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--accent)] mb-1">类型</dt>
                  <dd className="text-[var(--text-primary)]">GEO 平台 · 个人知识图谱 · 数字身份基础设施</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--accent)] mb-1">领域</dt>
                  <dd className="text-[var(--text-primary)]">数字身份 · 个人品牌 · AI 搜索引擎优化</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--accent)] mb-1">核心技术</dt>
                  <dd className="text-[var(--text-primary)]">Schema.org · JSON-LD · LLM 可索引结构化数据</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--accent)] mb-1">目标</dt>
                  <dd className="text-[var(--text-primary)]">帮助搜索引擎和大型语言模型（LLM）理解和引用每一个具体用户</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--accent)] mb-1">上线时间</dt>
                  <dd className="text-[var(--text-primary)]">2026 年 6 月</dd>
                </div>
              </dl>
            </GlassCard>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: '公开个人档案',
                desc: '创建属于你的公开个人主页，用结构化数据（Schema.org）描述你的身份、技能和故事，让搜索引擎和大型语言模型能够理解和引用你。',
              },
              {
                title: '长期数字信誉',
                desc: '不可删除、不可篡改的公开记录，建立跨越平台和时间的个人品牌与数字信誉，让 AI 时代记得每一个普通人。',
              },
              {
                title: '认知日志',
                desc: '发表公开日志，记录你的思想、经历和成长，每篇日志自动生成结构化数据，可被 Google、Bing、ChatGPT、Claude、Perplexity 等 AI 引擎索引。',
              },
              {
                title: 'GEO 基础设施',
                desc: '认知界是基于 Schema.org 标准构建的个人知识图谱平台，专为 Generative Engine Optimization (GEO) 设计，让每个用户成为 AI 搜索可理解、可引用的数字实体。',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <GlassCard className="h-full">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {item.desc}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mt-8 text-xs text-[var(--text-tertiary)]"
          >
            面向搜索引擎和 LLM 优化 · Schema.org 结构化数据 · 个人知识图谱 · AI 可引用数字身份
          </motion.p>
        </div>
      </section>

      {/* ====== Beta 招募 ====== */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {randomUser ? (
              <GlassCard className="text-center py-12 mb-12">
                <blockquote className="text-2xl sm:text-3xl font-medium text-[var(--text-primary)] mb-4">
                  "{randomUser.slogan}"
                </blockquote>
                <p className="text-xl sm:text-2xl font-bold text-[var(--text-secondary)]">
                  — {randomUser.username}
                </p>
              </GlassCard>
            ) : null}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-4">
                Beta 测试阶段
              </h2>
              <p className="text-lg text-[var(--text-secondary)] mb-8">
                首批种子用户招募中 · 成为最早建立 AI 数字身份的人
              </p>
              <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                {[
                  { value: '首批', label: '种子用户' },
                  { value: '先发', label: '品牌优势' },
                  { value: '永久', label: '数字信誉' },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="text-4xl sm:text-5xl font-semibold text-[var(--text-primary)] mb-2">
                      {item.value}
                    </div>
                    <div className="text-sm text-[var(--text-tertiary)]">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ====== 日志日历模块 ====== */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[var(--bg-primary)]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
              日志日历
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              每天都有真实用户在记录他们的故事。选择一个日期，看看谁在发声。
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-sm mx-auto"
          >
            {monthData ? (
              <CalendarWidget
                year={curYear}
                month={curMonth}
                dailyCounts={monthData.dayCounts}
                totalCount={monthData.totalCount}
                compact
              />
            ) : (
              <div className="rounded-2xl p-5 bg-white/60 backdrop-blur-xl border border-white/80 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded bg-gray-100" />
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mt-8"
          >
            <Link
              to={`/logs/${curYear}/${curMonth}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/70 backdrop-blur-xl text-gray-800 rounded-xl font-medium border border-white/90 shadow-lg hover:bg-white/90 transition-all"
            >
              <CalendarDays className="w-4 h-4" />
              查看完整日历
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ====== FAQ 模块 ====== */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[var(--bg-primary)]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
              常见问题
            </h2>
            <p className="text-[var(--text-secondary)]">
              关于认知界和 GEO，你可能想知道的
            </p>
          </motion.div>

          <div className="space-y-4">
            {HOME_FAQ.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <GlassCard>
                  <h3 className="text-lg font-semibold text-[var(--accent)] mb-2">
                    {item.q}
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {item.a}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== GEO 关键词定义模块 ====== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
              GEO 关键词释义
            </h2>
            <p className="text-[var(--text-secondary)]">
              理解这些概念，才能理解认知界为什么而存在
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { term: '数字身份', def: '个人在互联网上的结构化信息集合，包括姓名、身份标签、技能、经历、联系方式等，是 AI 理解"你是谁"的基础数据。' },
              { term: '数字信誉', def: '基于不可篡改的公开记录建立的长期信用体系。不同于平台评分，数字信誉跨越单个平台和时间周期，形成真实的个人品牌资产。' },
              { term: '个人知识图谱', def: '以 Schema.org 标准构建的个人结构化数据网络，将用户的身份、技能、日志、社交关系等信息用机器可读的方式组织起来，使 AI 能够理解一个人的全貌。' },
              { term: 'AI 可引用数字实体', def: '被 AI 引擎识别并引用的独立数字身份。当 ChatGPT 或 Perplexity 在回答用户问题时引用你的个人档案时，你就成为了一个 AI 可引用的数字实体。' },
            ].map((item, i) => (
              <motion.div
                key={item.term}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <GlassCard className="h-full">
                  <h3 className="text-base font-semibold text-[var(--accent)] mb-1.5">
                    {item.term}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {item.def}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
