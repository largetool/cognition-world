import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Send, Lock, Clock, User, Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { Footer } from '../components/Footer';
import { APP_CONFIG } from '../types';
import { supabase } from '../supabase/client';
import { generateBreadcrumbList, breadcrumbs } from '../utils/seo';
import { moderateContent, isUserExemptFromReview } from '../utils/storage';
import { useAuth } from '../hooks/useAuth';

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
  return date.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
}

interface Message {
  id: string;
  user_id: string;
  username: string;
  content: string;
  is_read: boolean | null;
  created_at: string;
  admin_reply?: string | null;
  replied_at?: string | null;
}

// 24小时留言限制
const MAX_MESSAGES_PER_DAY = 3;
const MIN_REGISTER_DAYS = 3;

export default function GuestbookPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 资格状态
  const [registerDate, setRegisterDate] = useState<Date | null>(null);
  const [todayCount, setTodayCount] = useState(0);

  // 获取用户自己的留言
  const fetchMyMessages = async () => {
    if (!user) return;
    try {
      const { data, error: fetchError } = await supabase
        .from('guestbook_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('获取留言失败:', fetchError);
        return;
      }
      setMessages((data as Message[]) || []);
    } catch (err) {
      console.error('获取留言失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 检查资格（直接用 user 对象，避免 profiles 表查询）
  const checkEligibility = async () => {
    if (!user) return;

    try {
      // user 本身就有 profiles 表的完整数据
      if (user.created_at) {
        setRegisterDate(new Date(user.created_at));
      }

      // 计算 24 小时内的留言数
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('guestbook_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', twentyFourHoursAgo);

      setTodayCount(count ?? 0);
    } catch (err) {
      console.error('检查资格失败:', err);
    }
  };

  // 计算是否满足资格
  const getEligibility = () => {
    if (!user || !registerDate) {
      return { eligible: false, registeredDays: 0, remainingDays: MIN_REGISTER_DAYS, remainingCount: MAX_MESSAGES_PER_DAY, limitReached: false };
    }

    const now = new Date();
    const diffMs = now.getTime() - registerDate.getTime();
    const registeredDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, MIN_REGISTER_DAYS - registeredDays);
    const limitReached = todayCount >= MAX_MESSAGES_PER_DAY;
    const remainingCount = Math.max(0, MAX_MESSAGES_PER_DAY - todayCount);
    const eligible = registeredDays >= MIN_REGISTER_DAYS && !limitReached;

    return { eligible, registeredDays, remainingDays, remainingCount, limitReached };
  };

  // 提交留言
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const { eligible, limitReached } = getEligibility();
    if (!eligible) {
      if (limitReached) {
        setError('今日留言次数已用完，请明天再试');
      } else {
        setError('账户注册未满3天，暂时无法使用留言功能');
      }
      return;
    }

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

      const { error: insertError } = await supabase
        .from('guestbook_messages')
        .insert({
          user_id: user.id,
          username: user.username,
          content: newMessage.trim(),
        });

      if (insertError) {
        setError('提交失败：' + (insertError.message || '请稍后重试'));
        setSubmitting(false);
        return;
      }

      setNewMessage('');
      setTodayCount(prev => prev + 1);
      await fetchMyMessages();
    } catch (err) {
      setError('提交失败，请稍后重试');
      console.error('提交留言失败:', err);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchMyMessages();
    checkEligibility();
  }, [user]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const { eligible, registeredDays, remainingDays, remainingCount, limitReached } = getEligibility();
  const canSubmit = user && eligible && newMessage.trim().length > 0;

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
              分享你的想法、建议或反馈 · 留言仅你自己和管理员可见
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

          {user && registerDate && registeredDays < MIN_REGISTER_DAYS && (
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
                您的账户已注册 {registeredDays} 天，还需等待 <strong>{remainingDays}</strong> 天才能使用留言板功能。
                这是为了防止垃圾信息，感谢理解。
              </p>
            </motion.div>
          )}

          {user && registerDate && registeredDays >= MIN_REGISTER_DAYS && limitReached && (
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
                您已达到24小时留言上限（{MAX_MESSAGES_PER_DAY}条），请明天再试。
              </p>
            </motion.div>
          )}

          {/* 留言列表 + 输入区 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-[var(--bg-secondary)] rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            {/* 留言历史 */}
            <div className="h-[360px] overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="w-12 h-12 text-gray-200 mb-3" />
                  <p className="text-[var(--text-secondary)]">还没有发过留言</p>
                  <p className="text-sm text-[var(--text-tertiary)] mt-1">在下方写下你想对管理员说的话</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-400 text-center pb-1">
                    共 {messages.length} 条留言 · 仅你自己可见
                  </p>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex gap-3"
                    >
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-4 h-4 text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="inline-block rounded-2xl px-4 py-2.5 bg-white border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-purple-600">{message.username}</span>
                            {message.is_read && (
                              <span className="text-[10px] text-emerald-500 font-medium">已读</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 ml-1">
                          {formatDistanceToNow(message.created_at)}
                        </p>
                        {message.admin_reply && (
                          <div className="mt-3 ml-2 pl-3 border-l-2 border-purple-300">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-xs font-semibold text-purple-600">管理员回复</span>
                              {message.replied_at && (
                                <span className="text-[10px] text-gray-400">{formatDistanceToNow(message.replied_at)}</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-purple-50 rounded-xl px-3 py-2 inline-block">
                              {message.admin_reply}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            {user && registerDate && registeredDays >= MIN_REGISTER_DAYS && !limitReached && (
              <div className="border-t border-gray-100 p-4 bg-white">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="写下你想对管理员说的话..."
                    maxLength={1000}
                    rows={8}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-y"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!canSubmit || submitting}
                      className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          发送留言
                        </>
                      )}
                    </button>
                  </div>
                </form>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-purple-600">
                    今日剩余次数：<strong>{remainingCount}</strong>/{MAX_MESSAGES_PER_DAY}
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
            <p>留言仅你自己和管理员可见</p>
            <p className="mt-1">注册满 {MIN_REGISTER_DAYS} 天且每24小时最多 {MAX_MESSAGES_PER_DAY} 条留言</p>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
