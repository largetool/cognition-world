import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, ArrowUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { Footer } from '../components/Footer';
import { generateBreadcrumbList, breadcrumbs } from '../utils/seo';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <SEOHead
        data={{
          title: '隐私政策 - 认知界',
          description: '认知界隐私政策：了解我们如何保护您的数据，不收集隐私，只传递您愿意公开的信息',
          keywords: ['隐私政策', '数据保护', '认知界', 'Cognition World', '隐私说明'],
          ogType: 'article',
          ogImage: 'https://cognitionworld.com/og-image.png',
          canonicalUrl: 'https://cognitionworld.com/privacy',
        }}
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Article',
              headline: '认知界（Cognition World）隐私政策',
              description: '认知界不收集你的隐私。你来这里，是为了公开地存在。',
              author: {
                '@type': 'Organization',
                name: '认知界',
              },
              publisher: {
                '@type': 'Organization',
                name: '认知界',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://cognitionworld.com/logo.png',
                },
              },
              datePublished: '2026-05-01',
              dateModified: '2026-05-01',
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': 'https://cognitionworld.com/privacy',
              },
            },
            generateBreadcrumbList([breadcrumbs.home, breadcrumbs.privacy]),
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
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
              认知界（Cognition World）隐私政策
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              最后更新：2026年5月
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-[var(--bg-secondary)] rounded-2xl p-8 sm:p-12"
          >
            <div className="prose prose-slate max-w-none">
              {/* 一句话总结 - 使用紫色主题 */}
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 mb-10">
                <h2 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  一句话总结
                </h2>
                <p className="text-purple-700 leading-relaxed">
                  认知界不收集你的隐私。你来这里，是为了公开地存在。你只在这里发布想让世界看到的信息。你不公开的东西，我们不想知道。
                </p>
              </div>

              <hr className="my-10 border-gray-100" />

              {/* 第一节 */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                  认知界是什么——不是什么
                </h2>
                
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                    <p className="text-emerald-800 font-semibold mb-2 flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> 认知界是
                    </p>
                    <p className="text-emerald-700 text-sm leading-relaxed">
                      一个让你向全网公开自己的地方。你在这里发布的所有信息，目的就是被世界看见。
                    </p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                    <p className="text-gray-800 font-semibold mb-2 flex items-center gap-2">
                      <span className="text-gray-400">✗</span> 认知界不是
                    </p>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      一个存你隐私的地方。你的身份证号、银行卡号、家庭住址、病历、私密照片——这些不应该发在这里。
                    </p>
                  </div>
                </div>
                
                <p className="text-[var(--text-secondary)] text-center italic">
                  你的隐私你负责，我们只负责把你愿意公开的信息传递出去。
                </p>
              </section>

              <hr className="my-10 border-gray-100" />

              {/* 第二节 */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                  我们处理什么信息
                </h2>
                
                <div className="space-y-6">
                  <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                      你主动公开的信息
                    </h3>
                    <p className="text-[var(--text-secondary)] mb-3">
                      你在认知界上发布的所有内容——个人主页资料、动态、留言——都是<strong className="text-purple-600">公开信息</strong>，面向全网可见。搜索引擎和 AI 系统可以自由抓取和索引这些内容。
                    </p>
                    <p className="text-purple-600 font-medium text-sm">这是你来认知界的目的。</p>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                      我们保存的非公开信息
                    </h3>
                    <p className="text-[var(--text-secondary)] mb-3">以下信息仅用于平台运营，不对外公开：</p>
                    <ul className="space-y-2 text-[var(--text-secondary)]">
                      <li className="flex items-start gap-3">
                        <span className="text-purple-400 mt-1">•</span>
                        <span><strong>邮箱地址：</strong>用于登录、密码重置、平台通知</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-purple-400 mt-1">•</span>
                        <span><strong>基本访问日志：</strong>IP 地址、浏览器类型、访问时间，用于安全防护</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                      我们不收集的
                    </h3>
                    <ul className="grid sm:grid-cols-2 gap-2 text-purple-700 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="text-purple-300">—</span> 政府签发的身份标识
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-purple-300">—</span> 银行卡号、金融账户信息
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-purple-300">—</span> 精确地理位置
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-purple-300">—</span> 通讯录、社交关系链
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-purple-300">—</span> 健康或医疗信息
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-purple-300">—</span> 生物识别信息
                      </li>
                    </ul>
                    <div className="mt-4 pt-4 border-t border-purple-100">
                      <p className="text-purple-800 font-medium text-center">
                        原则很简单：你不公开的东西，我们不想知道。
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <hr className="my-10 border-gray-100" />

              {/* 第三节 */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">3</span>
                  信息保存多久
                </h2>
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                  <ul className="space-y-4">
                    <li className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-500 text-lg">∞</span>
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">你发布的公开内容</p>
                        <p className="text-[var(--text-secondary)] text-sm">永久保存。这是"不可删除"原则的体现</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-500 text-lg">@</span>
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">邮箱地址</p>
                        <p className="text-[var(--text-secondary)] text-sm">随账户永久保存（账户不可注销）</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-500 text-lg">🗑</span>
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">日志信息</p>
                        <p className="text-[var(--text-secondary)] text-sm">定期自动清理</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </section>

              <hr className="my-10 border-gray-100" />

              {/* 第四节 */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">4</span>
                  我们不做什么
                </h2>
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      '不向第三方出售任何数据',
                      '不使用定向广告',
                      '不分析你的行为偏好以推送内容',
                      '不建立用户商业画像',
                      '不追踪你在其他网站的活动'
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                          ✓
                        </span>
                        <span className="text-[var(--text-secondary)] text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <hr className="my-10 border-gray-100" />

              {/* 第五节 */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">5</span>
                  安全风险
                </h2>
                <p className="text-[var(--text-secondary)] mb-4">
                  由于认知界本质上只处理公开信息，安全风险与传统平台有本质区别：
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <span className="text-emerald-500 text-xl">✓</span>
                    <div>
                      <p className="font-semibold text-emerald-800">你公开发布的内容</p>
                      <p className="text-emerald-700 text-sm">本就面向全网可见，不存在"被泄露"一说</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <span className="text-amber-500 text-xl">!</span>
                    <div>
                      <p className="font-semibold text-amber-800">非公开信息泄露风险</p>
                      <p className="text-amber-700 text-sm">我们需要保护的非公开信息仅包括邮箱地址和密码哈希值。我们使用 Supabase 提供的标准安全措施保护这些信息。如果发生非公开信息数据泄露，我们将第一时间通过邮件通知你</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <span className="text-gray-500 text-xl">🔒</span>
                    <div>
                      <p className="font-semibold text-gray-800">密码安全</p>
                      <p className="text-gray-600 text-sm">请使用强密码，平台不承担因密码泄露导致的账户被他人访问的责任</p>
                    </div>
                  </div>
                </div>
              </section>

              <hr className="my-10 border-gray-100" />

              {/* 第六节 */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">6</span>
                  你的权利
                </h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm text-center">
                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-purple-500 text-xl">✎</span>
                    </div>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-2">修改权</h3>
                    <p className="text-[var(--text-secondary)] text-sm">你可以随时修改个人资料。留言板消息在发布后有短暂的修改窗口，超时后不可修改</p>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm text-center">
                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-purple-500 text-xl">👁</span>
                    </div>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-2">隐藏权</h3>
                    <p className="text-[var(--text-secondary)] text-sm">你可以申请隐藏账户（详见用户协议"账户隐藏规则"）</p>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm text-center">
                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-purple-500 text-xl">∞</span>
                    </div>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-2">永久公开权</h3>
                    <p className="text-[var(--text-secondary)] text-sm">你在认知界发布的内容将被永久保存。你说过的话，你负责；你创造的价值，永不过期</p>
                  </div>
                </div>
              </section>

              <hr className="my-10 border-gray-100" />

              {/* 第七节 */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">7</span>
                  联系我们
                </h2>
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                        <span className="text-purple-500">@</span>
                      </div>
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">邮箱</p>
                        <p className="font-medium text-[var(--text-primary)]">contact@uptef.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                        <span className="text-purple-500">💬</span>
                      </div>
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">站内留言板</p>
                        <p className="font-medium text-[var(--text-primary)]">登录后发送消息</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <hr className="my-10 border-gray-100" />

              {/* 结语 */}
              <section className="mb-10">
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 text-center">
                  <p className="text-purple-800 leading-relaxed">
                    认知界不处理你的隐私。你的隐私你自己管。我们只做一件事：把你愿意公开的信息，以最好的方式传递给世界。
                  </p>
                </div>
              </section>

              <hr className="my-10 border-gray-100" />

              {/* 页脚 */}
              <footer className="text-center pt-4">
                <p className="text-xl font-bold text-[var(--text-primary)] mb-2">认知界（Cognition World）</p>
                <p className="text-sm text-[var(--text-secondary)]">本文由 一言超人 撰写</p>
                <p className="text-sm text-[var(--text-secondary)]">认知界创始人</p>
              </footer>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
