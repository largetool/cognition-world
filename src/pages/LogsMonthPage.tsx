import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import CalendarWidget from '../components/CalendarWidget';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { SEOHead } from '../components/SEOHead';
import { APP_CONFIG, getDefaultSEO } from '../types';
import { useAuth } from '../hooks/useAuth';
import { generateBreadcrumbList, breadcrumbs } from '../utils/seo';
import { useSSRData } from '../utils/SSRContext';

const CST_OFFSET = 8 * 60 * 60 * 1000;
const SUPABASE_URL = 'https://nbgsichilfrjsopnnvia.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZ3NpY2hpbGZyanNvcG5udmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMTE1MjMsImV4cCI6MjA5NTg4NzUyM30.fWr-ZoDhirVgsKGsL8BWeP36iQ235GuQ4iF_GYK0RH0';

interface DayCount {
  day: number;
  count: number;
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

async function fetchMonthData(year: number, month: number): Promise<{ dayCounts: DayCount[]; totalCount: number }> {
  const { utcStart, utcEnd } = getMonthUTCRange(year, month);

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/logs?select=created_at&created_at=gte.${encodeURIComponent(utcStart)}&created_at=lt.${encodeURIComponent(utcEnd)}`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch logs: ${res.status}`);
  }

  const logs = await res.json();
  const logsArr: any[] = Array.isArray(logs) ? logs : [];

  // 按 CST 日期分组
  const dailyCounts: Record<number, number> = {};
  logsArr.forEach((log: any) => {
    const cstDate = new Date(new Date(log.created_at).getTime() + CST_OFFSET);
    const day = cstDate.getUTCDate();
    dailyCounts[day] = (dailyCounts[day] || 0) + 1;
  });

  const dayCounts: DayCount[] = Object.entries(dailyCounts)
    .map(([day, count]) => ({ day: parseInt(day, 10), count }))
    .sort((a, b) => a.day - b.day);

  const totalCount = dayCounts.reduce((sum, d) => sum + d.count, 0);

  return { dayCounts, totalCount };
}

export default function LogsMonthPage() {
  const { year: yearParam, month: monthParam } = useParams<{ year: string; month: string }>();
  const { user } = useAuth();
  const ssrData = useSSRData();

  const year = parseInt(yearParam || '0', 10);
  const month = parseInt(monthParam || '0', 10);
  const isValid = !isNaN(year) && !isNaN(month) && year >= 2024 && year <= 2099 && month >= 1 && month <= 12;

  const [dayCounts, setDayCounts] = useState<DayCount[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isValid) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const data = await fetchMonthData(year, month);
        if (!cancelled) {
          setDayCounts(data.dayCounts);
          setTotalCount(data.totalCount);
        }
      } catch (err) {
        console.error('Failed to load month data:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [year, month, isValid]);

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

  const dailyCountsMap: Record<number, number> = {};
  dayCounts.forEach((d) => { dailyCountsMap[d.day] = d.count; });

  // 上一月 / 下一月
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const title = `${year}年${month}月 — 共${totalCount.toLocaleString()}篇日志 — ${APP_CONFIG.name}`;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <SEOHead
        data={{
          title,
          description: `${year}年${month}月，认知界共有${totalCount.toLocaleString()}篇公开日志`,
          canonicalUrl: `${APP_CONFIG.url}/logs/${year}/${month}`,
          ogType: 'website',
        }}
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            generateBreadcrumbList([
              breadcrumbs.home,
              { name: `${year}年${month}月日志`, url: `${APP_CONFIG.url}/logs/${year}/${month}` },
            ]),
          ],
        }}
      />
      <Navbar user={user} />

      <main className="max-w-2xl mx-auto px-4 pt-24 pb-12">
        {/* 导航标题 */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to={`/logs/${prevYear}/${prevMonth}`}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {prevYear}年{prevMonth}月
          </Link>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {year}年{month}月
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              共 {totalCount.toLocaleString()} 篇日志
            </p>
          </div>

          <Link
            to={`/logs/${nextYear}/${nextMonth}`}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
          >
            {nextYear}年{nextMonth}月
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 日历网格 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {isLoading ? (
            <div className="rounded-2xl p-8 bg-white/60 backdrop-blur-xl border border-white/80">
              <div className="animate-pulse space-y-4">
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-gray-100" />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-6 bg-white/60 backdrop-blur-xl border border-white/80 shadow-lg">
              <CalendarWidget
                year={year}
                month={month}
                dailyCounts={dailyCountsMap}
                totalCount={totalCount}
              />
            </div>
          )}
        </motion.div>

        {/* 活跃日摘要 */}
        {!isLoading && dayCounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-8"
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              活跃日期
            </h2>
            <div className="flex flex-wrap gap-2">
              {dayCounts.map((d) => (
                <Link
                  key={d.day}
                  to={`/logs/${year}/${month}/${d.day}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-sm hover:bg-indigo-100 transition-colors"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span className="font-medium">{d.day}日</span>
                  <span className="text-indigo-400">{d.count}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
