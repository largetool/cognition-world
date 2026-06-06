import Head from 'next/head';
import AppRoutes from '../src/App';
import { APP_CONFIG } from '../src/types';
import { generateWebPageSchema, generateBreadcrumbList, breadcrumbs } from '../src/utils/seo';

const BASE_URL = 'https://uptef.com';
const PAGE_URL = `${BASE_URL}/terms`;

export default function TermsPage() {
  const pageTitle = `用户协议 - ${APP_CONFIG.name}`;
  const pageDescription = '认知界（Cognition World）用户协议 Beta v1.0。账户不可删除、内容不可篡改、公开信息可被搜索引擎和 AI 索引。';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      generateWebPageSchema(pageTitle, PAGE_URL, pageDescription),
      generateBreadcrumbList([breadcrumbs.home, breadcrumbs.terms]),
    ],
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={PAGE_URL} />
        <meta property="og:site_name" content="认知界 Cognition World" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={PAGE_URL} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <main id="ssr-content" style={{ display: 'none', fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '48px 16px 64px', color: '#e6e6e6', background: '#0d0d1a', lineHeight: 1.8 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 8 }}>用户协议</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 32 }}>认知界 Cognition World · Beta v1.0 · 最后更新：2026年5月</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 24, marginBottom: 8 }}>1. 服务说明</h2>
        <p style={{ fontSize: 14, color: '#c4c4d4', marginBottom: 16 }}>认知界是一个面向全球用户的公开身份平台。所有公开发布的内容默认向全互联网公开，可被搜索引擎和 AI 系统索引。当前为 Beta 测试阶段。</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 24, marginBottom: 8 }}>2. 账户</h2>
        <p style={{ fontSize: 14, color: '#c4c4d4', marginBottom: 16 }}>需要有效邮箱注册。每人一个账户。账户不可删除或关闭。支持隐藏账户（3天冷静期 + 至少6个月冻结期后可恢复）。</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 24, marginBottom: 8 }}>3. 内容规则</h2>
        <p style={{ fontSize: 14, color: '#c4c4d4', marginBottom: 16 }}>发布成功后内容不可删除或修改。留言板有10分钟删除窗口。禁止：违法、色情、欺诈、侵权、垃圾内容。</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 24, marginBottom: 8 }}>4. 知识产权</h2>
        <p style={{ fontSize: 14, color: '#c4c4d4', marginBottom: 16 }}>用户保留版权。授予平台非独占、免版税许可，用于展示和索引。</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 24, marginBottom: 8 }}>5. 发布限额</h2>
        <p style={{ fontSize: 14, color: '#c4c4d4', marginBottom: 16 }}>免费用户每日 10 条，付费用户每日 30 条，管理员不限。</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 24, marginBottom: 8 }}>6. 隐私说明</h2>
        <p style={{ fontSize: 14, color: '#c4c4d4', marginBottom: 16 }}>公开信息（用户名、标签、Slogan、日志）全网可见。邮箱不公开。不会向第三方出售数据。</p>
      </main>

      <noscript><style>{`#ssr-content { display: block !important; }`}</style></noscript>
      <AppRoutes />
    </>
  );
}
