import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Copy, CopyCheck } from 'lucide-react';
import { formatDateTime, fmtDisplayId, APP_CONFIG } from '../types';
import type { Log } from '../types';

interface LogItemProps {
  log: Log | { id: string; content: string; created_at: string | null; user_id: string; is_public?: boolean | null; published_at?: string | null; tags?: string[] | null };
  index?: number;
  displayId?: number | null;
}

const MAX_PREVIEW_LENGTH = 50;

export function LogItem({ log, index = 0, displayId }: LogItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const needsCollapse = log.content.length > MAX_PREVIEW_LENGTH;

  const handleCopyLink = async () => {
    const url = `${APP_CONFIG.url}/${fmtDisplayId(displayId ?? 0)}/thought/${log.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
      className="glass-card rounded-xl p-4 mb-3"
      itemScope
      itemType="https://schema.org/SocialMediaPosting"
    >
      {/* Schema.org 微数据 */}
      <meta itemProp="headline" content={log.content.slice(0, 100)} />
      <meta itemProp="articleBody" content={log.content} />

      {/* 只渲染一份内容：SSR 时输出完整文本供爬虫读取，客户端用 line-clamp 控制视觉截断 */}
      <div className="log-content-wrapper" itemProp="text">
        <p
          className={`text-[var(--text-primary)] whitespace-pre-wrap ${needsCollapse && !isExpanded ? 'line-clamp-2' : ''}`}
        >
          {log.content}
        </p>
      </div>

      {/* 标签 */}
      {log.tags && log.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {log.tags.map((tag: string, ti: number) => (
            <span
              key={ti}
              className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 展开/收起按钮 */}
      {needsCollapse && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
        >
          {isExpanded ? '收起' : '展开全文'}
        </button>
      )}

      {/* 时间和链接 - 使用语义化 time 标签 */}
      <footer className="mt-2 flex items-center justify-between">
        <time
          itemProp="datePublished"
          dateTime={log.published_at || log.created_at || new Date().toISOString()}
          className="text-xs text-[var(--text-tertiary)]"
        >
          {formatDateTime(log.published_at || log.created_at || '')}
        </time>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyLink}
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors flex items-center gap-1"
            title="复制链接"
          >
            {copied ? <CopyCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '已复制' : '复制链接'}
          </button>
          {displayId != null && (
            <Link
              to={`/${fmtDisplayId(displayId)}/thought/${log.id}`}
              className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors flex items-center gap-1"
              itemProp="url"
              title={log.content.slice(0, 100)}
            >
              查看详情
            </Link>
          )}
        </div>
      </footer>
    </motion.article>
  );
}
