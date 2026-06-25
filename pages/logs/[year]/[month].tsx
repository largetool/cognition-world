import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { supabase } from '../../../src/supabase/client';
import AppRoutes from '../../../src/App';
import CalendarWidget from '../../../src/components/CalendarWidget';
import { APP_CONFIG } from '../../../src/types';

const BASE_URL = 'https://uptef.com';
const CST_OFFSET = 8 * 60 * 60 * 1000;

interface DayCount {
  day: number;
  count: number;
}

interface MonthPageProps {
  year: number;
  month: number;
  dayCounts: DayCount[];
  totalCount: number;
  isValid: boolean;
  ssrIsCrawler: boolean;
}

/** 判断是否为爬虫 */
function isCrawler(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  const botPattern = /bot|crawler|spider|googlebot|bingbot|slurp|baiduspider|yandexbot|duckduckbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|chatgpt|claude|anthropic|perplexity/i;
  return botPattern.test(userAgent);
}

/** CST 时区下该月的 UTC 范围 */
function getMonthUTCRange(year: number, month: number) {
  const cstStart = new Date(Date.UTC(year, month - 1, 1));
  const cstEnd = new Date(Date.UTC(year, month, 1));
  return {
    utcStart: new Date(cstStart.getTime() - CST_OFFSET).toISOString(),
    utcEnd: new Date(cstEnd.getTime() - CST_OFFSET).toISOString(),
  };
}

export default function LogsMonthPage({
  year,
  month,
  dayCounts,
  totalCount,
  isValid,
  ssrIsCrawler,
}: MonthPageProps) {
  if (!isValid) {
    return (
      <>
        <Head>
          <meta name="robots" content="noindex, follow" />
        </Head>
        <AppRoutes />
      </>
    );
  }

  const dailyCountsMap: Record<number, number> = {};
  dayCounts.forEach((d) => { dailyCountsMap[d.day] = d.count; });

  const title = `${year}年${month}月 — 共${totalCount.toLocaleString()}篇日志 — ${APP_CONFIG.name}`;
  const pageUrl = `${BASE_URL}/logs/${year}/${month}`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={`${year}年${month}月，认知界共有${totalCount.toLocaleString()}篇公开日志。浏览每日活跃用户和他们的认知记录。`} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={`认知界 ${year}年${month}月日志日历 — ${totalCount.toLocaleString()}篇日志`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:site_name" content="认知界 Cognition World" />
      </Head>

      {ssrIsCrawler && (
        <>
          {/* 爬虫可见内容 */}
          <main
            id="ssr-content"
            style={{
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

        <header style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>
            {year}年{month}月 公开日志
          </h1>
          <p style={{ fontSize: 16, color: '#9ca3af', margin: 0 }}>
            共 {totalCount.toLocaleString()} 篇日志
          </p>
        </header>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 16 }}>
            每日活跃
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {dayCounts.map((d) => (
              <a
                key={d.day}
                href={`${BASE_URL}/logs/${year}/${month}/${d.day}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: 'rgba(79,70,229,0.15)',
                  border: '1px solid rgba(79,70,229,0.2)',
                  color: '#818cf8',
                  textDecoration: 'none',
                  fontSize: 14,
                }}
              >
                <span style={{ fontWeight: 600 }}>{d.day}日</span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{d.count}篇</span>
              </a>
            ))}
          </div>
        </section>

        <footer style={{ marginTop: 40, textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
          认知界 — 让 AI 认识每一个具体的普通人
        </footer>
          </main>
        </>
      )}

      {/* 客户端 React 应用 */}
      <AppRoutes />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const year = parseInt(context.params?.year as string, 10);
  const month = parseInt(context.params?.month as string, 10);

  const userAgent = context.req?.headers['user-agent'];
  const ssrIsCrawler = isCrawler(userAgent);

  // 校验参数
  if (isNaN(year) || isNaN(month) || year < 2024 || year > 2099 || month < 1 || month > 12) {
    return { props: { isValid: false, year: 0, month: 0, dayCounts: [], totalCount: 0, ssrIsCrawler } };
  }

  try {
    const { utcStart, utcEnd } = getMonthUTCRange(year, month);

    const { data: logs } = await supabase
      .from('logs')
      .select('created_at')
      .gte('created_at', utcStart)
      .lt('created_at', utcEnd);

    // 按 CST 日期分组
    const dailyCounts: Record<number, number> = {};
    (logs || []).forEach((log: any) => {
      const cstDate = new Date(new Date(log.created_at).getTime() + CST_OFFSET);
      const day = cstDate.getUTCDate();
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    });

    const dayCounts: DayCount[] = Object.entries(dailyCounts)
      .map(([day, count]) => ({ day: parseInt(day, 10), count }))
      .sort((a, b) => a.day - b.day);

    const totalCount = dayCounts.reduce((sum, d) => sum + d.count, 0);

    return {
      props: {
        isValid: true,
        year,
        month,
        dayCounts,
        totalCount,
        ssrIsCrawler,
      },
    };
  } catch (err) {
    console.error('[LogsMonthPage] 获取日历数据失败:', err);
    return { props: { isValid: false, year: 0, month: 0, dayCounts: [], totalCount: 0, ssrIsCrawler } };
  }
};
