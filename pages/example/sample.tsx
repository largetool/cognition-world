import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { APP_CONFIG } from '../../src/types';
import AppRoutes from '../../src/App';

const BASE_URL = 'https://uptef.com';

const EXAMPLE_USER = {
  username: '星际旅人',
  tag: '代码诗人',
  slogan: '在数字宇宙中流浪，用代码书写星辰大海',
  location: '中国 浙江省 杭州市 西湖区',
  display_id: 1,
  created_at: '2026-05-01T08:30:00Z',
};

const EXAMPLE_LOGS = [
  { id: 'log-1', content: '今天完成了一个复杂的算法优化项目，性能提升了40%，很有成就感！', created_at: '2026-06-08T09:30:00Z', tags: ['编程', '算法', '效率'] },
  { id: 'log-2', content: '周末去西湖边拍了些照片，六月的杭州真的很美，荷花开了，湖面波光粼粼。', created_at: '2026-06-05T16:45:00Z', tags: ['生活', '摄影', '杭州'] },
  { id: 'log-3', content: '读完了《黑客与画家》，对技术创造力和艺术的关系有了新的理解。', created_at: '2026-06-02T20:15:00Z', tags: ['阅读', '技术', '创造力'] },
  { id: 'log-4', content: '第一次尝试做红烧肉，虽然卖相一般，但味道还不错，继续练习！', created_at: '2026-05-25T12:00:00Z', tags: ['生活', '烹饪'] },
  { id: 'log-5', content: '加入认知界，希望在这里记录我的技术成长和生活感悟。', created_at: '2026-05-20T00:01:00Z', tags: ['认知界', 'GEO'] },
];

function padId(id: number | null): string {
  return String(id ?? 0).padStart(9, '0');
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const parts = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Shanghai', hour12: false,
  }).formatToParts(d);
  const vals: Record<string, string> = {};
  parts.forEach(p => { vals[p.type] = p.value; });
  return `${vals.year}/${vals.month}/${vals.day} ${vals.hour}:${vals.minute}`;
}

export default function ExampleSampleSSRPage() {
  const pUrl = `${BASE_URL}/example/sample`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        name: `${EXAMPLE_USER.username} - ${APP_CONFIG.name}`,
        description: EXAMPLE_USER.slogan || `${EXAMPLE_USER.tag} | ${APP_CONFIG.name}`,
        url: pUrl,
        inLanguage: 'zh-CN',
        isPartOf: { '@type': 'WebSite', name: APP_CONFIG.name, url: BASE_URL },
        mainEntity: {
          '@type': 'Person',
          name: EXAMPLE_USER.username,
          description: EXAMPLE_USER.slogan,
          identifier: padId(EXAMPLE_USER.display_id),
          address: { '@type': 'PostalAddress', addressLocality: EXAMPLE_USER.location, addressCountry: 'CN' },
          url: pUrl,
        },
      },
      ...EXAMPLE_LOGS.map(log => ({
        '@type': 'BlogPosting',
        headline: log.content.slice(0, 60),
        articleBody: log.content,
        datePublished: log.created_at,
        url: `${pUrl}/thought/${log.id}`,
        isPartOf: { '@type': 'ProfilePage', '@id': pUrl },
        ...(log.tags && log.tags.length > 0 ? { about: log.tags.map(tag => ({ '@type': 'Thing', name: tag })) } : {}),
      })),
    ],
  };

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>
      <Head>
        <title>{EXAMPLE_USER.username} - {APP_CONFIG.name}（示例）</title>
        <meta name="description" content={`${EXAMPLE_USER.tag}。${EXAMPLE_USER.slogan || ''} — 认知界示例页面`} />
        <meta property="og:title" content={`${EXAMPLE_USER.username} - ${APP_CONFIG.name}（示例）`} />
        <meta property="og:description" content={EXAMPLE_USER.slogan || ''} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={pUrl} />
        <meta property="og:site_name" content="认知界 Cognition World" />
        <meta property="og:locale" content="zh_CN" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={pUrl} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
      </Head>

      <main
        id="ssr-content"
        style={{
          display: 'none',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          maxWidth: '720px',
          margin: '0 auto',
          padding: '32px 16px',
          color: '#e6e6e6',
          background: '#0d0d1a',
          lineHeight: 1.7,
        }}
      >
        <nav style={{ marginBottom: 24, fontSize: 14 }}>
          <a href={BASE_URL} style={{ color: '#a0a0b8', textDecoration: 'none' }}>
            ← 认知界首页
          </a>
        </nav>

        <header
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            borderRadius: 16,
            padding: '40px 24px',
            marginBottom: 32,
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            style={{
              width: 80, height: 80, borderRadius: 16,
              background: '#4f46e5', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 16,
            }}
          >
            {EXAMPLE_USER.username.charAt(0).toUpperCase()}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>
            {EXAMPLE_USER.username}
            <span style={{ fontSize: 14, fontWeight: 400, color: '#6b7280', marginLeft: 8 }}>示例</span>
          </h1>
          <p style={{ fontSize: 16, color: '#a0a0b8', margin: '0 0 8px 0' }}>{EXAMPLE_USER.tag}</p>
          <p style={{ fontSize: 16, color: '#d1d5db', maxWidth: 560, margin: '0 0 16px 0' }}>
            {EXAMPLE_USER.slogan}
          </p>
          <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#9ca3af' }}>
            <span>📍 {EXAMPLE_USER.location}</span>
            <span>🕐 加入于 {new Date(EXAMPLE_USER.created_at).getFullYear()}</span>
          </div>
        </header>

        <section>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#fff', margin: '0 0 16px 0' }}>认知日志</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {EXAMPLE_LOGS.map((log) => (
              <article
                key={log.id}
                style={{
                  background: 'rgba(255,255,255,0.04)', borderRadius: 12,
                  padding: '16px 20px', border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <p style={{ fontSize: 15, color: '#e6e6e6', margin: '0 0 10px 0', whiteSpace: 'pre-wrap' }}>
                  {log.content}
                </p>
                {(log as any).tags && (log as any).tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {(log as any).tags.map((tag: string, ti: number) => (
                      <span key={ti} style={{ fontSize: 11, color: '#818cf8', background: 'rgba(79,70,229,0.12)', padding: '2px 8px', borderRadius: 6 }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <time style={{ fontSize: 12, color: '#6b7280' }}>{fmtDate(log.created_at)}</time>
              </article>
            ))}
          </div>
        </section>

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <a
            href={`${BASE_URL}/register`}
            style={{
              display: 'inline-block', padding: '10px 28px', background: '#4f46e5',
              color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500,
            }}
          >
            创建你的个人页面
          </a>
        </div>
      </main>

      <noscript>
        <style>{`#ssr-content { display: block !important; }`}</style>
      </noscript>

      <AppRoutes />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
