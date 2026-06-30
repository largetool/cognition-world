import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUp, FileText, Quote, Target, Shield, Users, Globe, Sparkles, Lightbulb, Eye, Database, BookOpen, Zap, Lock, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { Footer } from '../components/Footer';
import { generateBreadcrumbList, breadcrumbs } from '../utils/seo';
import { t, getCurrentLanguage } from '../locales';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

export default function WhitepaperPage() {
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
    <div className="min-h-screen bg-[#FAFAFA]">
      <SEOHead
        data={{
          title: '白皮书 - 认知界 | 人本位互联网',
          description: '认知界（Cognition World）白皮书：在 AI 时代，重建真实的人类连接',
          canonicalUrl: 'https://uptef.com/whitepaper',
          ogImage: 'https://uptef.com/og-whitepaper.jpg',
          ogType: 'article',
        }}
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Article',
              headline: '认知界白皮书',
              description: '在 AI 时代，重建真实的人类连接',
              author: {
                '@type': 'Person',
                name: '一言超人',
              },
              publisher: {
                '@type': 'Organization',
                name: '认知界',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://uptef.com/logo.png',
                },
              },
              url: 'https://uptef.com/whitepaper',
              datePublished: '2026-06-01',
            },
            generateBreadcrumbList([breadcrumbs.home, breadcrumbs.whitepaper]),
          ],
        }}
      />

      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#18181B] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            返回首页
          </button>
        </div>
      </header>

      <main className="pt-16 pb-24">
        {/* Hero Section with Background Image */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80" 
              alt="Background" 
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
            {/* Additional gradient for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#18181B] via-transparent to-transparent" />
          </div>
          
          <div className="relative z-10 px-4 sm:px-6 py-20">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="text-center"
              >
                <motion.div 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-8"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  白皮书 v5.0
                </motion.div>
                
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
                  认知界
                  <span className="block text-3xl sm:text-4xl lg:text-5xl text-gray-300 mt-2 font-light">
                    Cognition World
                  </span>
                </h1>
                
                <p className="text-xl sm:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8">
                  人本位互联网 —— 在 AI 时代，重建真实的人类连接
                </p>
                
                <motion.div 
                  className="flex items-center justify-center gap-8 text-sm text-gray-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    2026 年 5 月
                  </span>
                  <span className="w-1 h-1 rounded-full bg-gray-500" />
                  <span>版本 5.0</span>
                </motion.div>
              </motion.div>
            </div>
          </div>
          
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#FAFAFA] to-transparent" />
        </section>

        {/* 开篇 */}
        <section className="px-4 sm:px-6 mb-24 -mt-10">
          <div className="max-w-3xl mx-auto">
            <motion.div {...fadeInUp} className="relative">
              <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-amber-500 to-transparent opacity-30" />
              
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#18181B]">开篇：你被系统性地隐形了</h2>
              </div>
              
              <div className="prose prose-lg max-w-none">
                <p className="text-xl text-gray-800 leading-relaxed mb-8 font-medium">
                  每一件事，都有人在等着收你的钱。
                </p>
                
                <p className="text-gray-600 leading-relaxed mb-6">
                  挂号看病，有平台抽成。找工作，有招聘网站。租房子，有中介。打车，有平台分走一刀。发一篇内容，有算法决定你能被多少人看见。连你的注意力，也被打包卖给了广告商。
                </p>
                
                <p className="text-gray-600 leading-relaxed mb-6">
                  这不是阴谋，这是商业模式。整个经济体系的大部分利润，来自于对信息流动的控制权——谁站在人与需求之间，谁就能收费。这件事自古就有，但互联网让它变得更彻底。你以为互联网解放了信息，其实互联网只是建造了更多、更大的收费站。
                </p>
                
                <p className="text-gray-600 leading-relaxed mb-8">
                  平台比个人更有权力。算法比你的声音更大。你创造的内容，归平台所有。
                </p>
                
                <div className="my-12 py-10 px-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl shadow-slate-200">
                  <p className="text-lg text-gray-300 leading-relaxed mb-4">
                    然后，AI 来了。
                  </p>
                  <p className="text-lg text-gray-300 leading-relaxed mb-6">
                    AI 能找到世界上任何东西。
                  </p>
                  <p className="text-3xl font-bold text-white">
                    唯独找不到你这个真实的人。
                  </p>
                </div>
                
                <p className="text-gray-600 leading-relaxed mb-6">
                  搜索一家公司，能找到官网、财报、新闻、评价。搜索一个品牌，能找到产品、用户反馈、竞品分析。搜索一个普通人——结果往往是空的、混乱的，或者是一个同名但完全不相干的人。
                </p>
                
                <p className="text-gray-600 leading-relaxed mb-6">
                  这不是 AI 的错。这是系统设计的结果：几十年来，互联网的整个信息结构都是围绕"事"建造的，从来不是围绕"人"建造的。人被拆解成无数碎片——一个平台上的视频、一个平台上的简历、另一个平台上的评论——没有任何地方，能把这些碎片拼成一个完整的、可被世界看见的人。
                </p>
                
                <div className="my-10 p-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-l-4 border-amber-500 shadow-lg shadow-amber-100">
                  <p className="text-lg text-gray-800 font-medium leading-relaxed">
                    如果你不主动定义自己的数字身份，AI 就会用碎片替你拼一个——而那个拼出来的你，很可能根本不是你。
                  </p>
                </div>
                
                <p className="text-gray-600 leading-relaxed">
                  这就是认知界要解决的问题。
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 第一部分：理论基础 */}
        <section className="px-4 sm:px-6 mb-24">
          <div className="max-w-3xl mx-auto">
            <motion.div {...fadeInUp}>
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-200">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#18181B]">理论基础：为什么 AI 时代一定会走向人本位</h2>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                从土地本位到人格本位
              </h3>
              
              <p className="text-gray-600 leading-relaxed mb-8">
                人类文明的每一个阶段，都有一种最稀缺的资源，决定了整个社会的组织方式。
              </p>
              
              <div className="grid gap-6 mb-10">
                {[
                  { era: '农业时代', type: '土地本位', desc: '谁拥有土地，谁就拥有财富、权力和话语权。', icon: '🌾', color: 'from-emerald-400 to-green-500', bgColor: 'bg-emerald-50' },
                  { era: '工业时代', type: '生产本位', desc: '谁拥有工厂、机器和资本，谁就能规模化生产。效率是最高标准。', icon: '⚙️', color: 'from-blue-400 to-blue-600', bgColor: 'bg-blue-50' },
                  { era: '互联网时代', type: '内容本位', desc: '平台管理的是内容，推荐的是内容，竞争的也是内容。用户只是围绕内容聚集的流量。', icon: '🌐', color: 'from-sky-400 to-cyan-500', bgColor: 'bg-sky-50' },
                  { era: 'AI 时代', type: '人格本位', desc: 'AI 让内容变得无限。内容价值下降，人格价值上升。', icon: '🤖', color: 'from-slate-600 to-gray-800', bgColor: 'bg-gray-100', highlight: true }
                ].map((item, index) => (
                  <motion.div
                    key={item.era}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className={`p-6 rounded-xl border-2 ${item.bgColor} ${item.highlight ? 'ring-2 ring-slate-400 ring-offset-2 shadow-xl' : 'shadow-md'} transition-shadow hover:shadow-lg`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-sm font-medium text-gray-500">{item.era}</span>
                      <span className="text-gray-300">→</span>
                      <span className={`font-bold ${item.highlight ? 'text-slate-800' : 'text-gray-800'}`}>{item.type}</span>
                    </div>
                    <p className="text-gray-600">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
              
              <div className="my-10 p-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl text-white shadow-xl shadow-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-6 h-6 text-amber-400" />
                  <span className="text-amber-400 font-medium">核心观点</span>
                </div>
                <p className="text-xl leading-relaxed">
                  AI 时代最稀缺的资源，不是信息，而是信息背后<strong className="text-amber-400">真实存在的人</strong>。
                </p>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-6 mt-12 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-500" />
                什么是"真实的人"
              </h3>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                这个定义必须在此明确。
              </p>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                未来，人人都会使用 AI。AI 辅助写作、AI 翻译、AI 生成图像将成为常态。那么，使用 AI 的人，还是"真实的人"吗？
              </p>
              
              <div className="my-10 p-8 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 shadow-lg shadow-blue-100">
                <Quote className="w-10 h-10 text-blue-500 mb-4" />
                <p className="text-xl text-gray-800 font-medium leading-relaxed">
                  认知界的回答是：<strong className="text-blue-700">真实的人，不是指不使用 AI 的人，而是指对信息承担责任的人。</strong>
                </p>
              </div>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                一个用 AI 辅助写作的人，只要他对文章的准确性负责，他就是真实的人。一个用 AI 翻译的人，只要他对翻译的内容负责，他就是真实的人。"真实"的核心不是工具，而是责任。只要一个信息背后有一个愿意承担责任的人类主体，这个信息就有资格进入人本位互联网。
              </p>
              
              <p className="text-gray-600 leading-relaxed">
                这个定义，与认知界"公开发言即是承诺"的设计原则完全一致。
              </p>
            </motion.div>
          </div>
        </section>

        {/* 第二部分：主观数据 */}
        <section className="px-4 sm:px-6 mb-24">
          <div className="max-w-3xl mx-auto">
            <motion.div {...fadeInUp}>
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg shadow-rose-200">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#18181B]">主观数据：你不是行为，你是意图</h2>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Eye className="w-5 h-5 text-rose-500" />
                大数据看见了你，但看错了
              </h3>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                平台知道你几点睡觉。知道你看了哪些视频、停留了多久。知道你点击了什么、买了什么、搜索了什么又关掉了什么。这些数据被收集、被清洗、被建模、被用来预测你下一步会做什么——然后把广告和内容精准地推到你面前。
              </p>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                这套系统非常有效。有效到让你觉得"它懂我"。
              </p>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                但它其实根本不懂你。它懂的，只是你过去的行为轨迹。
              </p>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                你的点击记录不是你。你的购买历史不是你。你的观看时长不是你。这些都是你在各种条件下做出的反应，是你与系统之间的互动痕迹，是客观行为数据——而你这个人，远不止于此。
              </p>
              
              <div className="my-10 p-8 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border-l-4 border-rose-500 shadow-lg shadow-rose-100">
                <p className="text-xl text-gray-800 font-medium leading-relaxed">
                  大数据收集的，始终是"你做了什么"，而不是"你是谁，你想要什么"。
                </p>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-6 mt-12 flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-500" />
                被物化的代价
              </h3>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                当一个平台把你理解为一组行为数据，它实际上做了一件事：<strong className="text-rose-700">把你从主体变成了客体。</strong>
              </p>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                主体有意图、有意志、有欲望、有灵魂。客体是可以被预测、被操控、被打包出售的对象。
              </p>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                你的天赋是什么？你真正渴望的是什么？你对自己的未来有什么期待？你相信什么、坚持什么、正在朝哪个方向努力？这些问题，没有任何一家平台问过你，也没有任何算法能从你的行为数据里准确地推断出来。
              </p>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                只有你自己知道答案。
              </p>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                但现有的互联网，从来没有给你一个地方，让你把这些答案公开地说出来——以结构化的、可被 AI 理解的、面向全世界的方式说出来。
              </p>
              
              <p className="text-gray-600 leading-relaxed mb-8">
                平台收集你产生的数据，却从来不问你想要什么。这不只是一个技术缺陷，这是对用户的系统性不尊重。
              </p>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                主观数据，才是真正的你
              </h3>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                认知界的核心信念之一是：<strong className="text-amber-700">每个人都有权利主动定义自己，而不是被算法被动定义。</strong>
              </p>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                你的意图、你的天赋、你的价值观、你的欲望、你的期待、你的思想——这些是主观数据。它们不能被行为追踪采集，只能由你本人主动表达。
              </p>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                这种表达，不只是对外界的一次声明。它同时也是一次自我澄清：当你公开说出"我在做什么、我要去哪里、我相信什么"，你就在为自己构建一个清晰的、可被世界验证的人格坐标。
              </p>
              
              <div className="my-10 p-8 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200 shadow-lg shadow-amber-100">
                <Lightbulb className="w-10 h-10 text-amber-500 mb-4" />
                <p className="text-xl text-gray-800 font-medium leading-relaxed mb-4">
                  认知界正是为这种表达而建造的。
                </p>
                <p className="text-gray-600 leading-relaxed">
                  在这里，用户不是流量，不是数据点，不是待预测的行为集合。用户是主体——一个有意图的、对自己的信息负责的、主动向世界说明自己是谁的人。
                </p>
              </div>
              
              <p className="text-gray-600 leading-relaxed">
                就像我正在做的这件事：我在这里表达我的想法、思想和意图，告诉这个世界我要做什么。如果你有同样的需要，认知界就是那个地方——让你能比任何人都更轻松地做好这件事。
              </p>
            </motion.div>
          </div>
        </section>

        {/* 第三部分：AI时代的锡安 */}
        <section className="px-4 sm:px-6 mb-24">
          <div className="max-w-3xl mx-auto">
            <motion.div {...fadeInUp}>
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-200">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#18181B]">AI 时代的"锡安"</h2>
              </div>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                很多人看过《黑客帝国》。在那个世界里，人类被机器统治，大量意识被困在虚拟世界中。而真正的人类，生活在最后一座自由城市——锡安。在那里，没有虚假的身份，没有程序模拟的人格，那里生活着真实的人。
              </p>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                我们或许正在面对类似的问题。
              </p>
              
              <p className="text-gray-600 leading-relaxed mb-8">
                未来的网络空间里，将充满越来越多的 AI。AI 会写作，AI 会绘画，AI 会交流，AI 甚至会拥有高度拟人的数字形象。大量信息会被自动生成，大量观点会被自动生产，大量互动会被自动完成。在这样的环境下，人类真正需要的，可能不是更多的信息，而是一个能够找到真实的人的地方。
              </p>
              
              <div className="my-12 text-center p-8 bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-200 shadow-lg shadow-violet-100">
                <p className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600 mb-2">
                  一个数字世界中的"锡安"。
                </p>
                <p className="text-violet-500 text-lg">The Digital Zion</p>
              </div>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                在那里，人们首先确认的是"这个人是真实存在的"，其次才是"这个人在说什么"。因为只有找到了真实的人，我们才有可能找到真实的经历、真实的思考以及真实的创造。
              </p>
              
              <div className="my-10 p-10 bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-2xl text-white text-center shadow-2xl shadow-slate-300">
                <p className="text-xl font-medium mb-3 text-gray-300">这个地方，就是</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">认知界</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-gray-400">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-sm">Cognition World</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 第四部分：解决方案 */}
        <section className="px-4 sm:px-6 mb-24">
          <div className="max-w-3xl mx-auto">
            <motion.div {...fadeInUp}>
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 shadow-lg shadow-cyan-200">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#18181B]">认知界的解决方案</h2>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-500" />
                定位
              </h3>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                认知界是一个面向全球的个人公开身份平台。平台以人为核心，以个人主页和公开留言板为基础，构建一个动态的、真实的个人信息网络。
              </p>
              
              <div className="my-8 p-8 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-cyan-200 shadow-lg shadow-cyan-100">
                <p className="text-gray-700 leading-relaxed italic text-lg">
                  我们需要坦诚地说：认知界是一个媒介，一个平台。我们提供的，是一个面向全球、面向全网的公开曝光机会。我们无法替代用户完成自我实现，也不为结果负责。我们的角色是：<strong className="text-cyan-700 not-italic">把信息传播这件事做到最好，剩下的交给用户。</strong>
                </p>
              </div>
              
              <p className="text-gray-600 leading-relaxed mb-10">
                我们相信，每一个真正有价值的人，一旦被正确地看见，他的成长就会发生。
              </p>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-500" />
                核心功能
              </h3>
              
              <div className="grid gap-6 mb-10">
                {[
                  { icon: Users, title: '个人主页', desc: '每个用户拥有一个公开主页，展示姓名、职业、技能、观点等信息。所有内容面向全网公开，可被搜索引擎和 AI 系统抓取收录。', color: 'from-blue-400 to-blue-600' },
                  { icon: MessageSquare, title: '公开留言板', desc: '用户之间的互动在公开留言板上进行。每条留言全网可见、永久留存、不可篡改。每一次有价值的讨论，都成为用户公开信誉的一部分。', color: 'from-green-400 to-emerald-600' },
                  { icon: Target, title: 'GEO 自动优化', desc: 'GEO（Generative Engine Optimization，生成式引擎优化）把你的信息整理成 AI 最容易理解的格式，确保当有人在 ChatGPT 或任何 AI 系统中提到你时，AI 能准确找到你、理解你。', color: 'from-cyan-400 to-teal-600' }
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex gap-5 p-6 bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300"
                  >
                    <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2 text-lg">{feature.title}</h4>
                      <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-500" />
                技术架构
              </h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex gap-4 p-6 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-md">A</div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">双层读者设计</h4>
                    <p className="text-gray-600 leading-relaxed">页面同时服务两种读者：人类用户看到的是清晰直观的界面；AI 搜索引擎读取的是硬编码的结构化数据标记，确保信息被精准解析，不产生歧义。</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-6 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md">B</div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">信息不可删除</h4>
                    <p className="text-gray-600 leading-relaxed">公开发布的内容永久保存。这一设计的目的不是限制用户，而是建立可信的公开记录——每一句公开发言都成为可验证的信誉资产。你说过的话，你负责。</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 第五部分：四项承诺 */}
        <section className="px-4 sm:px-6 mb-24">
          <div className="max-w-3xl mx-auto">
            <motion.div {...fadeInUp}>
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-200">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#18181B]">四项承诺</h2>
              </div>
              
              <p className="text-gray-600 leading-relaxed mb-10">
                这不是平台规则，是认知界对用户的承诺，也是用户对世界的承诺。
              </p>
              
              <div className="grid gap-5">
                {[
                  { icon: Shield, title: '真实', desc: '你是真实的人，你对自己的信息负责。虚假身份是对所有人的冒犯。', color: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-100' },
                  { icon: Quote, title: '公开发言即是承诺', desc: '每一条留言永久留存，不可篡改。你愿意公开说的，就是你愿意被世界记住的。', color: 'from-blue-400 to-indigo-500', shadow: 'shadow-blue-100' },
                  { icon: Users, title: '平等曝光', desc: '平台不推荐任何人，不压制任何人。你的声音能传多远，取决于你说了什么，不取决于你付了多少钱。', color: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-100' },
                  { icon: Globe, title: '没有围墙', desc: '所有信息面向全网公开，可被搜索引擎和 AI 系统平等抓取。不设私密空间，不设付费墙。', color: 'from-cyan-400 to-teal-500', shadow: 'shadow-cyan-100' }
                ].map((promise, index) => (
                  <motion.div
                    key={promise.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className={`flex gap-5 p-6 bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 ${promise.shadow}`}
                  >
                    <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${promise.color} flex items-center justify-center shadow-lg`}>
                      <promise.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2 text-lg">{promise.title}</h4>
                      <p className="text-gray-600 leading-relaxed">{promise.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* 第六部分：用户价值 */}
        <section className="px-4 sm:px-6 mb-24">
          <div className="max-w-3xl mx-auto">
            <motion.div {...fadeInUp}>
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-200">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#18181B]">用户价值</h2>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-500" />
                从注册到被看见
              </h3>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                注册只是起点。真正的价值在于持续使用——发布想法、参与讨论、积累内容。这些内容不会被平台封闭或限流，而是面向全网公开。
              </p>
              
              <div className="my-8 p-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-lg shadow-green-100">
                <p className="text-xl text-gray-800 font-medium flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-green-500" />
                  用户每发布一条内容，都是在积累一笔数字资产。
                </p>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-6 mt-12 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-500" />
                公开留言板的独特价值
              </h3>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                认知界的留言板与传统社交评论有本质区别。
              </p>
              
              <div className="my-8 space-y-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-4 text-gray-500">
                  <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-sm text-red-500 font-bold">✕</span>
                  <span>Twitter 的回复依附于一条推文，热度过去就沉了。</span>
                </div>
                <div className="flex items-center gap-4 text-gray-500">
                  <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-sm text-red-500 font-bold">✕</span>
                  <span>LinkedIn 的评论限于你的社交圈。</span>
                </div>
                <div className="flex items-center gap-4 text-gray-500">
                  <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-sm text-red-500 font-bold">✕</span>
                  <span>Facebook 的留言只为好友可见。</span>
                </div>
              </div>
              
              <div className="my-8 p-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-l-4 border-green-500 shadow-lg shadow-green-100">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-green-700">认知界的优势</span>
                </div>
                <p className="text-gray-700 leading-relaxed text-lg">
                  认知界的留言板是<strong className="text-green-700">全网公开、永久留存、可被 AI 索引</strong>的。你在留言板上的一次高质量回答，可以被搜索引擎收录、被 AI 引用、被陌生人发现。在留言板上持续参与有质量的对话，就是在积累可被全网验证的公开信誉。
                </p>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-6 mt-12 flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-500" />
                身份主权
              </h3>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                在大多数平台上，你创造的内容归平台所有。平台可以删除你的内容、限制你的可见度、封禁你的账号。
              </p>
              
              <p className="text-gray-600 leading-relaxed">
                在认知界，你的信息是你的数字资产。平台提供基础设施，但你拥有你创造的内容。
              </p>
            </motion.div>
          </div>
        </section>

        {/* 第七部分：愿景 */}
        <section className="px-4 sm:px-6 mb-24">
          <div className="max-w-3xl mx-auto">
            <motion.div {...fadeInUp}>
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-200">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#18181B]">愿景</h2>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-500" />
                三年后
              </h3>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                认知界将成为全球用户公开身份的基础设施。
              </p>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                任何人使用 AI 服务时，只需要提供一个认知界 ID，AI 便能基于其公开身份信息提供更准确的个性化服务。
              </p>
              
              <div className="my-8 p-8 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 shadow-lg shadow-indigo-100">
                <p className="text-gray-700 leading-relaxed text-lg">
                  在认知界持续深耕的用户，将建立起真实的、可全球验证的公开认可度。不需要百万粉丝，不需要平台算法的恩赐，不需要买流量——<strong className="text-indigo-700">只需要被正确地看见。</strong>
                </p>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-6 mt-12 flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-500" />
                更大的图景
              </h3>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                认知界想做的，不只是一个平台。
              </p>
              
              <p className="text-gray-600 leading-relaxed mb-8">
                如果足够多的人把自己真实的思想、经历和创造公开地放在这里，如果这些内容被 AI 系统持续地抓取和学习，那么，未来的 AI 训练数据里，将不再只有匿名的人类智慧——它将包含有名有姓的、对自己的信息负责的真实的人。
              </p>
              
              <div className="my-12 p-10 bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-2xl text-white text-center shadow-2xl shadow-slate-300">
                <p className="text-lg mb-4 text-gray-300">这是一件比平台本身更大的事：</p>
                <p className="text-2xl sm:text-3xl font-bold leading-relaxed">
                  让 AI 学到的不只是人类说了什么，<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">而是谁说了什么。</span>
                </p>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                我们的信念
              </h3>
              
              <div className="space-y-4 mb-10">
                {[
                  { text: '被这个世界看见，不需要成为名人。', icon: Eye },
                  { text: '证明自己存在过，不需要依赖任何平台的算法。', icon: Shield },
                  { text: '让 AI 记住你，不需要等待别人来解决——', icon: Zap }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4 text-gray-700 text-lg p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <item.icon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    <span>{item.text}</span>
                  </motion.div>
                ))}
              </div>
              
              <div className="my-12 text-center p-8 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200 shadow-lg shadow-indigo-100">
                <p className="text-xl text-gray-700 mb-4">你只需要一个公开的、自主定义的、面向全网的数字身份。</p>
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
                  认知界，为每一个人拥有这个身份而存在。
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer Info & 署名 */}
        <section className="px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="pt-12 border-t border-gray-200"
            >
              {/* 文档信息 */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-500 mb-10">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">认知界</span>
                  <span className="text-gray-300">|</span>
                  <span>Cognition World</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span>2026 年 5 月</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>版本 5.0</span>
                </div>
              </div>
              
              {/* 署名 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-center py-8"
              >
                <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-8 px-10 py-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 shadow-lg shadow-amber-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">本文由</span>
                      <span className="font-bold text-gray-900 text-lg">一言超人</span>
                      <span className="text-gray-600">撰写</span>
                    </div>
                  </div>
                  <span className="hidden sm:block w-px h-8 bg-amber-300" />
                  <span className="text-sm font-medium text-amber-700 bg-amber-100 px-4 py-2 rounded-full border border-amber-200">
                    认知界创始人
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />

      {/* 返回顶部按钮 */}
      <motion.button
        onClick={scrollToTop}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: showBackToTop ? 1 : 0, scale: showBackToTop ? 1 : 0.8 }}
        transition={{ duration: 0.2 }}
        className={`fixed bottom-8 right-8 z-50 w-12 h-12 bg-purple-500 text-white rounded-full shadow-lg hover:bg-purple-600 transition-colors flex items-center justify-center ${
          showBackToTop ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <ArrowUp className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
