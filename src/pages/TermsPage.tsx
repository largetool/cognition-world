import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileCheck, ArrowUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { Footer } from '../components/Footer';
import { APP_CONFIG } from '../types';
import { generateBreadcrumbList, breadcrumbs } from '../utils/seo';

export default function TermsPage() {
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
          title: '用户协议 - 认知界',
          description: '认知界用户协议',
        }}
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            generateBreadcrumbList([breadcrumbs.home, breadcrumbs.terms]),
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
              <FileCheck className="w-8 h-8 text-purple-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
              认知界（Cognition World）用户协议
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              最后更新：2026年5月 | 版本：Beta v1.0
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-[var(--bg-secondary)] rounded-2xl p-8 sm:p-12"
          >
            <div className="prose prose-slate max-w-none">
              <blockquote className="border-l-4 border-purple-500 pl-4 italic text-[var(--text-secondary)] mb-8">
                这是认知界的第一个公开版本。协议内容将根据产品迭代和用户反馈持续优化。如果你对协议有任何建议，欢迎通过留言板或邮箱告诉我们。
              </blockquote>

              <hr className="my-8 border-gray-200" />

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">一、服务说明</h2>
                <p className="text-[var(--text-secondary)] mb-4">
                  认知界是一个面向全球的个人公开身份平台。用户在本平台发布的信息将对全网公开，可被搜索引擎和 AI 系统索引和引用。
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <p className="text-amber-800 font-medium mb-2">Beta 阶段说明：</p>
                  <p className="text-amber-700">
                    当前处于 Beta 测试阶段，部分功能尚在完善中。测试阶段平台可能对无效测试数据、冗余缓存等进行技术性清理，用户已发布的公开内容不受影响。因测试阶段的不确定性，平台可能对功能进行调整或暂时下线维护，我们会通过站内消息提前通知。使用即代表你理解并接受测试阶段的不确定性。
                  </p>
                </div>
              </section>

              <hr className="my-8 border-gray-200" />

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">二、账户</h2>
                <ul className="list-disc pl-6 text-[var(--text-secondary)] mb-6 space-y-2">
                  <li>注册时需提供有效的邮箱地址</li>
                  <li>你对自己账户下的所有行为负责</li>
                  <li>一个用户只能拥有一个活跃账户</li>
                  <li>平台保留拒绝服务的权利</li>
                </ul>

                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">账户不可注销</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 font-medium mb-2">用户账户不可注销，不可删除。</p>
                  <p className="text-red-700">
                    你的账户是你所有公开发言的身份锚点。如果允许删除账户，用户就可以通过"删除—重建"的方式逃避责任、清洗历史记录。因此，认知界不提供账户注销功能。如因法律法规要求确需删除账户，平台将在依法处理的同时，保留你的公开发言记录作为公开信息存档。
                  </p>
                </div>
                <p className="text-[var(--text-secondary)] mb-6">
                  如果你不希望继续使用认知界，可以申请隐藏账户（见下方"账户隐藏规则"）。但你的账户本身将永久存在。
                </p>

                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">账户隐藏规则</h3>
                <p className="text-[var(--text-secondary)] mb-4">
                  隐藏账户不是删除——它只是暂停展示，你的账户和数据始终保留。隐藏是一项严肃的决定，申请前请仔细阅读以下规则：
                </p>

                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-[var(--text-primary)] mb-2">第一阶段：冷静期（3 天）</h4>
                    <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-1">
                      <li>用户提交隐藏申请后，账户仍正常显示</li>
                      <li>3 天内可随时取消申请，没有任何后果</li>
                      <li>3 天后未取消，自动进入冻结期</li>
                      <li>冷静期的目的是防止冲动决定</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-[var(--text-primary)] mb-2">第二阶段：冻结期（最少 6 个月）</h4>
                    <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-1">
                      <li>账户进入隐藏状态，个人主页显示"用户已暂停展示"</li>
                      <li>已发布的内容和留言记录不删除，仅暂停对外显示</li>
                      <li>冻结期间用户不能发布新内容、不能留言、不能互动</li>
                      <li>冻结期至少持续 6 个月，期间不可提前解除</li>
                      <li>6 个月冻结是一个严肃的门槛：隐藏不是想走就走、想回来就回来的短期操作</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-[var(--text-primary)] mb-2">第三阶段：恢复</h4>
                    <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-1">
                      <li>冻结期满 6 个月后，用户可申请恢复账户</li>
                      <li>恢复后所有历史内容重新对外显示</li>
                      <li>如不主动申请恢复，账户持续保持隐藏</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-800 mb-2">争议拦截</h4>
                  <p className="text-orange-700">
                    如果你存在未解决的争议——包括其他用户对你的留言提出的举报、投诉，或你有未回应的平台质询——隐藏申请将被暂停。页面会提示："你有一项未解决的争议。在争议处理完成之前，不能隐藏账户。"
                  </p>
                </div>
                <p className="text-[var(--text-secondary)] mt-4 italic">
                  隐藏是你的权利。但用它来逃避你对他人的责任，不是。
                </p>
              </section>

              <hr className="my-8 border-gray-200" />

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">三、内容发布规则</h2>

                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">不可删除、不可篡改</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 font-medium">
                    成功发布的内容永久保存，不可删除、不可篡改。这是本平台的核心原则。
                  </p>
                </div>
                <p className="text-[var(--text-secondary)] mb-2 font-medium">例外：</p>
                <ul className="list-disc pl-6 text-[var(--text-secondary)] mb-6 space-y-2">
                  <li>留言板消息发布 10 分钟内可自行删除，超过 10 分钟后永久保存</li>
                  <li>违规内容平台有权标记和隐藏，但原始数据保留审计记录</li>
                  <li>用户可以申请隐藏账户（详见第二条"账户隐藏规则"），但数据不删除</li>
                </ul>

                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">禁止发布的内容</h3>
                <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2">
                  <li>违反中华人民共和国法律法规及用户所在地适用法律的内容</li>
                  <li>色情、淫秽、暴力、恐怖内容</li>
                  <li>诈骗、欺诈信息</li>
                  <li>侵犯他人隐私权、名誉权、知识产权等合法权益的内容</li>
                  <li>重复发布、批量灌水等严重影响其他用户体验的行为</li>
                </ul>
              </section>

              <hr className="my-8 border-gray-200" />

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">四、知识产权</h2>
                <p className="text-[var(--text-secondary)] mb-4">
                  用户在认知界发布的原创内容，著作权归用户本人所有。
                </p>
                <p className="text-[var(--text-secondary)]">
                  用户授予认知界在全球范围内、非排他性、免版税的许可，以在平台上展示、传播用户内容，并将其纳入搜索引擎和 AI 系统的索引范围。这一授权不涉及任何排他性权利——你可以在其他任何地方自由使用自己创建的内容。
                </p>
              </section>

              <hr className="my-8 border-gray-200" />

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">五、发布限额</h2>
                <p className="text-[var(--text-secondary)] mb-4">平台目前采用以下默认限额：</p>
                <ul className="list-disc pl-6 text-[var(--text-secondary)] mb-4 space-y-2">
                  <li>普通用户：每天最多 10 条动态</li>
                  <li>付费用户：每天最多 30 条动态</li>
                  <li>管理员：不受限制</li>
                </ul>
                <p className="text-[var(--text-secondary)]">
                  平台有权根据服务器负载和运营成本调整限额，调整后通过站内消息通知用户。
                </p>
              </section>

              <hr className="my-8 border-gray-200" />

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">六、隐私说明</h2>
                <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2">
                  <li>你在平台上发布的信息为公开信息，可被全网访问</li>
                  <li>你的邮箱等注册信息不对外公开</li>
                  <li>平台不会向第三方出售用户数据</li>
                  <li>平台可能使用 AI 对用户内容进行索引和分析，以提升搜索可见性</li>
                </ul>
              </section>

              <hr className="my-8 border-gray-200" />

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">七、免责声明</h2>
                <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2">
                  <li>用户对其发布的内容承担全部法律责任</li>
                  <li>平台不对用户发布内容的真实性、准确性负责</li>
                  <li>Beta 测试阶段平台可能对无效测试数据进行技术性清理，用户已发布的公开内容不受影响</li>
                  <li>因不可抗力（服务器故障、网络攻击、自然灾害等）导致的服务中断或数据丢失，平台不承担责任</li>
                </ul>
              </section>

              <hr className="my-8 border-gray-200" />

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">八、协议修改</h2>
                <p className="text-[var(--text-secondary)]">
                  平台可能修改本协议，修改后将在平台公示，并通过站内消息或邮箱通知用户。用户在通知后继续使用平台，即表示接受修改后的协议。如用户不同意修改内容，可申请隐藏账户。
                </p>
              </section>

              <hr className="my-8 border-gray-200" />

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">九、社区治理</h2>
                <p className="text-[var(--text-secondary)]">
                  认知界倡导用户共同维护社区环境。平台未来可能引入社区投票、共识仲裁等自治机制。我们相信，最好的规则不是由平台单方面制定的，而是由社区共同形成的。具体机制将以社区公约形式另行发布。
                </p>
              </section>

              <hr className="my-8 border-gray-200" />

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">十、联系我们</h2>
                <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2">
                  <li>邮箱：contact@uptef.com</li>
                  <li>平台内留言板</li>
                </ul>
              </section>

              <hr className="my-8 border-gray-200" />

              <section className="mb-10">
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  认知界不是一个传统的社交平台。我们不圈养用户，不贩卖流量。我们的规则只有一个目的：让真实的人被真实地看见。所有条款都围绕这个目的设计——信息不可删除，是让每一句话都值得被负责；账户不可注销，是让每一个人都值得被信任。
                </p>
              </section>

              <hr className="my-8 border-gray-200" />

              <footer className="text-center pt-4">
                <p className="text-xl font-bold text-[var(--text-primary)] mb-2">认知界（Cognition World）</p>
                <p className="text-sm text-[var(--text-secondary)]">本文由 一言超人 撰写</p>
                <p className="text-sm text-[var(--text-secondary)]">认知界创始人</p>
              </footer>
            </div>
          </motion.div>
        </div>
      </main>

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

      <Footer />
    </div>
  );
}
