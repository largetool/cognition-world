import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MessageSquare, Send, Lock, Clock, User, Flag, X, AlertTriangle, ThumbsUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { Footer } from '../components/Footer';
import { APP_CONFIG } from '../types';
import { supabase, supabaseUrl } from '../supabase/client';
import { generateBreadcrumbList, breadcrumbs } from '../utils/seo';
import { t, getCurrentLanguage } from '../locales';
import { getLikes, hasUserLiked, toggleLike, moderateContent, isUserExemptFromReview } from '../utils/storage';
import { useAuth } from '../hooks/useAuth';

// 获取 Edge Function URL
function getEdgeFunctionUrl(): string {
  const url = supabaseUrl;
  return url.replace(/\/sb-api$/, '');
}

// 格式化相对时间
function formatDistanceToNow(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 30) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN');
}

interface GuestbookMessage {
  id: string;
  user_id: string;
  username: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface EligibilityStatus {
  eligible: boolean;
  registeredDays: number;
  remainingDays: number;
  remainingCount: number;
  limitReached: boolean;
}

export default function GuestbookPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eligibility, setEligibility] = useState<EligibilityStatus | null>(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 举报相关状态
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingMessage, setReportingMessage] = useState<GuestbookMessage | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // 点赞相关状态
  const [likes, setLikes] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [likeLoading, setLikeLoading] = useState<Record<string, boolean>>({});

  // 获取留言列表
  const fetchMessages = async () => {
    try {
      const response = await fetch(`${getEdgeFunctionUrl()}/functions/v1/guestbook`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (result.success) {
        setMessages(result.data);
        // 异步加载点赞数据
        loadLikesForMessages(result.data, user?.id);
      }
    } catch (err) {
      console.error('获取留言失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 加载所有留言的点赞数据
  const loadLikesForMessages = async (msgs: GuestbookMessage[], currentUserId?: string) => {
    const likeData: Record<string, { count: number; liked: boolean }> = {};
    await Promise.all(msgs.map(async (msg) => {
      const count = await getLikes(msg.id, 'guestbook_message');
      let liked = false;
      if (currentUserId) {
        liked = await hasUserLiked(msg.id, 'guestbook_message', currentUserId);
      }
      likeData[msg.id] = { count, liked };
    }));
    setLikes(likeData);
  };

  // 切换点赞
  const handleToggleLike = async (messageId: string) => {
    if (!user || likeLoading[messageId]) return;
    setLikeLoading(prev => ({ ...prev, [messageId]: true }));
    const result = await toggleLike(messageId, 'guestbook_message', user.id);
    if (!result.error) {
      setLikes(prev => ({
        ...prev,
        [messageId]: { count: result.count, liked: result.liked }
      }));
    }
    setLikeLoading(prev => ({ ...prev, [messageId]: false }));
  };

  // 检查用户资格
  const checkEligibility = async () => {
    if (!user) return;

    try {
      const session = (await supabase.auth.getSession()).data.session;
      const authHeaders = session ? { Authorization: `Bearer ${session.access_token}` } : {};

      const response = await fetch(`${getEdgeFunctionUrl()}/functions/v1/guestbook/check-eligibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeaders as Record<string, string>),
        },
      });

      const result = await response.json();
      if (result.success) {
        setEligibility(result);
      }
    } catch (err) {
      console.error('检查资格失败:', err);
    }
  };

  // 提交留言
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setSubmitting(true);
    setError('');

    try {
      // AI 审核
      const exempt = await isUserExemptFromReview(user.id);
      if (!exempt) {
        const modResult = await moderateContent(newMessage.trim());
        if (!modResult.passed) {
          setError(modResult.description ? `内容审核未通过：${modResult.description}` : '内容包含违规信息');
          setSubmitting(false);
          return;
        }
      }

      const session = (await supabase.auth.getSession()).data.session;
      const authHeaders = session ? { Authorization: `Bearer ${session.access_token}` } : {};

      const response = await fetch(`${getEdgeFunctionUrl()}/functions/v1/guestbook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeaders as Record<string, string>),
        },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || '提交失败');
        return;
      }

      if (result.success) {
        setNewMessage('');
        // 重新获取留言列表
        await fetchMessages();
      }
    } catch (err) {
      setError('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    checkEligibility();
  }, [user]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 打开举报弹窗
  const openReportModal = (message: GuestbookMessage) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (message.user_id === user.id) {
      return; // 不能举报自己
    }
    setReportingMessage(message);
    setReportReason('');
    setReportSuccess(false);
    setReportModalOpen(true);
  };

  // 关闭举报弹窗
  const closeReportModal = () => {
    setReportModalOpen(false);
    setReportingMessage(null);
    setReportReason('');
    setReportSuccess(false);
  };

  // 提交举报
  const handleReportSubmit = async () => {
    if (!reportingMessage || !user || !reportReason.trim()) return;

    setReportSubmitting(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const authHeaders = session ? { Authorization: `Bearer ${session.access_token}` } : {};

      const response = await fetch(`${getEdgeFunctionUrl()}/functions/v1/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeaders as Record<string, string>),
        },
        body: JSON.stringify({
          reported_message_id: reportingMessage.id,
          message_table: 'guestbook_messages',
          message_content: reportingMessage.content,
          reported_user_id: reportingMessage.user_id,
          reason: reportReason.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setReportSuccess(true);
        setTimeout(() => {
          closeReportModal();
        }, 2000);
      } else {
        console.error('举报失败:', result.error);
      }
    } catch (err) {
      console.error('举报提交失败:', err);
    } finally {
      setReportSubmitting(false);
    }
  };

  const isEligible = eligibility?.eligible ?? false;
  const limitReached = eligibility?.limitReached ?? false;
  const remainingCount = eligibility?.remainingCount ?? 3;
  const canSubmit = user && isEligible && !limitReached && newMessage.trim().length > 0;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <SEOHead
        data={{
          title: '留言板 - 认知界',
          description: '给管理员留言，分享你的想法和建议',
        }}
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            generateBreadcrumbList([breadcrumbs.home, breadcrumbs.guestbook]),
          ],
        }}
      />

      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#18181B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">留言板</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="pt-20 pb-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {/* 页面标题 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 pt-4"
          >
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-purple-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
              给管理员留言
            </h1>
            <p className="text-[var(--text-secondary)]">
              分享你的想法、建议或反馈
            </p>
          </motion.div>

          {/* 使用门槛提示 */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3"
            >
              <Lock className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-amber-700 text-sm">
                请先 <button onClick={() => navigate('/login')} className="font-medium underline">登录</button> 后使用留言板功能
              </p>
            </motion.div>
          )}

          {user && eligibility && !isEligible && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p className="text-amber-800 font-medium">账户注册时间不足</p>
              </div>
              <p className="text-amber-700 text-sm">
                您的账户已注册 {eligibility.registeredDays} 天，还需等待 <strong>{eligibility.remainingDays}</strong> 天才能使用留言板功能。
                这是为了防止垃圾信息，感谢理解。
              </p>
            </motion.div>
          )}

          {user && isEligible && limitReached && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p className="text-amber-800 font-medium">今日留言次数已用完</p>
              </div>
              <p className="text-amber-700 text-sm">
                您已达到24小时留言上限（3条），请明天再试。
              </p>
            </motion.div>
          )}

          {/* 留言列表 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-[var(--bg-secondary)] rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            {/* 留言列表区域 */}
            <div className="h-[400px] overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="w-12 h-12 text-gray-200 mb-3" />
                  <p className="text-[var(--text-secondary)]">暂无留言</p>
                  <p className="text-sm text-[var(--text-tertiary)] mt-1">成为第一个留言的人吧</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex gap-3 ${message.user_id === user?.id ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className={`max-w-[80%] ${message.user_id === user?.id ? 'text-right' : ''}`}>
                      <div className={`inline-block rounded-2xl px-4 py-2 ${
                        message.user_id === user?.id
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-[var(--text-primary)]'
                      }`}>
                        <p className="text-sm font-medium mb-1 opacity-80">{message.username}</p>
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <div className={`flex items-center gap-2 mt-1 ${message.user_id === user?.id ? 'justify-end' : ''}`}>
                        {/* 点赞按钮 - 所有人都可点赞 */}
                        {user && (
                          <button
                            onClick={() => handleToggleLike(message.id)}
                            disabled={likeLoading[message.id]}
                            className={`text-xs transition-colors flex items-center gap-0.5 ${
                              likes[message.id]?.liked ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
                            }`}
                            title={likes[message.id]?.liked ? '取消点赞' : '点赞'}
                          >
                            <ThumbsUp className={`w-3 h-3 ${likes[message.id]?.liked ? 'fill-blue-500' : ''}`} />
                            {likes[message.id]?.count > 0 && <span>{likes[message.id].count}</span>}
                          </button>
                        )}
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {formatDistanceToNow(message.created_at)}
                        </p>
                        {/* 举报按钮 - 仅对非自己的留言显示 */}
                        {user && message.user_id !== user.id && (
                          <button
                            onClick={() => openReportModal(message)}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-0.5"
                            title="举报"
                          >
                            <Flag className="w-3 h-3" />
                            <span>举报</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            {user && isEligible && (
              <div className="border-t border-gray-100 p-4 bg-white">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="写下你的想法..."
                    maxLength={1000}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!canSubmit || submitting}
                    className="px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-purple-600">
                    今日剩余次数：<strong>{remainingCount}</strong>/3
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {newMessage.length}/1000
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* 说明文字 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center text-sm text-[var(--text-tertiary)]"
          >
            <p>留言板面向所有用户公开可见</p>
            <p className="mt-1">注册满 3 天且每24小时最多3条留言</p>
          </motion.div>
        </div>
      </main>

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
                    {reportingMessage && (
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <p className="text-xs text-gray-500 mb-1">被举报内容</p>
                        <p className="text-sm text-gray-700 line-clamp-3">{reportingMessage.content}</p>
                        <p className="text-xs text-gray-400 mt-2">发布者: {reportingMessage.username}</p>
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
