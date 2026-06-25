import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, MessageSquare, UserCheck, Crown } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { SEOHead } from '../components/SEOHead';
import { APP_CONFIG } from '../types';
import { useAuth } from '../hooks/useAuth';
import { generateBreadcrumbList, breadcrumbs } from '../utils/seo';

const CST_OFFSET = 8 * 60 * 60 * 1000;
const SUPABASE_URL = 'https://nbgsichilfrjsopnnvia.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZ3NpY2hpbGZyanNvcG5udmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMTE1MjMsImV4cCI6MjA5NTg4NzUyM30.fWr-ZoDhirVgsKGsL8BWeP36iQ235GuQ4iF_GYK0RH0';

interface UserPostEntry {
  display_id: number;
  username: string;
  avatar_url: string | null;
  role: string | null;
  is_admin: boolean;
  post_count: number;
}

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

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

async function fetchDayData(
  year: number, month: number, day: number
): Promise<{ users: UserPostEntry[]; totalLogs: number; totalUsers: number }> {
  const { utcStart, utcEnd } = getDayUTCRange(year, month, day);

  // 获取该日所有日志的 user_id
  const logRes = await fetch(
    `${SUPABASE_URL}/rest/v1/logs?select=user_id&created_at=gte.${encodeURIComponent(utcStart)}&created_at=lt.${encodeURIComponent(utcEnd)}`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!logRes.ok) throw new Error(`Failed to fetch logs: ${logRes.status}`);
  const logs = await logRes.json();
  const logsArr: any[] = Array.isArray(logs) ? logs : [];

  if (logsArr.length === 0) {
    return { users: [], totalLogs: 0, totalUsers: 0 };
  }

  // 统计每个用户的发文数
  const userCounts: Record<string, number> = {};
  logsArr.forEach((log: any) => {
    userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1;
  });

  const userIds = Object.keys(userCounts);

  // 获取用户资料
  const profileParams = userIds
    .map((uid) => `user_id=eq.${encodeURIComponent(uid)}`)
    .join('&');
  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?select=user_id,display_id,username,avatar_url,role,is_admin,is_hidden&${profileParams}`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!profileRes.ok) throw new Error(`Failed to fetch profiles: ${profileRes.status}`);
  const profiles = await profileRes.json();
  const profilesArr: any[] = Array.isArray(profiles) ? profiles : [];

  // 组合、过滤、排序
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
    .sort((a, b) => {
      if (b.is_admin !== a.is_admin) return b.is_admin ? 1 : -1;
      return b.post_count - a.post_count;
    });

  const totalLogs = users.reduce((sum, u) => sum + u.post_count, 0);

  return { users, totalLogs, totalUsers: users.length };
}

export default function LogsDayPage() {
  const { year: yearParam, month: monthParam, day: dayParam } = useParams<{
    year: string;
    month: string;
    day: string;
  }>();
  const { user } = useAuth();

  const year = parseInt(yearParam || '0', 10);
  const month = parseInt(monthParam || '0', 10);
  const day = parseInt(dayParam || '0', 10);
  const isValid = !isNaN(year) && !isNaN(month) && !isNaN(day) &&
    year >= 2024 && year <= 2099 && month >= 1 && month <= 12 && day >= 1 && day <= 31;

  const [users, setUsers] = useState<UserPostEntry[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isValid) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const data = await fetchDayData(year, month, day);
        if (!cancelled) {
          setUsers(data.users);
          setTotalLogs(data.totalLogs);
        }
      } catch (err) {
        console.error('Failed to load day data:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [year, month, day, isValid]);

  if (!isValid) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">无效的日期</h1>
          <Link to="/" className="text-indigo-500 hover:underline">返回首页</Link>
        </div>
      </div>
    );
  }

  const title = `${year}年${month}月${day}日 — ${users.length}位用户发表了${totalLogs.toLocaleString()}篇日志 — ${APP_CONFIG.name}`;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <SEOHead
        data={{
          title,
          description: `${year}年${month}月${day}日，认知界有${users.length}位活跃用户，共发表${totalLogs.toLocaleString()}篇公开日志。`,
          canonicalUrl: `${APP_CONFIG.url}/logs/${year}/${month}/${day}`,
          ogType: 'article',
        }}
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            generateBreadcrumbList([
              breadcrumbs.home,
              { name: `${year}年${month}月日志`, url: `${APP_CONFIG.url}/logs/${year}/${month}` },
              { name: `${year}年${month}月${day}日`, url: `${APP_CONFIG.url}/logs/${year}/${month}/${day}` },
            ]),
          ],
        }}
      />
      <Navbar user={user} />

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* 顶部导航 */}
        <div className="mb-6">
          <Link
            to={`/logs/${year}/${month}`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {year}年{month}月日历
          </Link>
        </div>

        {/* 日期标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-1">
            {year}年{month}月{day}日
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <UserCheck className="w-4 h-4" />
              {users.length} 位活跃用户
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              {totalLogs.toLocaleString()} 篇日志
            </span>
          </div>
        </motion.div>

        {/* 用户列表 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl p-4 bg-white/60 backdrop-blur-xl border border-white/80"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-200" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-16" />
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-2xl p-12 text-center bg-white/60 backdrop-blur-xl border border-white/80">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">当天暂无日志记录</p>
              <Link
                to={`/logs/${year}/${month}`}
                className="inline-block mt-4 text-sm text-indigo-500 hover:underline"
              >
                返回 {year}年{month}月日历
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((u, index) => (
                <motion.div
                  key={u.display_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  <div
                    className={`
                      flex items-center justify-between rounded-xl p-4 transition-all
                      ${u.is_admin
                        ? 'bg-indigo-50/80 border border-indigo-200/50'
                        : 'bg-white/60 backdrop-blur-xl border border-white/80 hover:shadow-md'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* 排名序号 */}
                      <span className="w-6 text-center text-sm font-medium text-gray-400 shrink-0">
                        {index + 1}
                      </span>

                      {/* 头像 */}
                      <div
                        className={`
                          w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0
                          ${u.is_admin ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-slate-700 to-slate-900'}
                        `}
                      >
                        {getInitials(u.username)}
                      </div>

                      {/* 用户名 + 标签 */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[var(--text-primary)] truncate">
                            {u.username}
                          </span>
                          {u.is_admin && (
                            <Crown className="w-4 h-4 text-indigo-500 shrink-0" />
                          )}
                          {u.role === 'verified' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 font-medium">
                              实名
                            </span>
                          )}
                          {u.role === 'premium' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-medium">
                              Premium
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 font-mono">
                          ID {padId(u.display_id)}
                        </span>
                      </div>
                    </div>

                    {/* 发文数（可点击） */}
                    <Link
                      to={`/${padId(u.display_id)}`}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all shrink-0
                        ${u.is_admin
                          ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                          : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                        }
                      `}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {u.post_count} 篇
                      <span className="text-xs opacity-60">→</span>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
