import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Copy, CopyCheck, ThumbsUp, X } from 'lucide-react';
import { formatDateTime, fmtDisplayId, APP_CONFIG } from '../types';
import { getLikes, hasUserLiked, toggleLike } from '../utils/storage';
import type { Log } from '../types';

interface LogItemProps {
  log: Log | { id: string; content: string; created_at: string | null; user_id: string; is_public?: boolean | null; published_at?: string | null; tags?: string[] | null; canDelete?: boolean };
  index?: number;
  displayId?: number | null;
  currentUser?: { user_id: string } | null;
  onDelete?: (logId: string) => void;
}

const MAX_PREVIEW_LENGTH = 50;

export function LogItem({ log, index = 0, displayId, currentUser, onDelete }: LogItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [likeError, setLikeError] = useState('');
  const needsCollapse = log.content.length > MAX_PREVIEW_LENGTH;

  useEffect(() => {
    getLikes(log.id, 'log').then(setLikeCount);
    if (currentUser) {
      hasUserLiked(log.id, 'log', currentUser.user_id).then(setLiked);
    }
  }, [log.id, currentUser]);

  const handleLike = async () => {
    if (!currentUser || likeLoading) return;
    setLikeLoading(true);
    setLikeError('');
    const result = await toggleLike(log.id, 'log', currentUser.user_id);
    if (!result.error) {
      setLiked(result.liked);
      setLikeCount(result.count);
    } else {
      setLikeError(result.error);
      setTimeout(() => setLikeError(''), 3000);
    }
    setLikeLoading(false);
  };

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

      {/* 时间和操作按钮 */}
      <footer className="mt-2 flex items-center justify-between">
        <time
          itemProp="datePublished"
          dateTime={log.published_at || log.created_at || new Date().toISOString()}
          className="text-xs text-[var(--text-tertiary)]"
        >
          {formatDateTime(log.published_at || log.created_at || '')}
        </time>
        <div className="flex items-center gap-3">
          {/* 点赞按钮 */}
          {currentUser && (
            <button
              onClick={handleLike}
              disabled={likeLoading}
              className={`text-xs transition-colors flex items-center gap-1 ${
                likeError ? 'text-red-500' : liked ? 'text-blue-500' : 'text-[var(--text-tertiary)] hover:text-blue-500'
              }`}
              title={likeError || (liked ? '取消点赞' : '点赞')}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${liked && !likeError ? 'fill-blue-500' : ''}`} />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>
          )}
          <button
            onClick={handleCopyLink}
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors flex items-center gap-1"
            title="复制链接"
          >
            {copied ? <CopyCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '已复制' : '复制链接'}
          </button>
          {/* 删除按钮（可删除状态 + 有 onDelete 回调时显示） */}
          {'canDelete' in log && log.canDelete && onDelete && (
            <button
              onClick={() => onDelete(log.id)}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
              title="删除此日志"
            >
              <X className="w-3.5 h-3.5" />
              删除
            </button>
          )}
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
