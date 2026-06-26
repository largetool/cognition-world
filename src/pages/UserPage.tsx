import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Edit3, Share2, MapPin, Calendar, Eye, EyeOff, Send, ChevronLeft, ChevronRight, ArrowUp, Flag, X, AlertTriangle, ShieldAlert, UserX, Clock, Lock, CheckCircle, Trash2 } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { GlassCard } from '../components/GlassCard';
import { LogItem } from '../components/LogItem';
import { BlockedPage } from '../components/BlockedPage';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../hooks/useUser';
import { useIPCheck } from '../hooks/useIPCheck';
import { createLog, createLogWithModeration, getAccountHideStatus, requestAccountHide, cancelAccountHide, requestAccountRestore, isUserExemptFromReview, deleteLog, batchDeleteLogs, isLogDeletableLocal, cleanupDeletableLogs, type AccountHideStatus, type LogWithPublicStatus } from '../utils/storage';
import { getUserSEO, isAdminFromProfile, getInitials, APP_CONFIG, getDefaultSEO } from '../types';
import { supabase } from '../supabase/client';
import { generateProfilePageSchema, generatePersonSchema, generateBlogPostingSchema } from '../utils/seo';
import { useSSRData } from '../utils/SSRContext';
import type { Profile } from '../types';
import { t, getCurrentLanguage } from '../locales';
import { parseSupabaseTime } from '../types';
import { EXTERNAL_LINK_PLATFORMS, getPlatformConfig } from '../data/externalLinks';

const LOGS_PER_PAGE = 10;

const defaultBg = '/assets/C2283395-46CF-48E8-B1EC-3813518039AE.jpg';

// 生成用户头像 URL
function generateUserAvatar(username: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}&backgroundColor=1a1a2e&textColor=e6e6e6`;
}

// 生成增强的 JSON-LD 结构化数据
interface LogForSEO {
  id: string;
  content: string;
  created_at: string | null;
  updated_at?: string | null;
  tags?: string[] | null;
}

function padDisplayId(id: number | null): string {
  return String(id ?? 0).padStart(9, '0');
}

function generateEnhancedProfileSchema(profile: Profile, recentLogs: LogForSEO[]) {
  const profileUrl = `${APP_CONFIG.url}/${padDisplayId(profile.display_id)}`;
  const avatarUrl = generateUserAvatar(profile.username);

  // 基础 ProfilePage 结构
  const schema: any = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': profileUrl,
        name: `${profile.username} - ${APP_CONFIG.name}`,
        description: profile.slogan || `${profile.tag} | ${APP_CONFIG.name}`,
        url: profileUrl,
        inLanguage: 'zh-CN',
        dateModified: profile.updated_at,
        mainEntity: {
          '@type': 'Person',
          '@id': `${profileUrl}#person`,
          name: profile.username,
          alternateName: profile.user_id,
          jobTitle: profile.tag,
          description: profile.slogan,
          image: avatarUrl,
          identifier: {
            '@type': 'PropertyValue',
            name: 'display_id',
            value: String(profile.display_id).padStart(9, '0'),
          },
          address: {
            '@type': 'PostalAddress',
            addressLocality: profile.location,
          },
          url: profileUrl,
        },
        isPartOf: {
          '@type': 'WebSite',
          name: APP_CONFIG.name,
          url: APP_CONFIG.url,
        },
      },
    ],
  };

  // 添加最近的日志作为 BlogPosting
  if (recentLogs && recentLogs.length > 0) {
    const blogPostings = recentLogs.map((log, index) => {
      const posting: any = {
        '@type': 'BlogPosting',
        '@id': `${profileUrl}#log-${log.id}`,
        headline: log.content.slice(0, 60),
        articleBody: log.content,
        author: {
          '@type': 'Person',
          '@id': `${profileUrl}#person`,
          name: profile.username,
        },
        datePublished: log.created_at,
        dateModified: log.updated_at || log.created_at,
        url: `${profileUrl}#log-${index}`,
        isPartOf: {
          '@type': 'ProfilePage',
          '@id': profileUrl,
        },
      };
      if (log.tags && log.tags.length > 0) {
        posting.about = log.tags.map(tag => ({ '@type': 'Thing', name: tag }));
      }
      return posting;
    });

    schema['@graph'].push(...blogPostings);
  }

  return schema;
}

