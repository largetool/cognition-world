import Head from 'next/head';
import AppRoutes from '../src/App';
import { APP_CONFIG } from '../src/types';
import { generateWebPageSchema, generateBreadcrumbList, breadcrumbs } from '../src/utils/seo';

const BASE_URL = 'https://uptef.com';
const PAGE_URL = `${BASE_URL}/whitepaper`;

export default function WhitepaperPage() {
  const pageTitle = `白皮书 - ${APP_CONFIG.name}`;
  const pageDescription = '认知界白皮书 V5.0：人本位互联网——在 AI 时代重建真实的人类连接。探讨数字身份、GEO、不可篡改的公开信息平台。';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      generateWebPageSchema(pageTitle, PAGE_URL, pageDescription),
      generateBreadcrumbList([breadcrumbs.home, breadcrumbs.whitepaper]),
    ],
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={PAGE_URL} />
        <meta property="og:site_name" content="认知界 Cognition World" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={PAGE_URL} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <main id="ssr-content" style={{ display: 'none', fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '48px 16px 64px', color: '#e6e6e6', background: '#0d0d1a', lineHeight: 1.8 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 8 }}>人本位互联网</h1>
        <p style={{ fontSize: 18, color: '#818cf8', marginBottom: 4, fontWeight: 500 }}>在 AI 时代，重建真实的人类连接</p>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 32 }}>V5.0 · 2026年5月 · 作者：一言超人</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 32, marginBottom: 8 }}>开篇：你被系统性地隐形了</h2>
        <p style={{ fontSize: 14, color: '#c4c4d4', marginBottom: 16 }}>互联网经济建立在控制信息流动之上——平台的权力越来越大，个人的声音越来越弱。AI 可以搜遍全世界，却找不到一个真实的人。认知界要打破这种单向度的信息格局。</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 32, marginBottom: 8 }}>理论基础</h2>
        <p style={{ fontSize: 14, color: '#c4c4d4', marginBottom: 16 }}>人类文明经历了土地资产、生产资产、内容资产三个时代。在 AI 时代，最稀缺的资源是信息背后的真实的人。认知界定义"真实的人"为对信息负责的人。</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 32, marginBottom: 8 }}>主观数据</h2>
        <p style={{ fontSize: 14, color: '#c4c4d4', marginBottom: 16 }}>行为数据记录你做了什么，主观数据定义你是谁。每个人都有权利主动定义自己，而不是被算法被动定义。</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 32, marginBottom: 8 }}>解决方案</h2>
        <p style={{ fontSize: 14, color: '#c4c4d4', marginBottom: 16 }}>认知界是面向全球的公开身份平台，三大核心功能：个人公开主页、公开留言板、GEO（生成式引擎优化）。技术架构采用双读者设计（人类阅读 + AI 结构化数据）和不可篡改发布机制。</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 32, marginBottom: 8 }}>四项承诺与愿景</h2>
        <p style={{ fontSize: 14, color: '#c4c4d4', marginBottom: 16 }}>真实、平等、开放、不可篡改。三年内让认知界成为全球公共身份基础设施，让 AI 不仅知道"说了什么"，更知道"谁说的"。</p>
      </main>

      <noscript><style>{`#ssr-content { display: block !important; }`}</style></noscript>
      <AppRoutes />
    </>
  );
}
