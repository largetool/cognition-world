import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Copy, CopyCheck, ThumbsUp, X, MapPin } from 'lucide-react';
import { formatDateTime, fmtDisplayId, APP_CONFIG } from '../types';
import { getLikes, hasUserLiked, toggleLike } from '../utils/storage';
import type { Log } from '../types';

interface LogItemProps {
  log: Log | { id: string; content: string; created_at: string | null; user_id: string; is_public?: boolean | null; published_at?: string | null; tags?: string[] | null; canDelete?: boolean; category?: string | null; location?: string | null };
  index?: number;
  displayId?: number | null;
  currentUser?: { user_id: string } | null;
  onDelete?: (logId: string) => void;
}

const MAX_PREVIEW_LENGTH = 100;

// 分类显示配置
const CATEGORY_CONFIG: Record<string, { label: string; textColor: string; bgColor: string; borderColor: string }> = {
  experience: { label: '回忆', textColor: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
  present:   { label: '此刻', textColor: 'text-sky-400',  bgColor: 'bg-sky-500/10',   borderColor: 'border-sky-500/20' },
  future:    { label: '预测', textColor: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
};

/** 从时间戳提取"年月"显示，用于分类时间绑定 */
function categoryDateLabel(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月`;
  } catch {
    return '';
  }
}

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
      console.error('[LogItem] toggleLike error:', result.error);
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

  const isHidden = !!(log as any).is_hidden;
  const isOwner = currentUser && currentUser.user_id === log.user_id;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
      className={`glass-card rounded-xl p-4 mb-3 relative ${isHidden ? 'overflow-hidden' : ''}`}
      itemScope
      itemType="https://schema.org/SocialMediaPosting"
    >
      {/* 违规隐藏遮罩 — 仅内容所有者可见 */}
      {isHidden && isOwner && (
        <div className="absolute inset-0 z-10 bg-gray-900/60 rounded-xl flex items-center justify-center pointer-events-none">
          <div className="text-center px-4">
            <p className="text-white text-sm font-medium mb-1">因违规已被隐藏</p>
            <p className="text-gray-300 text-xs">此内容不对外展示，仅您自己可见</p>
          </div>
        </div>
      )}

      {/* Schema.org 微数据 */}
      <meta itemProp="headline" content={log.content.slice(0, 100)} />
      <meta itemProp="articleBody" content={log.content} />
      {log.category && <meta itemProp="articleSection" content={CATEGORY_CONFIG[log.category]?.label || log.category} />}
      {log.location && <meta itemProp="contentLocation" content={log.location} />}

      {/* 分类 + 地理位置 标签（半固定式便签体系） */}
      {(log.category || log.location) && (
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {log.category && (() => {
            const cfg = CATEGORY_CONFIG[log.category];
            if (!cfg) return null;
            return (
              <span className={`text-xs px-2.5 py-0.5 rounded-full ${cfg.bgColor} ${cfg.textColor} border ${cfg.borderColor} font-medium`}>
                {cfg.label} · {categoryDateLabel(log.created_at)}
              </span>
            );
          })()}
          {log.location && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {log.location}
            </span>
          )}
        </div>
      )}

      {/* 只渲染一份内容 */}
      <div className={`log-content-wrapper ${isHidden && isOwner ? 'opacity-40' : ''}`} itemProp="text">
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
