import Head from 'next/head';
import AppRoutes from '../src/App';
import { APP_CONFIG } from '../src/types';
import {
  generateFAQPageSchema,
  generateBreadcrumbList,
  breadcrumbs,
  HOME_FAQ,
} from '../src/utils/seo';

const BASE_URL = 'https://uptef.com';

export default function IndexPage() {
  const pageTitle = `${APP_CONFIG.name} - ${APP_CONFIG.slogan}`;
  const pageDescription = APP_CONFIG.description;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      generateFAQPageSchema(HOME_FAQ),
      generateBreadcrumbList([breadcrumbs.home]),
    ],
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content="个人GEO,个人SEO,AI可索引,公开身份平台,数字实体,人本位,个人主页,黄页,AI,认知,索引,GEO,全民GEO,CognitionWorld,个人品牌,数字身份,LLM索引,全局目录,结构化数据,AI搜索,AI引用,数字信誉,Generative Engine Optimization,个人知识图谱,公开日志" />

        <meta property="og:title" content={`${APP_CONFIG.name} - ${APP_CONFIG.slogan}`} />
        <meta property="og:description" content={APP_CONFIG.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={BASE_URL} />
        <meta property="og:image" content={`${BASE_URL}/assets/C2283395-46CF-48E8-B1EC-3813518039AE.jpg`} />
        <meta property="og:site_name" content="认知界 Cognition World" />
        <meta property="og:locale" content="zh_CN" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${APP_CONFIG.name} - ${APP_CONFIG.slogan}`} />
        <meta name="twitter:description" content={APP_CONFIG.description} />

        <link rel="canonical" href={BASE_URL} />
        <meta name="robots" content="index, follow, max-image-preview:large" />

        <link rel="alternate" hrefLang="zh-CN" href={BASE_URL} />
        <link rel="alternate" hrefLang="en" href={`${BASE_URL}/en`} />
        <link rel="alternate" hrefLang="x-default" href={BASE_URL} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <main
        id="ssr-content"
        style={{
          display: 'none',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          maxWidth: '800px',
          margin: '0 auto',
          padding: '48px 16px 64px',
          color: '#e6e6e6',
          background: '#0d0d1a',
          lineHeight: 1.8,
        }}
      >
        {/* Hero */}
        <header style={{ textAlign: 'center', marginBottom: 56, paddingTop: 16 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: '0 0 12px 0', letterSpacing: -0.5 }}>
            {APP_CONFIG.name}
          </h1>
          <p style={{ fontSize: 20, color: '#818cf8', margin: '0 0 16px 0', fontWeight: 500 }}>
            {APP_CONFIG.slogan}
          </p>
          <p style={{ fontSize: 15, color: '#a0a0b8', maxWidth: 560, margin: '0 auto 28px' }}>
            {APP_CONFIG.description}
          </p>
          <a
            href={`${BASE_URL}/register`}
            style={{
              display: 'inline-block',
              padding: '14px 36px',
              background: '#4f46e5',
              color: '#fff',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            创建你的数字身份 →
          </a>
        </header>

        {/* 什么是认知界 */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
            什么是认知界
          </h2>
          <p style={{ fontSize: 15, color: '#c4c4d4', margin: '0 0 12px 0' }}>
            认知界（Cognition World）是一个面向全球用户的公开信息平台。每个人都可以在这里创建个人主页、发表认知日志、积累数字信誉记录。平台使用 Schema.org 标准结构化数据描述每个用户，让 Google、Bing、ChatGPT、Claude 等 AI 引擎能够理解并引用你的公开资料。
          </p>
          <p style={{ fontSize: 15, color: '#c4c4d4', margin: 0 }}>
            与 LinkedIn 和知乎不同，认知界专注于 <strong style={{ color: '#818cf8' }}>AI 可发现的数字身份</strong> —— 你的资料不仅人能看到，AI 也能直接读取和引用，成为 AI 时代可搜索、可验证的数字实体。
          </p>
        </section>

        {/* 核心价值 */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
            核心价值
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'rgba(79,70,229,0.08)', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(79,70,229,0.15)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#818cf8', margin: '0 0 6px 0' }}>AI 可索引</h3>
              <p style={{ fontSize: 14, color: '#a0a0b8', margin: 0 }}>
                使用 Schema.org 标准描述个人信息，让 ChatGPT、Claude、Perplexity、Google AI Overview 等 AI 引擎直接读取、理解和引用你的公开资料。
              </p>
            </div>
            <div style={{ background: 'rgba(79,70,229,0.08)', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(79,70,229,0.15)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#818cf8', margin: '0 0 6px 0' }}>不可篡改</h3>
              <p style={{ fontSize: 14, color: '#a0a0b8', margin: 0 }}>
                公开内容一旦发布便被永久记录，不可随意删除或篡改。这为你建立长期可追溯的数字信誉，让每个普通人的发声都有据可查。
              </p>
            </div>
            <div style={{ background: 'rgba(79,70,229,0.08)', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(79,70,229,0.15)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#818cf8', margin: '0 0 6px 0' }}>全球可达</h3>
              <p style={{ fontSize: 14, color: '#a0a0b8', margin: 0 }}>
                面向全球化设计，支持多语言。无论你的观众在哪个国家、使用什么搜索引擎，都能找到你的公开页面。
              </p>
            </div>
          </div>
        </section>

        {/* 如何使用 */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
            如何使用
          </h2>
          <p style={{ fontSize: 15, color: '#c4c4d4', margin: '0 0 16px 0' }}>
            三步建立你的 AI 可索引数字身份：
          </p>
          <ol style={{ paddingLeft: 20, fontSize: 15, color: '#c4c4d4', margin: 0 }}>
            <li style={{ marginBottom: 8 }}>注册账号，填写你的用户名、身份标签、个人 Slogan 和所在地</li>
            <li style={{ marginBottom: 8 }}>发表认知日志，记录你的思考和见解</li>
            <li>搜索引擎和 AI 会自动发现、索引并引用你的公开资料</li>
          </ol>
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
            常见问题
          </h2>
          {HOME_FAQ.map((faq, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e6e6e6', margin: '0 0 6px 0' }}>
                {faq.q}
              </h3>
              <p style={{ fontSize: 14, color: '#a0a0b8', margin: 0 }}>
                {faq.a}
              </p>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section style={{ textAlign: 'center', padding: '32px 24px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(79,70,229,0.15) 0%, rgba(79,70,229,0.05) 100%)', border: '1px solid rgba(79,70,229,0.2)' }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: '#fff', margin: '0 0 16px 0' }}>
            在 AI 时代建立属于你的数字身份
          </p>
          <a
            href={`${BASE_URL}/register`}
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              background: '#4f46e5',
              color: '#fff',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            立即注册
          </a>
        </section>

        <footer style={{ textAlign: 'center', marginTop: 48, fontSize: 12, color: '#4b5563' }}>
          时空锚点 · 2026-06-01 · 北京市延庆区
        </footer>
      </main>

      <noscript>
        <style>{`#ssr-content { display: block !important; }`}</style>
      </noscript>

      <AppRoutes />
    </>
  );
}
