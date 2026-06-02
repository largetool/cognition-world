import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, ArrowUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { Footer } from '../components/Footer';
import { APP_CONFIG } from '../types';
import { generateBreadcrumbList, breadcrumbs } from '../utils/seo';

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <SEOHead
        data={{
          title: '关于我们 - 认知界',
          description: '了解认知界团队',
        }}
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            generateBreadcrumbList([breadcrumbs.home, breadcrumbs.about]),
          ],
        }}
      />

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
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-indigo-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
              关于认知界
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              一个让世界认识你的地方。
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
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">这件事是怎么开始的</h2>
                <p className="text-[var(--text-secondary)] mb-4">我做了两年自媒体。</p>
                <p className="text-[var(--text-secondary)] mb-4">知乎、抖音、快手、视频号、公众号——全部试过。两年下来，知乎积累了 1300 多个关注者，视频平台加起来不到 500。我不是没有内容，不是没有观点。但平台的算法决定了谁能被看见，而规则不由我定。</p>
                <p className="text-[var(--text-secondary)] mb-4">同一时间，我发现另一件事：企业可以花几十块钱买一个搜索点击，让自己的信息被看见。这门生意存在了二十多年——从 SEO（搜索引擎优化）到 GEO（生成式引擎优化），一直有人在用。但它始终是商用的，从来没有为民用存在过。</p>
                <p className="text-[var(--text-secondary)] font-medium mb-4">个人SEO、个人GEO——让普通人也能像企业一样被搜到。这就是认知界在做的事情。</p>
                <p className="text-[var(--text-secondary)] font-medium mb-4">企业能被搜索到，普通人不能。这就很奇怪了。</p>
                <p className="text-[var(--text-secondary)] mb-4">我的初衷其实更简单。我想做一个应用，帮人们从"用 AI 对话"跨越到"用 AI 创造"——GitHub 的门槛对大多数人来说太高了。但推演下去，我意识到一个更深的问题：帮助我们认知这个世界的系统太多了，你手机里几乎每一个 APP 都在做这件事。反过来，让这个世界认识我们的系统呢？社交媒体在做，但它们在封闭的生态里做——你的信息出不去，搜索引擎搜不到，AI 引用不了。</p>
                <p className="text-[var(--text-secondary)] font-medium mb-4">我要的不是内卷的流量，是公正的可见。</p>
                <p className="text-[var(--text-secondary)]">如果现有的平台不提供这个东西，那就自己建一个。我需要它，所以我去做它。如果别人也需要，那就更好。</p>
              </section>

              <hr className="my-8 border-gray-200" />

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">关于我</h2>
                <p className="text-[var(--text-secondary)] mb-4">我叫<strong>一言超人</strong>。</p>
                <p className="text-[var(--text-secondary)] mb-4">这个名字来自一次和平台的对抗。知乎曾经有一个规则，回答必须超过 100 字。但很多问题在我看来，一句话就能说清楚——直达本质，不必啰嗦。刚好有一部日本动漫叫《一拳超人》，于是就有了"一言超人"。</p>
                <p className="text-[var(--text-secondary)] mb-4">我是一个超级跨界者。我的工作和互联网、IT、大厂没有任何关系。我在一个公园里上班，之前做过金融交易和数字货币。但我一直想做一件事：<strong>成为一个创造价值的人。</strong></p>
                <p className="text-[var(--text-secondary)] mb-4">ChatGPT 爆发那一年，我开始学习使用 AI，结合心理学技术去探索想法、开发项目。在这个过程中，我开发了一套关于人类成长的体系——但我没有公司，没有投资，推广的时候也遭遇过冷场。所以我决定做一个落地的东西：一个看得见、用得上的平台，来测试我的想法究竟有没有力量。</p>
                <p className="text-[var(--text-secondary)]">认知界，就是这个落地的项目。</p>
              </section>

              <hr className="my-8 border-gray-200" />

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">我们相信什么</h2>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">人本位，不是事本位</h3>
                <p className="text-[var(--text-secondary)] mb-4">"人本位"这个词，来自我对互联网发展方向的反思。</p>
                <p className="text-[var(--text-secondary)] mb-4">整个互联网是按照"事本位"构建的——平台管理的是内容，推荐的是内容，竞争的也是内容。人被拆成碎片：一个平台上的视频，一个平台上的简历，一个平台上的评论。没有一个地方，能把这些碎片拼回一个完整的人。</p>
                <p className="text-[var(--text-secondary)] mb-4">而 AI 的到来，让"内容"本身不再稀缺——任何人都可以用 AI 在几秒钟内生成一篇文章。未来最稀缺的，不是内容，而是<strong>内容背后真实的人</strong>。</p>
                <p className="text-[var(--text-secondary)] mb-4">我的导师，中国 NLP 教父李中莹先生，有一套理论叫"人生拓扑图"，把每个人连接的世界分为了人、事、物三个部分。我把这套理论推演了一步：事其实是人和人、人和物之间的中间状态，本质上只有两个部分——人，和物。</p>
                <p className="text-[var(--text-secondary)]">今天的人工智能正朝着"物理世界模型"的方向进化——它理解物理规律，理解物体，理解客观世界。但它不理解每一个具体的人。真正强大的 AGI，除了是一个物理世界模型，还应该是一个<strong>社会模型</strong>：知道每一个具体的人是谁，他的经历、他的观点、他创造过什么。当 AI 能理解社会结构，人和人之间的六度分割就会进化为一度分割——那"一"，就是 AI。</p>

                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3 mt-8">主观数据，才是真正的你</h3>
                <p className="text-[var(--text-secondary)] mb-4">主流平台收集的是你的行为轨迹——几点睡觉、看了什么视频、在哪个页面停留了多久、点了什么又关掉了什么。这些数据被洗、被建模、被用来预测你下一步会做什么，然后把内容精准地推到你面前。</p>
                <p className="text-[var(--text-secondary)] mb-4">这套系统有效，但它根本不懂你。它懂的，只是你的行为轨迹。你的点击记录不是你，你的购买历史不是你，你的观看时长不是你。</p>
                <p className="text-[var(--text-secondary)] font-medium mb-4">大数据收集的，始终是"你做了什么"，而不是"你是谁，你想要什么"。</p>
                <p className="text-[var(--text-secondary)] mb-4">你的天赋是什么？你真正渴望的是什么？你相信什么、坚持什么、正在朝什么方向努力？这些问题，没有任何一家平台问过你，也没有任何算法能准确推断出来。只有你自己知道答案——但互联网从来没有给你一个地方，让你把这些答案公开地、结构化地、面向全世界地说出来。</p>
                <p className="text-[var(--text-secondary)] mb-4">这些答案，就是主观数据。</p>
                <p className="text-[var(--text-secondary)] mb-4">主观数据不能被行为追踪采集，只能由你本人主动表达。认知界就是为这种表达而建造的——在这里，你不是流量，不是行为数据点，你是<strong>有意图的主体</strong>。你主动定义自己，而不是被算法被动定义。</p>
                <p className="text-[var(--text-secondary)]">认知界在做的事情，就是为这个社会模型提供基础设施。</p>
              </section>

              <hr className="my-8 border-gray-200" />

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">一个人，一份执念</h2>
                <p className="text-[var(--text-secondary)] mb-4">认知界现在是我一个人在做。</p>
                <p className="text-[var(--text-secondary)] mb-4">白天上班，晚上回家挤出大概一个小时来推进——写提示词、推演逻辑、和 AI 反复对话。项目从设想到现在大概两个多月，实际的代码开发用了一个月。我没有团队，身边的人和我的想法可能不太一样，但这没关系。</p>
                <p className="text-[var(--text-secondary)] mb-4">我花了几十块钱开通了 MEOO 的会员，买了 DeepSeek 的 API 支持我在本地跑 AI。这就是到目前为止的全部投入。</p>
                <p className="text-[var(--text-secondary)] mb-4">最初我想在国内注册一人公司来做这件事。但调研后发现，要申请 ICP 许可证至少需要三个员工的社保账户——在我还没有盈利的时候，就要先支付社保和工资。这个成本对一个自掏腰包的个人项目来说太高了。所以我放弃了国内的路径，选择了出海——在公网上搭建，面向全球。</p>
                <p className="text-[var(--text-secondary)] font-medium">放弃过路径，没有放弃过方向。</p>
              </section>

              <hr className="my-8 border-gray-200" />

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">我的恐惧，我的确定</h2>
                <p className="text-[var(--text-secondary)] mb-4">我最担心的事，是认知界变成一个信息的垃圾站——被犯罪分子利用它的可信度去做诈骗，成为法外之地。我有应对的手段，比如屏蔽 IP。但魔高一尺，道高一丈，我知道这个博弈可能没有终点。</p>
                <p className="text-[var(--text-secondary)] mb-4">但我确定一件事：<strong>这个项目不会失败，因为我不定义失败。</strong></p>
                <p className="text-[var(--text-secondary)] mb-4">任何时候，我继续做就行了。</p>
                <p className="text-[var(--text-secondary)]">从我自己的数字身份开始。只要它在认知界上能被全球的搜索引擎和 AI 检索到，我就定义它已经成功了。剩下的，是看它能为多少人创造同样的可能性。</p>
              </section>

              <hr className="my-8 border-gray-200" />

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">给你的话</h2>
                <p className="text-[var(--text-secondary)] mb-4">认知界现在是一个 Beta 版本。这是我第一次做产品，一定有不完善的地方。有 bug，有不足，有需要改进的设计。但它的核心功能是真实的：<strong>你在这里发布的信息，面向全网公开，可被搜索引擎和 AI 系统平等地索引和引用。</strong></p>
                <p className="text-[var(--text-secondary)] mb-4">你不需要成为名人才能被世界看见。</p>
                <p className="text-[var(--text-secondary)] mb-4">你不需要取悦算法才能让你的声音传出去。</p>
                <p className="text-[var(--text-secondary)] mb-4">你不需要等到别人的许可，才开始定义自己的数字身份。</p>
                <p className="text-[var(--text-secondary)] mb-4">你只需要来这里，把自己真实的想法、经历、创造——公开地放在这里。剩下的，交给平台。</p>
                <p className="text-[var(--text-secondary)]">如果你在使用中遇到任何问题，有建议或反馈，请通过站内留言板联系我。我会以一个系统管理员的身份收到你的消息。每一个反馈，都会帮助这个平台变得更好。</p>
              </section>

              <hr className="my-8 border-gray-200" />

              <footer className="text-center pt-4">
                <p className="text-xl font-bold text-[var(--text-primary)] mb-2">认知界（Cognition World）</p>
                <p className="text-[var(--text-secondary)] mb-1">一个让世界认识你的地方</p>
                <p className="text-[var(--text-secondary)] mb-4">2026 年 6 月</p>
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
