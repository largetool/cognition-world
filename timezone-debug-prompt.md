# Bug: 北京时间显示为 UTC 时间

## 问题描述
北京时间 18:13，页面显示 10:13。正好差 8 小时，说明显示的是 UTC，我写的 CST 手动偏移转换没有生效。

## 环境
- Next.js 14 + React 18
- Vercel 部署
- Supabase timestamptz 列存储

## 代码改动

**`src/types/index.ts`** — 删除了 `toLocaleString(timeZone)`，改为手动 CST 偏移：

```ts
const CST_MS = 8 * 60 * 60 * 1000; // UTC+8 偏移毫秒

export function parseSupabaseTime(date: string | Date): Date {
  if (date instanceof Date) return date;
  if (typeof date === 'string') {
    const trimmed = date.trim();
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      return new Date(trimmed.replace(' ', 'T') + 'Z');
    }
  }
  return new Date(date);
}

function toCSTComponents(date: Date): { year: number; month: string; day: string; hours: string; minutes: string } {
  const cst = new Date(date.getTime() + CST_MS);
  return {
    year: cst.getUTCFullYear(),
    month: String(cst.getUTCMonth() + 1).padStart(2, '0'),
    day: String(cst.getUTCDate()).padStart(2, '0'),
    hours: String(cst.getUTCHours()).padStart(2, '0'),
    minutes: String(cst.getUTCMinutes()).padStart(2, '0'),
  };
}

export function formatDateTime(date: string | Date): string {
  const d = parseSupabaseTime(date);
  const c = toCSTComponents(d);
  return `${c.year}/${c.month}/${c.day} ${c.hours}:${c.minutes}`;
}
```

**`src/pages/MePage.tsx`** — 新增内联 `formatTimeCST` 函数：
```ts
function formatTimeCST(dateStr: string | null | undefined): string {
  if (!dateStr) return '2025-05-01';
  const date = parseSupabaseTime(dateStr);
  if (isNaN(date.getTime())) return '2025-05-01';
  const cst = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const month = String(cst.getUTCMonth() + 1).padStart(2, '0');
  const day = String(cst.getUTCDate()).padStart(2, '0');
  const hours = String(cst.getUTCHours()).padStart(2, '0');
  const minutes = String(cst.getUTCMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}
```

## 排查方向

1. **代码是否运行到了？** 在 `formatTimeCST` 和 `formatDateTime` 函数开头加 `console.log('formatTimeCST called', dateStr)`，看控制台有没有输出。如果没输出，说明代码根本没运行到（可能是 tree-shaking 或 chunk 加载问题）。

2. **`parseSupabaseTime` 返回的是什么？** 检查 Supabase 返回的 `created_at` / `published_at` 的原始格式。在 `getLogsDirectInline` 的 `.map()` 里加 log 看原始数据：
   ```ts
   console.log('raw log.created_at:', log.created_at, typeof log.created_at);
   ```
   看它是 `2026-06-23T10:13:00+00:00` 还是 `2026-06-23T10:13:00` 还是 `2026-06-23 10:13:00`。

3. **New Date 解析是否正确？** 改 `parseSupabaseTime` 直接返回 `new Date(dateStr)` 而不加处理，看效果。

4. **是否旧的 `toLocaleString` 调用残留？** 全局搜索 `timeZone` 和 `toLocaleString` 确保所有时区格式化都已替换为手动偏移。

5. **生产构建问题？** 本地 `npm run build && npm run start` 是否复现？如果本地是对的但线上不对，可能是 Vercel 构建缓存问题。

6. **日志是否取的是 `published_at` 而不是 `created_at`？** 在 LogItem 里 `formatDateTime(log.published_at || log.created_at || '')` — 如果 `published_at` 是 `new Date(Date.now() + 10min).toISOString()` 生成的 UTC 字符串，`parseSupabaseTime` 能否正确处理？
