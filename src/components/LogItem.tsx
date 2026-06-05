import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { formatDateTime } from '../types';
import type { Log } from '../types';

interface LogItemProps {
  log: Log | { id: string; content: string; created_at: string | null; user_id: string; is_public?: boolean | null; published_at?: string | null };
  index?: number;
  userId?: string;
}

const MAX_PREVIEW_LENGTH = 50;

export function LogItem({ log, index = 0, userId }: LogItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const needsCollapse = log.content.length > MAX_PREVIEW_LENGTH;

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
        {userId && (
          <Link
            to={`/${userId}/thought/${log.id}`}
            className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors flex items-center gap-1"
            itemProp="url"
            title={log.content.slice(0, 100)}
          >
            查看详情
          </Link>
        )}
      </footer>
    </motion.article>
  );
}
