import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Clock, User as UserIcon, MessageSquare, Trash2, Eye } from 'lucide-react';
import { getCurrentUser } from '../utils/auth';
import { getMessages, sendMessage, getSystemMessages, isMessageBoardEnabled, deleteGuestbookMessage, markNotificationsRead } from '../utils/storage';
import { checkMessageRateLimit } from '../utils/storage';
import type { Profile } from '../types';
import { parseSupabaseTime } from '../types';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string | null;
  status?: 'pending' | 'approved';
  visible_after?: string;
}

interface SystemMessage {
  id: string;
  content: string;
  created_at: string | null;
  type: 'system' | 'announcement';
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [rateLimitError, setRateLimitError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const { profile: userProfile } = await getCurrentUser();
      if (!userProfile) {
        navigate('/login');
        return;
      }
      setProfile(userProfile);

      // 标记通知为已读
      markNotificationsRead();

      // 检查留言板是否开启
      const enabled = await isMessageBoardEnabled();
      setGlobalEnabled(enabled);

      if (enabled) {
        const [msgs, sysMsgs] = await Promise.all([
          getMessages(),
          getSystemMessages(),
        ]);
        setMessages(msgs);
        setSystemMessages(sysMsgs);
      }

      setIsLoading(false);
    };

    loadData();
  }, [navigate]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !profile) return;

    setIsSending(true);
    setError('');
    setRateLimitError('');

    // 检查限流
    const canSend = await checkMessageRateLimit(profile.user_id);
    if (!canSend) {
      setRateLimitError('您发送消息过于频繁，请稍后再试');
      setIsSending(false);
      return;
    }

    const result = await sendMessage(profile.user_id, profile.username, newMessage.trim());
    
    if (result.success) {
      setNewMessage('');
      // 刷新消息列表
      const msgs = await getMessages();
      setMessages(msgs);
    } else {
      setError(result.error || '发送失败');
    }

    setIsSending(false);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!profile) return;
    setDeleteError('');
    const result = await deleteGuestbookMessage(messageId, profile.user_id);
    if (result.success) {
      // 刷新消息列表
      const msgs = await getMessages();
      setMessages(msgs);
    } else {
      setDeleteError(result.error || '删除失败');
    }
  };

  // 检查留言是否在10分钟内
  const isWithin10Minutes = (createdAt: string | null) => {
    if (!createdAt) return false;
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    // TIMESTAMP 列存 UTC 但无时区标记，JS 会错当成本地时间，补 'Z' 修正
    const d = typeof createdAt === 'string' && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}$/.test(createdAt.trim())
      ? new Date(createdAt.trim().replace(' ', 'T') + 'Z')
      : new Date(createdAt);
    return d.getTime() > tenMinutesAgo;
  };

  // 检查留言是否已公开
  const isVisible = (msg: Message) => {
    if (msg.status === 'approved') return true;
    if (msg.visible_after) {
      return new Date(msg.visible_after).getTime() <= Date.now();
    }
    return false;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => navigate('/me')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>
          <h1 className="text-xl font-semibold ml-4">消息中心</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-24">
        {/* 系统消息 */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            系统消息
          </h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            {systemMessages.length > 0 ? (
              systemMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 text-sm leading-relaxed">{msg.content}</p>
                      <time className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {parseSupabaseTime(msg.created_at || new Date().toISOString()).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
                      </time>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="p-4 text-gray-500 text-center">暂无系统消息</p>
            )}
          </div>
        </section>

        {/* 留言板 */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-amber-600" />
              留言板
            </h2>
            {globalEnabled && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                已开启
              </span>
            )}
          </div>

          {globalEnabled ? (
            <>
              {/* 发送留言 */}
              {profile && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-4">
                  <textarea
                    className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    rows={3}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="写下你的留言..."
                    disabled={isSending}
                  />
                  {rateLimitError && (
                    <p className="text-amber-600 text-sm mt-2">{rateLimitError}</p>
                  )}
                  {error && (
                    <p className="text-red-500 text-sm mt-2">{error}</p>
                  )}
                  <div className="flex justify-end mt-3">
                    <motion.button
                      onClick={handleSendMessage}
                      disabled={isSending || !newMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isSending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          发送中...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          发送留言
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              )}

              {/* 删除错误提示 */}
              {deleteError && (
                <p className="text-red-500 text-sm mb-2">{deleteError}</p>
              )}

              {/* 留言列表 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                {messages.length > 0 ? (
                  messages.map((msg, index) => {
                    const visible = isVisible(msg);
                    const canDelete = profile?.user_id === msg.sender_id && isWithin10Minutes(msg.created_at);
                    const isOwner = profile?.user_id === msg.sender_id;

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${!visible && !isOwner ? 'hidden' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-sm">
                              {msg.sender_name?.[0] || 'U'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">{msg.sender_name}</span>
                              <time className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {parseSupabaseTime(msg.created_at || new Date().toISOString()).toLocaleString('zh-CN', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  timeZone: 'Asia/Shanghai',
                                  hour12: false,
                                })}
                              </time>
                              {/* 审核状态标记 */}
                              {!visible && isOwner && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  审核中
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed">{msg.content}</p>

                            {/* 删除按钮（仅10分钟内可删除） */}
                            {canDelete && (
                              <div className="mt-2 flex items-center gap-2">
                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  删除（{Math.ceil((10 * 60 * 1000 - (Date.now() - new Date(msg.created_at || Date.now()).getTime())) / 60000)}分钟后不可删）
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <p className="p-4 text-gray-500 text-center">暂无留言，来发表第一条留言吧</p>
                )}
              </div>
            </>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
              <MessageSquare className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <p className="text-amber-800 font-medium mb-1">留言板已关闭</p>
              <p className="text-amber-600 text-sm">请联系管理员开启</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
