import Head from 'next/head';
import AppRoutes from '../src/App';
import { APP_CONFIG } from '../src/types';
import { generateWebPageSchema, generateBreadcrumbList, breadcrumbs } from '../src/utils/seo';

const BASE_URL = 'https://uptef.com';
const PAGE_URL = `${BASE_URL}/about`;

export default function AboutPage() {
  const pageTitle = `关于 - ${APP_CONFIG.name}`;
  const pageDescription = '认知界创始人一言超人的故事：为什么一个普通人要建立一个让 AI 找到每个人的公开信息平台。';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      generateWebPageSchema(pageTitle, PAGE_URL, pageDescription),
      generateBreadcrumbList([breadcrumbs.home, breadcrumbs.about]),
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
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 24 }}>关于认知界</h1>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 24, marginBottom: 8 }}>这件事是怎么开始的</h2>
        <p style={{ fontSize: 14, color: '#c4c4d4', marginBottom: 16 }}>创始人"一言超人"在知乎、抖音、快手等平台尝试了两年，只有 1300 粉丝。他发现企业可以通过 SEO 和 GEO 被搜索到，但普通人做不到。这个差距是不公平的——认知界就是为了填补这个差距。</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 24, marginBottom: 8 }}>关于创始人</h2>
        <p style={{ fontSize: 14, color: '#c4c4d4', marginBottom: 16 }}>一人团队，无投资。白天上班，晚上用 AI 开发。投入只有不到十元钱的工具会员费和 API 费用。选择全球上线而非国内备案路线。信奉"人本位"理念——你定义你自己，而不是被算法定义。</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 24, marginBottom: 8 }}>我们相信什么</h2>
        <p style={{ fontSize: 14, color: '#c4c4d4', marginBottom: 16 }}>每个人都有权利主动定义自己。主观数据（你是谁、你想什么）比行为数据（你点了什么）更重要。真实的人，是 AI 时代最稀缺的资源。</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 24, marginBottom: 8 }}>联系创始团队</h2>
        <p style={{ fontSize: 14, color: '#c4c4d4', marginBottom: 16 }}>邮箱：contact@uptef.com · 创始人一言超人：mansun110@hotmail.com · 知乎/微信公众号/抖音/快手：一言超人</p>
      </main>

      <noscript><style>{`#ssr-content { display: block !important; }`}</style></noscript>
      <AppRoutes />
    </>
  );
}
