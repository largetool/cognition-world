import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';

const DAY_NAMES = ['一', '二', '三', '四', '五', '六', '日'];
const CST_OFFSET = 8 * 60 * 60 * 1000;

interface CalendarWidgetProps {
  year: number;
  month: number;
  /** day number → log count */
  dailyCounts: Record<number, number>;
  /** 总日志数（本月） */
  totalCount: number;
  /** 紧凑模式（首页使用） */
  compact?: boolean;
}

/** 判断某天是不是今天（CST） */
function isTodayCST(year: number, month: number, day: number): boolean {
  const now = new Date();
  const cstNow = new Date(now.getTime() + CST_OFFSET);
  return (
    cstNow.getUTCFullYear() === year &&
    cstNow.getUTCMonth() + 1 === month &&
    cstNow.getUTCDate() === day
  );
}

export default function CalendarWidget({
  year,
  month,
  dailyCounts,
  totalCount,
  compact = false,
}: CalendarWidgetProps) {
  // 生成日历网格数据
  const grid = useMemo(() => {
    // 该月第一天（CST）
    const firstDay = new Date(Date.UTC(year, month - 1, 1));
    // 该月天数
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    // 第一天是星期几（0=Sun, 1=Mon, ...）
    // 我们需要 Mon=0, Sun=6
    const startDow = (firstDay.getUTCDay() + 6) % 7; // Mon=0, Tue=1, ..., Sun=6

    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];

    // 填充月初空白
    for (let i = 0; i < startDow; i++) {
      currentWeek.push(null);
    }

    // 填充日期
    for (let d = 1; d <= daysInMonth; d++) {
      currentWeek.push(d);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // 月末空白补全
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return { weeks, daysInMonth };
  }, [year, month]);

  // 当月显示名称
  const monthLabel = `${year}年${month}月`;

  if (compact) {
    // 紧凑模式：用于首页
    return (
      <Link
        to={`/logs/${year}/${month}`}
        className="block group"
      >
        <div className="rounded-2xl p-5 bg-white/60 backdrop-blur-xl border border-white/80 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">{monthLabel}</div>
              <div className="text-2xl font-bold text-gray-900">
                {totalCount.toLocaleString()}
                <span className="text-sm font-normal text-gray-500 ml-1">篇日志</span>
              </div>
            </div>
          </div>

          {/* 微型日历网格 */}
          <div className="grid grid-cols-7 gap-0.5">
            {DAY_NAMES.map((name) => (
              <div
                key={name}
                className="text-center text-[10px] text-gray-400 font-medium py-0.5"
              >
                {name}
              </div>
            ))}
            {grid.weeks.flat().map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const count = dailyCounts[day] || 0;
              const today = isTodayCST(year, month, day);
              const hasLogs = count > 0;

              let cellClass = 'text-center text-[11px] py-0.5 rounded ';
              if (today && hasLogs) {
                cellClass += 'bg-indigo-100 text-indigo-700 font-bold';
              } else if (today) {
                cellClass += 'bg-gray-100 text-gray-500 font-medium';
              } else if (hasLogs) {
                cellClass += 'text-gray-700 font-medium';
              } else {
                cellClass += 'text-gray-300';
              }

              return (
                <div key={day} className={cellClass}>
                  {day}
                </div>
              );
            })}
          </div>

          <div className="mt-2 text-xs text-indigo-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            查看完整日历 →
          </div>
        </div>
      </Link>
    );
  }

  // 完整模式：用于 /logs/[year]/[month] 页面
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="text-center text-xs font-medium text-gray-400 py-1"
          >
            {name}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.weeks.flat().map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;

          const count = dailyCounts[day] || 0;
          const today = isTodayCST(year, month, day);
          const hasLogs = count > 0;

          // 强度色阶：日志越多颜色越深
          let intensity = 'bg-gray-50 text-gray-300';
          let badgeColor = '';
          if (hasLogs) {
            if (count <= 3) {
              intensity = 'bg-indigo-50 text-indigo-700';
              badgeColor = 'bg-indigo-200 text-indigo-700';
            } else if (count <= 10) {
              intensity = 'bg-indigo-100 text-indigo-800';
              badgeColor = 'bg-indigo-300 text-indigo-800';
            } else if (count <= 50) {
              intensity = 'bg-indigo-200 text-indigo-900';
              badgeColor = 'bg-indigo-400 text-white';
            } else {
              intensity = 'bg-indigo-300 text-indigo-900';
              badgeColor = 'bg-indigo-500 text-white';
            }
          }

          const cellContent = (
            <div
              className={`
                relative aspect-square rounded-lg flex flex-col items-center justify-center
                ${hasLogs ? intensity + ' cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all' : intensity}
                ${today ? 'ring-2 ring-indigo-500' : ''}
              `}
            >
              <span className={`text-sm font-semibold ${!hasLogs ? 'text-gray-300' : ''}`}>
                {day}
              </span>
              {hasLogs && (
                <span className={`text-[10px] leading-none mt-0.5 px-1 rounded-full ${badgeColor || 'text-indigo-500'}`}>
                  {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
                </span>
              )}
            </div>
          );

          if (hasLogs) {
            return (
              <Link
                key={day}
                to={`/logs/${year}/${month}/${day}`}
                className="block"
              >
                {cellContent}
              </Link>
            );
          }

          return <div key={day}>{cellContent}</div>;
        })}
      </div>
    </div>
  );
}