// SSR 预取数据接口 — Next.js getServerSideProps 通过此 props 传递预取数据
export interface UserPageSSRProps {
  ssrUserId?: string;
  ssrProfile?: Profile | null;
  ssrLogs?: LogWithPublicStatus[];
  ssrActiveBg?: { url: string } | null;
  ssrNotFound?: boolean;
}

export default function UserPage() {
  const params = useParams<{ displayId: string }>();
  // 尝试读取 SSR 预取数据（来自 getServerSideProps）
  const ssrData = useSSRData();
  const ssrUserId = ssrData.ssrUserId;
  const ssrProfile = ssrData.ssrProfile as Profile | undefined;
  const ssrLogs = ssrData.ssrLogs as LogWithPublicStatus[] | undefined;
  const ssrActiveBg = ssrData.ssrActiveBg as { url: string } | null | undefined;
  const ssrNotFound = ssrData.ssrNotFound;

  // displayId 来自 URL（纯数字），user_id 来自 SSR 数据（内部标识符）
  const displayId = params.displayId;
  const userId = ssrUserId || displayId;
  const navigate = useNavigate();
  const { user: currentUser } = useAuth() as { user: Profile | null };

  // SSR 模式：使用预取数据；客户端模式：使用 useUser hook 拉取
  const clientUserData = useUser(ssrProfile !== undefined ? undefined : userId, currentUser?.is_admin ?? undefined);
  const profile = ssrProfile !== undefined ? ssrProfile : clientUserData.profile;
  const logs = ssrLogs !== undefined ? ssrLogs : clientUserData.logs;
  const activeBackground = ssrActiveBg !== undefined ? ssrActiveBg : clientUserData.activeBackground;
  const isLoading = ssrProfile !== undefined ? false : clientUserData.isLoading;
  const error = ssrNotFound ? '该用户不存在' : (ssrProfile !== undefined ? null : clientUserData.error);
  const refreshLogs = clientUserData.refreshLogs;
  const { isBlocked, isLoading: ipLoading } = useIPCheck();

  // 为 SSR 日志补充 canDelete（管理员可在任何用户页删除任意日志）
  const logsWithDelete = useMemo(() => {
    cleanupDeletableLogs();
    const now = new Date();
    const isAdmin = currentUser?.is_admin === true;
    const currentUserId = currentUser?.user_id;
    return logs.map(log => {
      if ('canDelete' in log && log.canDelete) return log;
      // localStorage 优先（用户自己发布的日志）
      const localDeletable = currentUserId === log.user_id && isLogDeletableLocal(log.id);
      if (localDeletable) return { ...log, canDelete: true };
      // 兜底：created_at + 10分钟
      const ct = parseSupabaseTime(log.created_at || '');
      const tenMin = new Date(ct.getTime() + 10 * 60 * 1000);
      const canDel = isAdmin || (currentUserId === log.user_id && now < tenMin);
      return { ...log, canDelete: canDel };
    });
  }, [logs, currentUser]);
  const [logContent, setLogContent] = useState('');
  const [logTags, setLogTags] = useState('');
  const [logCategory, setLogCategory] = useState<string>('');   // 分类：experience / present / future
  const [logLocation, setLogLocation] = useState<string>('');   // 地理位置（选填）
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logError, setLogError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingLogIds, setDeletingLogIds] = useState<Set<string>>(new Set());
  // 管理员多选批量删除
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  // 举报相关状态
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingItem, setReportingItem] = useState<{ id: string; content: string; type: 'log' | 'message'; user_id: string; username: string } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState('');

  // 隐藏账户已移至 MePage 编辑资料

  // 分页计算
  const totalPages = Math.ceil(logsWithDelete.length / LOGS_PER_PAGE);
  const paginatedLogs = logsWithDelete.filter(l => !deletingLogIds.has(l.id)).slice((currentPage - 1) * LOGS_PER_PAGE, currentPage * LOGS_PER_PAGE);

  const isCurrentUser = currentUser?.user_id === profile?.user_id;
  const isAdminUser = isAdminFromProfile(currentUser);
  const canPostLog = isCurrentUser || isAdminUser;
  const isLoggedIn = !!currentUser;

  const handleSubmitLog = async () => {
    if (!logContent.trim() || !profile) return;

    const tags = logTags
      .split(/[,，]/)
      .map(t => t.trim())
      .filter(Boolean);

    setIsSubmitting(true);

    // 带 AI 审核的发布
    const result = await createLogWithModeration(profile.user_id, logContent.trim(), tags, logCategory || undefined, logLocation.trim() || undefined);

    if (result.success) {
      setLogContent('');
      setLogTags('');
      setLogCategory('');
      setLogLocation('');
      refreshLogs();
    } else if (result.rejected) {
      setLogError(result.reason || '内容包含违规信息，请修改后重新发布');
    } else {
      setLogError(result.error || '发布失败，请稍后重试');
    }

    setIsSubmitting(false);
  };

  // 打开举报弹窗
  const openReportModal = (item: { id: string; content: string; type: 'log' | 'message'; user_id: string; username: string }) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (item.user_id === currentUser.user_id) {
      return; // 不能举报自己
    }
    setReportingItem(item);
    setReportReason('');
    setReportSuccess(false);
    setReportError('');
    setReportModalOpen(true);
  };

  // 关闭举报弹窗
  const closeReportModal = () => {
    setReportModalOpen(false);
    setReportingItem(null);
    setReportReason('');
    setReportSuccess(false);
  };

  // 提交举报
  const handleReportSubmit = async () => {
    if (!reportingItem || !currentUser || !reportReason.trim()) return;

    setReportSubmitting(true);
    setReportError('');
    try {
      // 直接插入 reports 表（绕过有问题的 Edge Function）
      const { error: insertError } = await supabase
        .from('reports')
        .insert({
          reported_message_id: reportingItem.id,
          message_table: reportingItem.type === 'log' ? 'logs' : 'user_messages',
          message_content: reportingItem.content,
          reported_user_id: reportingItem.user_id,
          reporter_id: currentUser.user_id,
          reason: reportReason.trim(),
          status: 'pending',
        });

      if (insertError) {
        setReportError(insertError.message || '举报提交失败，请稍后重试');
        console.error('举报失败:', insertError);
      } else {
        // 通知管理员（通过 SECURITY DEFINER RPC 写入 notifications 表）
        try {
          await (supabase.rpc as any)('add_report_notification', {
            p_reporter_username: currentUser.username || '未知用户',
            p_reason: reportReason.trim(),
            p_content_preview: reportingItem.content.slice(0, 200),
          });
        } catch (_) {
          // 通知失败不影响举报提交
          console.warn('[举报] 管理员通知发送失败（举报已提交）');
        }

        setReportSuccess(true);
        setTimeout(() => {
          closeReportModal();
        }, 2000);
      }
    } catch (err) {
      setReportError('网络异常，举报提交失败，请稍后重试');
      console.error('举报提交失败:', err);
    } finally {
      setReportSubmitting(false);
    }
  };

  // 获取账户隐藏状态

  // 登录后同步 auth_user_id（fire-and-forget，确保 RLS 点赞策略能找到匹配）
  useEffect(() => {
    if (currentUser) {
      supabase.rpc('sync_my_auth_id').then(undefined, () => {});
    }
  }, [currentUser]);


  // 管理员/所有者删除日志
  const handleDeleteLog = async (logId: string) => {
    if (!profile || !currentUser) return;
    if (!confirm('确定要删除此日志？')) return;
    setDeletingLogIds(prev => new Set(prev).add(logId));
    const result = await deleteLog(logId, profile.user_id, currentUser.is_admin || false);
    if (result.success) {
      refreshLogs();
    } else {
      setDeletingLogIds(prev => { const next = new Set(prev); next.delete(logId); return next; });
      alert('删除失败：' + result.error);
    }
  };

  // ===== 管理员多选批量删除 =====

  const toggleSelectLog = (logId: string) => {
    setSelectedLogIds(prev => {
      const next = new Set(prev);
      if (next.has(logId)) next.delete(logId); else next.add(logId);
      return next;
    });
  };

  const selectAllCurrentPage = () => {
    const currentIds = paginatedLogs.map(l => l.id);
    setSelectedLogIds(prev => {
      const next = new Set(prev);
      const allSelected = currentIds.every(id => prev.has(id));
      if (allSelected) {
        currentIds.forEach(id => next.delete(id));
      } else {
        currentIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const selectAllAcrossPages = async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('logs')
      .select('id')
      .eq('user_id', profile.user_id);
    if (!error && data) {
      setSelectedLogIds(new Set(data.map(d => d.id)));
      alert(`已选择全部 ${data.length} 条日志`);
    } else {
      alert('获取日志列表失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedLogIds.size === 0) return;
    if (!confirm(`⚠️ 确定要删除选中的 ${selectedLogIds.size} 条日志吗？此操作不可撤销！`)) return;
    if (!confirm(`⚠️ 再次确认：删除 ${selectedLogIds.size} 条日志后无法恢复，确定继续？`)) return;

    setIsBatchDeleting(true);
    const result = await batchDeleteLogs([...selectedLogIds]);
    setSelectedLogIds(new Set());
    refreshLogs();
    alert(`批量删除完成：成功 ${result.success} 条${result.failed > 0 ? `，失败 ${result.failed} 条` : ''}`);
    setIsBatchDeleting(false);
  };

  if (ipLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]" />
      </div>
    );
  }

  if (isBlocked) {
    return <BlockedPage />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            该用户不存在
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">
            请检查链接是否正确
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <SEOHead
        data={profile ? getUserSEO(profile, logs.slice(0, 5)) : getDefaultSEO()}
        jsonLd={profile ? generateEnhancedProfileSchema(profile, logs.slice(0, 5)) : undefined}
      />

      {/* 账户冻结提示横幅 */}
      {profile?.is_frozen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-[60] bg-red-500 text-white px-4 py-3"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              该账户已被冻结
              {profile.frozen_reason && `：${profile.frozen_reason}`}
            </p>
          </div>
        </motion.div>
      )}

      {/* 用户主动隐藏 - 冷静期提示 */}
      {profile?.hide_status === 'cooling' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-[60] bg-amber-500 text-white px-4 py-3"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
            <Clock className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              {isCurrentUser
                ? '你已申请隐藏账户，冷静期中。3 天后账户将暂停展示。'
                : '该用户已申请隐藏账户，冷静期中。3 天后账户将暂停展示。'}
            </p>
          </div>
        </motion.div>
      )}

      {/* 用户主动隐藏 - 冻结期提示 */}
      {profile?.hide_status === 'frozen' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-[60] bg-gray-500 text-white px-4 py-3"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
            <Lock className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              {isCurrentUser
                ? '你的账户已暂停展示。冻结期满 6 个月后可申请恢复。'
                : '该用户已暂停展示'}
            </p>
          </div>
        </motion.div>
      )}

      <div className={`relative ${profile?.is_frozen || profile?.hide_status === 'cooling' || profile?.hide_status === 'frozen' ? 'pt-12' : ''}`}>
        <div
          className="absolute top-0 left-0 right-0 h-[50vh] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${activeBackground?.url || defaultBg}')`,
            backgroundPosition: 'center top',
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-[50vh] bg-user-gradient" />

        <div className="relative z-10">
          <div className="glass border-b border-white/20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <Link
                  to="/"
                  className="flex items-center space-x-2 text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>返回首页</span>
                </Link>

                <div className="flex items-center space-x-2">
                  {isAdminUser && (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                      GM
                    </span>
                  )}
                  <button
                    onClick={async () => {
                      const url = `${APP_CONFIG.url}/${padDisplayId(profile.display_id)}`;
                      if (navigator.share) {
                        await navigator.share({
                          title: `${profile.username} - 认知界`,
                          text: profile.slogan || profile.tag,
                          url,
                        });
                      } else {
                        await navigator.clipboard.writeText(url);
                        alert('链接已复制到剪贴板');
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <Share2 className="w-5 h-5 text-[var(--text-primary)]" />
                  </button>
                  {(isCurrentUser || isAdminUser) && (
                    <Link
                      to="/me"
                      className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <Edit3 className="w-5 h-5 text-[var(--text-primary)]" />
                    </Link>
                  )}
                  {/* 隐藏账户已移至「我的」页面编辑资料中 */}
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center"
            >
              <div className="w-24 h-24 rounded-2xl bg-[var(--accent)] flex items-center justify-center text-white text-4xl font-bold mb-6">
                {getInitials(profile.username)}
              </div>

              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                  {profile.username}
                </h1>
                {/* 页面所有者标识 */}
                {isCurrentUser && (
                  <span className="px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-medium">
                    这是你的主页
                  </span>
                )}
              </div>

              <p className="text-[var(--text-secondary)] mb-2">
                {profile.tag}
              </p>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--bg-secondary)] rounded-full mb-4">
                <span className="text-xs text-[var(--text-tertiary)]">ID</span>
                <span className="text-xs font-mono font-medium text-[var(--text-primary)]">
                  {String(profile.display_id ?? 0).padStart(9, '0')}
                </span>
              </div>

              {profile.slogan && (
                <p className="text-lg text-[var(--text-tertiary)] text-center max-w-xl mb-8">
                  {profile.slogan}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[var(--text-secondary)]">
                {/* 所在地和加入时间对访客可见 */}
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>加入于 {new Date(profile.created_at || '').getFullYear()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {profile.is_public ? (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>公开</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span>私密</span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ===== 外站链接展示 ===== */}
      {profile && profile.external_links && (() => {
        const links = typeof profile.external_links === 'string'
          ? (() => { try { return JSON.parse(profile.external_links); } catch { return []; } })()
          : profile.external_links;
        return Array.isArray(links) && links.length > 0 ? (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-wrap items-center justify-center gap-2"
            >
              {links.map((link: { platform: string; url: string }, i: number) => {
                const cfg = getPlatformConfig(link.platform);
                return (
                  <a
                    key={`${link.platform}-${i}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={cfg?.name || link.platform}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm transition-transform hover:scale-110 hover:shadow-md"
                      style={{ backgroundColor: cfg?.color || '#6366F1' }}
                    >
                      {cfg?.icon || '?'}
                    </div>
                  </a>
                );
              })}
            </motion.div>
          </div>
        ) : null;
      })()}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {canPostLog && (
          <GlassCard className="mb-8">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              发布认知日志
            </h3>
            <textarea
              value={logContent}
              onChange={(e) => setLogContent(e.target.value)}
              placeholder="记录你的想法...（完成后可添加标签，让 AI 更容易发现你）"
              className="input-field min-h-[100px] resize-none mb-2"
            />
            <input
              type="text"
              value={logTags}
              onChange={(e) => setLogTags(e.target.value)}
              placeholder="添加标签（选填，逗号分隔如：GEO, AI, 独立开发）"
              className="input-field mb-3 text-sm"
            />

            {/* 半固定式便签：分类选择 + 地理标签 */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {/* 分类选择 */}
              <div className="flex items-center gap-1.5">
                {[
                  { value: 'experience', label: '经历', color: 'text-amber-600 bg-amber-50 border-amber-200', activeColor: 'bg-amber-500 text-white border-amber-500' },
                  { value: 'present', label: '此刻', color: 'text-sky-600 bg-sky-50 border-sky-200', activeColor: 'bg-sky-500 text-white border-sky-500' },
                  { value: 'future', label: '将来', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', activeColor: 'bg-emerald-500 text-white border-emerald-500' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLogCategory(logCategory === opt.value ? '' : opt.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      logCategory === opt.value
                        ? opt.activeColor
                        : `${opt.color} hover:opacity-80`
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {/* 地理标签输入 */}
              <div className="relative flex-1 min-w-[140px] max-w-[200px]">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={logLocation}
                  onChange={(e) => setLogLocation(e.target.value)}
                  placeholder="添加位置（选填）"
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-300/50 focus:border-indigo-300 transition-all"
                  maxLength={50}
                />
              </div>
            </div>
            {logError && (
              <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {logError}
              </div>
            )}
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmitLog}
                disabled={!logContent.trim() || isSubmitting}
                className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? '发布中...' : '发布'}</span>
              </motion.button>
            </div>
          </GlassCard>
        )}

        {/* 登录提示 - 未登录访客可见 */}
        {!isLoggedIn && (
          <div className="mb-6 text-center">
            <p className="text-sm text-[var(--text-tertiary)]">
              登录后可留言互动、查看所在地和加入时间
            </p>
          </div>
        )}

        <section aria-label="认知日志列表" itemScope itemType="https://schema.org/ItemList">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
            认知日志
          </h2>

          {/* 冻结状态下不显示动态列表（仅自己和管理员可见） */}
          {profile?.hide_status === 'frozen' && !isCurrentUser && !isAdminUser ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-[var(--text-secondary)]">该用户已暂停展示</p>
            </div>
          ) : logsWithDelete.length > 0 ? (
            <>
              {/* 管理员多选工具栏 */}
              {isAdminUser && (
                <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-blue-700 cursor-pointer select-none hover:text-blue-900 transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedLogIds.size > 0 && paginatedLogs.every(l => selectedLogIds.has(l.id))}
                          onChange={selectAllCurrentPage}
                          className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                        />
                        全选当前页
                      </label>
                      <button
                        onClick={selectAllAcrossPages}
                        className="text-xs text-blue-600 hover:text-blue-800 underline underline-offset-2"
                      >
                        全选所有页面
                      </button>
                      <span className="text-xs text-blue-500">
                        {selectedLogIds.size > 0 ? `已选择 ${selectedLogIds.size} 条` : ''}
                      </span>
                    </div>
                    {selectedLogIds.size > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleBatchDelete}
                          disabled={isBatchDeleting}
                          className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center gap-1"
                        >
                          {isBatchDeleting ? (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <><Trash2 className="w-3 h-3" />批量删除 ({selectedLogIds.size})</>
                          )}
                        </button>
                        <button
                          onClick={() => setSelectedLogIds(new Set())}
                          className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-xs hover:bg-gray-300 transition-colors"
                        >
                          取消选择
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {paginatedLogs.map((log, index) => (
                  <div key={log.id} className="relative group" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                    <meta itemProp="position" content={String((currentPage - 1) * LOGS_PER_PAGE + index + 1)} />
                    {/* 管理员多选复选框 */}
                    {isAdminUser && (
                      <label
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-2 left-2 z-10 p-1 rounded-md bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-blue-50"
                        title={selectedLogIds.has(log.id) ? '取消选择' : '选择此日志'}
                      >
                        <input
                          type="checkbox"
                          checked={selectedLogIds.has(log.id)}
                          onChange={() => toggleSelectLog(log.id)}
                          className="rounded border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </label>
                    )}
                    <LogItem log={log} index={index} displayId={profile?.display_id} currentUser={currentUser} onDelete={handleDeleteLog} />
                    {/* 举报按钮 - 仅对非自己的日志显示 */}
                    {currentUser && log.user_id !== currentUser.user_id && (
                      <button
                        onClick={() => openReportModal({
                          id: log.id,
                          content: log.content,
                          type: 'log',
                          user_id: log.user_id,
                          username: profile?.username || '未知用户'
                        })}
                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        title="举报"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* 分页控件 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    上一页
                  </button>
                  <span className="text-[var(--text-secondary)]">
                    第 {currentPage} / {totalPages} 页
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <GlassCard className="text-center py-12">
              <p className="text-[var(--text-tertiary)]">
                暂无认知日志
              </p>
            </GlassCard>
          )}
        </section>

        {/* 注册引导 CTA - 未登录访客可见 */}
        {!isLoggedIn && (
          <div className="mt-8">
            <div className="bg-gradient-to-r from-[var(--accent)]/10 to-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-2xl p-8 text-center">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                了解更多？
              </h3>
              <p className="text-[var(--text-secondary)] mb-6">
                快速创建个人页面，让 AI 和搜索引擎带你连接全球
              </p>
              <Link
                to="/register"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
              >
                立即注册
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 用户间留言板区域 - 冻结状态下隐藏（仅自己和管理员可见） */}
      {!(profile?.hide_status === 'frozen' && !isCurrentUser && !isAdminUser) && (
        <UserGuestbookSection
          userId={profile?.user_id}
          currentUser={currentUser}
          profileUsername={profile?.username}
          onReport={openReportModal}
        />
      )}

      {/* 回到顶部按钮 */}
      <BackToTopButton />

      <Footer />

      {/* 举报弹窗 */}
      <AnimatePresence>
        {reportModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={closeReportModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
            >
              {/* 弹窗头部 */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="text-lg font-semibold text-gray-900">举报内容</h3>
                </div>
                <button
                  onClick={closeReportModal}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* 弹窗内容 */}
              <div className="p-6">
                {reportSuccess ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-900 font-medium">举报已提交</p>
                    <p className="text-gray-500 text-sm mt-1">我们会尽快审核处理</p>
                  </div>
                ) : (
                  <>
                    {/* 被举报内容预览 */}
                    {reportingItem && (
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <p className="text-xs text-gray-500 mb-1">被举报内容</p>
                        <p className="text-sm text-gray-700 line-clamp-3">{reportingItem.content}</p>
                        <p className="text-xs text-gray-400 mt-2">发布者: {reportingItem.username}</p>
                      </div>
                    )}

                    {/* 举报原因输入 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        举报原因 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        placeholder="请详细描述举报原因，如：包含不当内容、垃圾信息、人身攻击等..."
                        maxLength={500}
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
                      />
                      <p className="text-xs text-gray-400 mt-1 text-right">{reportReason.length}/500</p>
                    </div>

                    {/* 错误提示 */}
                    {reportError && (
                      <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {reportError}
                      </div>
                    )}

                    {/* 提交按钮 */}
                    <div className="flex gap-3">
                      <button
                        onClick={closeReportModal}
                        className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleReportSubmit}
                        disabled={!reportReason.trim() || reportSubmitting}
                        className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        {reportSubmitting ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Flag className="w-4 h-4" />
                            提交举报
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 回到顶部按钮组件
function BackToTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.button
      onClick={scrollToTop}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.8 }}
      transition={{ duration: 0.2 }}
      className={`fixed bottom-8 right-8 z-50 w-12 h-12 bg-slate-600 text-white rounded-full shadow-lg hover:bg-slate-700 transition-colors flex items-center justify-center ${
        show ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      <ArrowUp className="w-5 h-5" />
    </motion.button>
  );
}

// 用户间留言板区域组件
function UserGuestbookSection({ 
  userId, 
  currentUser, 
  profileUsername,
  onReport 
}: { 
  userId?: string; 
  currentUser: Profile | null;
  profileUsername?: string;
  onReport?: (item: { id: string; content: string; type: 'log' | 'message'; user_id: string; username: string }) => void;
}) {
  const [enabled, setEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkEnabled();
    if (userId) {
      loadConversations();
    }
  }, [userId]);

  const checkEnabled = async () => {
    const { data } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'user_guestbook_enabled')
      .single();
    setEnabled(data?.value === 'true');
    setLoading(false);
  };

  const loadConversations = async () => {
    if (!userId) return;
    // userId 是显示 ID（如 "000000003"），但表里 user_a/user_b 是 UUID 类型
    // 先从 profiles 查出 auth UUID
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (!profileData) return;

    const authUuid = profileData.id;
    const { data: convData, error: convError } = await supabase
      .from('user_conversations')
      .select('*')
      .or(`user_a.eq.${authUuid},user_b.eq.${authUuid}`)
      .order('last_message_at', { ascending: false });
    if (convError) {
      console.warn('[UserGuestbook] 加载留言板失败:', convError);
    }
    setConversations(convData || []);
  };

  if (loading || !enabled) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="bg-[var(--bg-secondary)] rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">留言板</h2>
        <p className="text-xs text-[var(--text-tertiary)] mb-4">
          公开留言 · 所有人可见 · 您在此留下的足迹将成为数字身份的一部分
        </p>

        {/* Tab切换 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('received')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'received'
                ? 'bg-slate-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            留言板
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'sent'
                ? 'bg-slate-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            足迹
          </button>
        </div>

        {/* 对话列表 */}
        <div className="space-y-3">
          {conversations.length === 0 ? (
            <p className="text-[var(--text-tertiary)] text-center py-8">暂无留言</p>
          ) : (
            conversations.map((conv) => (
              <div key={conv.id} className="p-4 bg-white rounded-xl border border-gray-100 relative group">
                <p className="text-sm text-[var(--text-secondary)]">对话内容预览...</p>
                {/* 举报按钮 - 仅对非自己的留言显示 */}
                {currentUser && conv.last_message_sender_id !== currentUser.user_id && onReport && (
                  <button
                    onClick={() => onReport({
                      id: conv.id,
                      content: conv.last_message_content || '对话内容',
                      type: 'message',
                      user_id: conv.last_message_sender_id || conv.user_a,
                      username: profileUsername || '未知用户'
                    })}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                    title="举报"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
