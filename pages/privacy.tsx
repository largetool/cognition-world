import Head from 'next/head';
import AppRoutes from '../src/App';
import { APP_CONFIG } from '../src/types';
import { generateWebPageSchema, generateBreadcrumbList, breadcrumbs } from '../src/utils/seo';

const BASE_URL = 'https://uptef.com';
const PAGE_URL = `${BASE_URL}/privacy`;

export default function PrivacyPage() {
  const pageTitle = `隐私政策 - ${APP_CONFIG.name}`;
  const pageDescription = '认知界（Cognition World）隐私政策：不收集隐私数据，不卖数据，无定向广告，无行为画像。公开信息永久存留。';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      generateWebPageSchema(pageTitle, PAGE_URL, pageDescription),
      generateBreadcrumbList([breadcrumbs.home, breadcrumbs.privacy]),
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
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 8 }}>隐私政策</h1>
        <p style={{ fontSize: 15, color: '#818cf8', marginBottom: 4, fontWeight: 500, fontStyle: 'italic' }}>认知界不收集你的隐私。你来这里，是为了公开地存在。</p>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 32 }}>Beta v1.0 · 最后更新：2026年5月</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 24, marginBottom: 8 }}>认知界是什么</h2>
        <p style={{ fontSize: 14, color: '#c4c4d4', marginBottom: 16 }}>认知界是一个让个人面向全网公开存在的平台。不是存储隐私数据的地方（不应存放身份证号、银行卡号、详细地址、医疗记录等）。</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 24, marginBottom: 8 }}>我们处理什么信息</h2>
        <p style={{ fontSize: 14, color: '#c4c4d4', marginBottom: 16 }}>仅存储邮箱（用于登录和通知）和基础访问日志（IP、浏览器类型）。不收集：身份证、银行卡、精确位置、通讯录/社交关系、健康数据、生物识别。原则：你不公开的，我们不想知道。</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 24, marginBottom: 8 }}>信息保存多久</h2>
        <p style={{ fontSize: 14, color: '#c4c4d4', marginBottom: 16 }}>公开发布内容和邮箱永久保存（账户不可删除）。日志定期自动清理。</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 24, marginBottom: 8 }}>我们不做什么</h2>
        <p style={{ fontSize: 14, color: '#c4c4d4', marginBottom: 16 }}>不出售数据、不投放定向广告、不构建行为画像、不分析偏好、不追踪跨站活动。</p>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 24, marginBottom: 8 }}>你的权利</h2>
        <p style={{ fontSize: 14, color: '#c4c4d4', marginBottom: 16 }}>修改资料、隐藏账户、要求永久发布。联系方式：contact@uptef.com</p>
      </main>

      <noscript><style>{`#ssr-content { display: block !important; }`}</style></noscript>
      <AppRoutes />
    </>
  );
}
