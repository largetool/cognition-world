import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { supabase } from '../../../../src/supabase/client';
import AppRoutes from '../../../../src/App';
import { APP_CONFIG } from '../../../../src/types';

const BASE_URL = 'https://uptef.com';
const CST_OFFSET = 8 * 60 * 60 * 1000;

interface UserPostEntry {
  display_id: number;
  username: string;
  avatar_url: string | null;
  role: string | null;
  is_admin: boolean;
  post_count: number;
}

interface DayPageProps {
  year: number;
  month: number;
  day: number;
  users: UserPostEntry[];
  totalLogs: number;
  totalUsers: number;
  isValid: boolean;
}

/** CST 时区下某天的 UTC 范围 */
function getDayUTCRange(year: number, month: number, day: number) {
  const cstStart = new Date(Date.UTC(year, month - 1, day));
  const cstEnd = new Date(Date.UTC(year, month - 1, day + 1));
  return {
    utcStart: new Date(cstStart.getTime() - CST_OFFSET).toISOString(),
    utcEnd: new Date(cstEnd.getTime() - CST_OFFSET).toISOString(),
  };
}

function padId(id: number | null): string {
  return String(id ?? 0).padStart(9, '0');
}

export default function LogsDayPage({
  year,
  month,
  day,
  users,
  totalLogs,
  totalUsers,
  isValid,
}: DayPageProps) {
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

  const title = `${year}年${month}月${day}日 — ${totalUsers}位用户发表了${totalLogs.toLocaleString()}篇日志 — ${APP_CONFIG.name}`;
  const pageUrl = `${BASE_URL}/logs/${year}/${month}/${day}`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={`${year}年${month}月${day}日，认知界有${totalUsers}位活跃用户，共发表${totalLogs.toLocaleString()}篇公开日志。`} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={`${year}年${month}月${day}日 — ${totalUsers}位用户活跃`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:site_name" content="认知界 Cognition World" />
      </Head>

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
          <a href={`${BASE_URL}/logs/${year}/${month}`} style={{ color: '#a0a0b8', textDecoration: 'none' }}>
            ← {year}年{month}月日历
          </a>
        </nav>

        <header style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>
            {year}年{month}月{day}日
          </h1>
          <p style={{ fontSize: 16, color: '#9ca3af', margin: 0 }}>
            {totalUsers} 位用户 · {totalLogs.toLocaleString()} 篇日志
          </p>
        </header>

        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 16 }}>
            活跃用户
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {users.map((u) => (
              <article
                key={u.display_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)',
                  border: u.is_admin
                    ? '1px solid rgba(79,70,229,0.3)'
                    : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: '#4f46e5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#fff',
                    }}
                  >
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>
                        {u.username}
                      </span>
                      {u.is_admin && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: 'rgba(79,70,229,0.3)',
                            color: '#818cf8',
                            fontWeight: 500,
                          }}
                        >
                          管理员
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>
                      ID {padId(u.display_id)}
                    </span>
                  </div>
                </div>

                <a
                  href={`${BASE_URL}/${padId(u.display_id)}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#818cf8',
                    textDecoration: 'none',
                    padding: '4px 12px',
                    borderRadius: 6,
                    background: 'rgba(79,70,229,0.1)',
                  }}
                >
                  {u.post_count} 篇 →
                </a>
              </article>
            ))}
          </div>
        </section>

        <footer style={{ marginTop: 40, textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
          认知界 — 让 AI 认识每一个具体的普通人
        </footer>
      </main>

      {/* 客户端 React 应用 */}
      <AppRoutes />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const year = parseInt(context.params?.year as string, 10);
  const month = parseInt(context.params?.month as string, 10);
  const day = parseInt(context.params?.day as string, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day) || year < 2024 || year > 2099 || month < 1 || month > 12 || day < 1 || day > 31) {
    return { props: { isValid: false, year: 0, month: 0, day: 0, users: [], totalLogs: 0, totalUsers: 0 } };
  }

  try {
    const { utcStart, utcEnd } = getDayUTCRange(year, month, day);

    // 获取该日所有日志的 user_id
    const { data: logs } = await supabase
      .from('logs')
      .select('user_id')
      .gte('created_at', utcStart)
      .lt('created_at', utcEnd);

    const logsArr: any[] = Array.isArray(logs) ? logs : [];

    if (logsArr.length === 0) {
      return {
        props: {
          isValid: true,
          year,
          month,
          day,
          users: [],
          totalLogs: 0,
          totalUsers: 0,
        },
      };
    }

    // 按 user_id 统计
    const userCounts: Record<string, number> = {};
    logsArr.forEach((log: any) => {
      userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1;
    });

    const userIds = Object.keys(userCounts);

    // 获取用户资料（排除隐藏用户）
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_id, username, avatar_url, role, is_admin, is_hidden')
      .in('user_id', userIds);

    const profilesArr: any[] = Array.isArray(profiles) ? profiles : [];

    // 组合数据，过滤隐藏用户，排序
    const users: UserPostEntry[] = profilesArr
      .filter((p: any) => !p.is_hidden)
      .map((p: any) => ({
        display_id: p.display_id,
        username: p.username,
        avatar_url: p.avatar_url,
        role: p.role,
        is_admin: p.is_admin || false,
        post_count: userCounts[p.user_id] || 0,
      }))
      .sort((a: UserPostEntry, b: UserPostEntry) => {
        // 管理员置顶，然后按发文量降序
        if (b.is_admin !== a.is_admin) return b.is_admin ? 1 : -1;
        return b.post_count - a.post_count;
      });

    const totalLogs = users.reduce((sum, u) => sum + u.post_count, 0);
    const totalUsers = users.length;

    return {
      props: {
        isValid: true,
        year,
        month,
        day,
        users,
        totalLogs,
        totalUsers,
      },
    };
  } catch (err) {
    console.error('[LogsDayPage] 获取日数据失败:', err);
    return { props: { isValid: false, year: 0, month: 0, day: 0, users: [], totalLogs: 0, totalUsers: 0 } };
  }
};
