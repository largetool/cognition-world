import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Eye, EyeOff, LogOut, User, Edit3, X, Save, Send, Clock, Image, CheckCircle, AlertCircle, Check, Share2, ThumbsUp } from 'lucide-react';
import { getCurrentUser, logout, updateProfile } from '../utils/auth';
import { supabase } from '../supabase/client';
import { createLogWithModeration, getUserBackgroundImages, selectSystemBackground, getActiveBackgroundImage, checkCanPost, recordPost, getLikes, hasUserLiked, toggleLike, deleteLog } from '../utils/storage';
import { localSystemBackgrounds } from '../data/systemBackgrounds';
import type { Profile, SystemBackground, BackgroundImage } from '../types';
import { SEOHead } from '../components/SEOHead';
import { generateProfilePageSchema, generatePersonSchema } from '../utils/seo';
import BottomNav from '../components/BottomNav';

const defaultBg = '/assets/C2283395-46CF-48E8-B1EC-3813518039AE.jpg';

/** 零依赖获取日志（避开 webpack chunk TDZ） */
async function getLogsDirectInline(
  userId: string,
  currentUserId?: string,
  isAdmin?: boolean
): Promise<any[]> {
  const SUPABASE_URL = 'https://nbgsichilfrjsopnnvia.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZ3NpY2hpbGZyanNvcG5udmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMTE1MjMsImV4cCI6MjA5NTg4NzUyM30.fWr-ZoDhirVgsKGsL8BWeP36iQ235GuQ4iF_GYK0RH0';

  let token: string | null = null;
  try {
    const raw = localStorage.getItem('sb-' + SUPABASE_URL.replace('https://', '') + '-auth-token');
    if (raw) {
      const parsed = JSON.parse(raw);
      token = parsed?.access_token || null;
    }
  } catch (_) {}

  const params = new URLSearchParams({
    select: '*',
    user_id: `eq.${userId}`,
    order: 'created_at.desc',
    limit: '100',
  });

  const res = await fetch(`${SUPABASE_URL}/rest/v1/logs?${params.toString()}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    console.error('[getLogsDirect] HTTP', res.status);
    return [];
  }

  const data = await res.json();
  const now = new Date();
  return (Array.isArray(data) ? data : []).map((log: any) => {
    const ct = new Date(log.created_at || '');
    const tenMin = new Date(ct.getTime() + 10 * 60 * 1000);
    const isPublic = log.is_public === true || now >= tenMin;
    const canDelete = isAdmin === true || (currentUserId === userId && now < tenMin);
    return { ...log, is_public: isPublic, canDelete };
  });
}

// 日志数据类型
interface LogData {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  is_public?: boolean | null;
  canDelete?: boolean;
  published_at?: string | null;
  tags?: string[] | null;
}

export default function MePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [logs, setLogs] = useState<LogData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ tag: '', slogan: '', location: '', isPublic: true });
  const [newLogContent, setNewLogContent] = useState('');
  const [newLogTags, setNewLogTags] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>([]);
  const [systemBackgrounds, setSystemBackgrounds] = useState<SystemBackground[]>(localSystemBackgrounds);
  const [showBgSettings, setShowBgSettings] = useState(false);
  const [selectedBgId, setSelectedBgId] = useState<string | null>(null);
  const [activeBgUrl, setActiveBgUrl] = useState<string | null>(null);
  const [bgError, setBgError] = useState(false);

  // 点赞
  const [logLikes, setLogLikes] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [likeLoading, setLikeLoading] = useState<Record<string, boolean>>({});
  const [likeErrors, setLikeErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const { user: authUser, profile: userProfile, error: authError } = await getCurrentUser();
        if (!isMounted) return;

        if (authError || !userProfile) {
          if (authUser) {
            navigate('/register?from=google');
          } else {
            navigate('/login');
          }
          return;
        }

        setProfile(userProfile);

        // 同步 auth_user_id（新用户首次登录自动填充）
        supabase.rpc('sync_my_auth_id').then(({ error }) => {
          if (error) console.warn('同步auth_user_id失败:', error);
        });

        setEditForm({
          tag: userProfile.tag,
          slogan: userProfile.slogan || '',
          location: userProfile.location,
          isPublic: userProfile.is_public ?? true
        });

        // 每个数据源独立加载，单个失败不阻塞其他
        let logsData: LogData[] = [];
        try {
          const userLogs = await getLogsDirectInline(userProfile.user_id, userProfile.user_id, userProfile.is_admin || false);
          if (isMounted) {
            logsData = userLogs as LogData[];
            setLogs(logsData);
            loadLogLikes(logsData);
          }
        } catch (stepErr) {
          console.warn('[MePage] getUserLogs failed:', stepErr);
        }

        try {
          const bgImages = await getUserBackgroundImages(userProfile.user_id);
          if (isMounted) {
            setBackgroundImages(bgImages);
          }
        } catch (stepErr) {
          console.warn('[MePage] getUserBackgroundImages failed:', stepErr);
        }

        if (!isMounted) return;

        // 背景图
        try {
          const savedBgUrl = userProfile.background_image;
          if (savedBgUrl) {
            setActiveBgUrl(savedBgUrl);
            setBgError(false);
          } else {
            const activeBg = await getActiveBackgroundImage(userProfile.user_id);
            if (isMounted && activeBg?.url) {
              setActiveBgUrl(activeBg.url);
              setBgError(false);
            } else if (isMounted) {
              setActiveBgUrl(defaultBg);
              setBgError(false);
            }
          }
        } catch (stepErr) {
          console.warn('[MePage] activeBackground failed:', stepErr);
          if (isMounted) {
            setActiveBgUrl(defaultBg);
            setBgError(false);
          }
        }

        setSystemBackgrounds(localSystemBackgrounds);
      } catch (err) {
        console.error('[MePage] Load data error:', err);
        if (isMounted) {
          setError('加载数据失败');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => { isMounted = false; };
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, [navigate]);


  const [postLimitError, setPostLimitError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePublishLog = useCallback(async () => {
    if (!profile || !newLogContent.trim()) return;

    setIsPublishing(true);
    setPostLimitError(null);
    setError(null);

    try {
      // 检查发布限额
      const checkResult = await checkCanPost(profile.user_id);
      if (!checkResult.canPost) {
        setPostLimitError(checkResult.message || '今日发布次数已用完');
        setIsPublishing(false);
        return;
      }

      const tags = newLogTags
        .split(/[,，]/)
        .map(t => t.trim())
        .filter(Boolean);

      // 带 AI 审核的发布
      const result = await createLogWithModeration(profile.user_id, newLogContent.trim(), tags);
      if (result.rejected) {
        setError(result.reason || '内容包含违规信息，请修改后重新发布');
      } else if (result.success && result.log) {
        setLogs(prev => [{...result.log!, created_at: result.log!.created_at || new Date().toISOString()}, ...prev]);
        setNewLogContent('');
        setNewLogTags('');
        await recordPost(profile.user_id);
      } else {
        setError(result.error || '发布失败，请重试');
      }
    } catch (err) {
      setError('发布出错，请稍后重试');
      console.error('Publish log error:', err);
    } finally {
      setIsPublishing(false);
    }
  }, [profile, newLogContent, newLogTags]);

  const handleDeleteLog = useCallback(async (logId: string) => {
    if (!profile) return;
    const result = await deleteLog(logId, profile.user_id, profile.is_admin || false);
    if (result.success) {
      setLogs(prev => prev.filter(l => l.id !== logId));
    } else {
      setError(result.error || '删除失败');
    }
  }, [profile]);

  const handleSave = useCallback(async () => {
    if (!profile) return;
    setError(null);

    try {
      const { profile: updated, error: updateError } = await updateProfile(profile.id, {
        tag: editForm.tag,
        slogan: editForm.slogan,
        location: editForm.location,
        is_public: editForm.isPublic
      });

      if (updateError) {
        setError(updateError instanceof Error ? updateError.message : '更新失败');
        return;
      }

      if (updated) {
        setProfile(updated);
        setIsEditing(false);
      }
    } catch (err) {
      setError('保存失败，请重试');
      console.error('Save profile error:', err);
    }
  }, [profile, editForm]);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#1a1a1a] rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  // 点赞相关
  const loadLogLikes = async (logs: LogData[]) => {
    const likeData: Record<string, { count: number; liked: boolean }> = {};
    await Promise.all(logs.map(async (log) => {
      const count = await getLikes(log.id, 'log');
      const liked = await hasUserLiked(log.id, 'log', profile.user_id);
      likeData[log.id] = { count, liked };
    }));
    setLogLikes(likeData);
  };

  const handleToggleLogLike = async (logId: string) => {
    if (likeLoading[logId]) return;
    setLikeLoading(prev => ({ ...prev, [logId]: true }));
    setLikeErrors(prev => ({ ...prev, [logId]: false }));
    const result = await toggleLike(logId, 'log', profile.user_id);
    if (!result.error) {
      setLogLikes(prev => ({
        ...prev,
        [logId]: { count: result.count, liked: result.liked }
      }));
    } else {
      setLikeErrors(prev => ({ ...prev, [logId]: true }));
      setTimeout(() => setLikeErrors(prev => ({ ...prev, [logId]: false })), 2000);
    }
    setLikeLoading(prev => ({ ...prev, [logId]: false }));
  };

  const pageTitle = `${profile.username} | 认知界`;
  const pageDescription = profile.slogan || `${profile.username} — ${profile.tag}`;
  const pageUrl = `https://uptef.com/#/${profile.user_id}`;

  const jsonLd = [
    generateProfilePageSchema(profile),
    generatePersonSchema(profile),
  ];

  return (
    <>
      <SEOHead
        data={{
          title: pageTitle,
          description: pageDescription,
          keywords: [profile?.username || '', profile?.tag || '', '数字身份', '认知界'],
          ogType: 'profile',
          canonicalUrl: pageUrl,
        }}
        jsonLd={jsonLd}
      />
      <div className="min-h-screen bg-[#FAFAFA]">
        {/* 顶部背景图区域 - 参考白皮书 Hero 设计 */}
        <div className="relative h-72 w-full overflow-hidden">
          {activeBgUrl && !bgError ? (
            <>
              <img
                src={activeBgUrl}
                alt="背景"
                className="w-full h-full object-cover"
                onError={() => {
                  console.error('背景图加载失败:', activeBgUrl);
                  setBgError(true);
                }}
              />
              {/* 多层渐变遮罩，确保文字可读性 */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAFA] via-black/20 to-black/40" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
              {/* 装饰性网格背景 */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
              }} />
            </div>
          )}
        </div>

        {/* 固定导航栏 - 参考白皮书风格 */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#18181B] transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>返回首页</span>
            </button>

            <div className="flex items-center gap-1">
              {/* 分享按钮 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  if (!profile) return;
                  const url = `${window.location.origin}/${profile.user_id}`;
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
                className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>

              {/* 背景设置按钮 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBgSettings(!showBgSettings)}
                className="p-2.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
              >
                <Image className="w-5 h-5" />
              </motion.button>

              {/* 编辑按钮 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(!isEditing)}
                className={`p-2.5 rounded-xl transition-colors ${isEditing ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
              >
                <Edit3 className="w-5 h-5" />
              </motion.button>

              {/* 退出登录按钮 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </nav>

        {/* 主内容区域 */}
        <main className="relative z-10 -mt-20 pb-24 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            {/* 个人资料卡片 - 参考白皮书卡片设计 */}
            <motion.div
              className="text-center mb-10"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* 头像 - 使用渐变背景 */}
              <motion.div
                className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200 bg-gradient-to-br from-slate-700 to-slate-900"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <span className="text-white font-bold text-3xl">{profile.username?.[0] || 'U'}</span>
              </motion.div>

              {/* 用户名 */}
              <motion.h1
                className="text-3xl font-bold text-[#18181B] mb-3 tracking-tight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {profile.username}
              </motion.h1>

              {/* ID 标识 */}
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full mb-4 border border-gray-200 shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
              >
                <span className="text-xs text-gray-400 font-medium">ID</span>
                <span className="text-xs font-mono font-semibold text-gray-700">
                  {String(profile.display_id ?? 0).padStart(9, '0')}
                </span>
              </motion.div>

              {/* 多标签徽章式显示 - 彩色标签 */}
              <motion.div
                className="flex flex-wrap gap-2 justify-center mt-4 mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {profile.tag ? (
                  profile.tag.split(/[,，]/).filter((t: string) => t.trim()).map((tag: string, idx: number) => {
                    const colors = [
                      'bg-blue-100 text-blue-700 border-blue-300',
                      'bg-emerald-100 text-emerald-700 border-emerald-300',
                      'bg-amber-100 text-amber-700 border-amber-300',
                      'bg-rose-100 text-rose-700 border-rose-300',
                      'bg-cyan-100 text-cyan-700 border-cyan-300',
                      'bg-violet-100 text-violet-700 border-violet-300',
                    ];
                    const colorClass = colors[idx % colors.length];
                    return (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-full text-sm border font-medium ${colorClass}`}
                      >
                        {tag.trim()}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-gray-400 text-sm">编辑资料完善标签</span>
                )}
              </motion.div>

              {/* Slogan - 增强玻璃拟态效果 */}
              {profile.slogan && (
                <motion.div
                  className="mt-6 p-6 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/80 shadow-lg shadow-slate-200/50 max-w-lg mx-auto"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                >
                  <div className="flex items-center gap-2 mb-2 text-gray-400">
                    <span className="text-xs font-medium uppercase tracking-wider">个人宣言</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-base font-medium">
                    {profile.slogan}
                  </p>
                </motion.div>
              )}
            </motion.div>

            <AnimatePresence>
              {isEditing && (
                <motion.div
                  className="mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {/* 编辑表单 - iOS 26 玻璃拟态 */}
                  <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 border border-white/90 shadow-xl shadow-slate-200/60">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md">
                          <Edit3 className="w-4 h-4 text-white" />
                        </div>
                        编辑资料
                      </h3>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">身份标签</label>
                        <input
                          type="text"
                          value={editForm.tag}
                          onChange={(e) => setEditForm({ ...editForm, tag: e.target.value })}
                          className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-xl text-sm text-gray-800 focus:outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all shadow-sm"
                          placeholder="输入身份标签，用逗号分隔"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">个人宣言</label>
                        <textarea
                          rows={3}
                          value={editForm.slogan}
                          onChange={(e) => setEditForm({ ...editForm, slogan: e.target.value })}
                          className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-xl text-sm text-gray-800 focus:outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none transition-all shadow-sm"
                          placeholder="写下你的个人宣言"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">所在地</label>
                        <input
                          type="text"
                          value={editForm.location}
                          onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                          className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-xl text-sm text-gray-800 focus:outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all shadow-sm"
                          placeholder="输入你的所在地"
                        />
                      </div>

                      {/* 公开设置 - 玻璃卡片 */}
                      <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50/80 to-cyan-50/80 backdrop-blur-sm rounded-xl border border-blue-200/60">
                        <div className="flex items-center h-5 mt-0.5">
                          <input
                            type="checkbox"
                            id="editIsPublic"
                            checked={editForm.isPublic}
                            onChange={(e) => setEditForm({ ...editForm, isPublic: e.target.checked })}
                            className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-400"
                          />
                        </div>
                        <div className="flex-1">
                          <label htmlFor="editIsPublic" className="text-sm text-gray-800 font-medium">
                            允许搜索引擎收录此页面
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            公开信息仅包括：用户名、身份标签、个人宣言、所在地
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 按钮组 */}
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-2.5 bg-[#1a1a1a] text-white rounded-xl hover:bg-[#333] flex items-center justify-center gap-2 text-sm transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        保存
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showBgSettings && (
                <motion.div
                  className="mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="rounded-2xl p-6 bg-white/70 backdrop-blur-2xl border border-white/90 shadow-xl shadow-slate-200/60">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                          <Image className="w-4 h-4 text-white" />
                        </div>
                        背景图设置
                      </h3>
                      <button
                        onClick={() => setShowBgSettings(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs text-gray-500">选择系统提供的背景图，点击应用</p>
                      {systemBackgrounds.length > 0 ? (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            {systemBackgrounds.map((bg) => (
                              <motion.div
                                key={bg.id}
                                className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer shadow-md ${
                                  selectedBgId === bg.id
                                    ? 'border-amber-500 ring-2 ring-amber-200 shadow-lg shadow-amber-100'
                                    : 'border-transparent hover:border-gray-300 hover:shadow-lg'
                                }`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={() => setSelectedBgId(bg.id)}
                              >
                                <img
                                  src={bg.url}
                                  alt={bg.name || '系统背景'}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                <div className="absolute bottom-2 left-2 right-2">
                                  <span className="text-xs text-white font-medium">{bg.name || '系统背景'}</span>
                                </div>
                                {selectedBgId === bg.id && (
                                  <div className="absolute top-2 right-2 p-1.5 bg-amber-500 text-white rounded-lg shadow-lg">
                                    <Check className="w-3 h-3" />
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                          <button
                            onClick={async () => {
                              if (profile && selectedBgId) {
                                const bg = systemBackgrounds.find(b => b.id === selectedBgId);
                                if (bg) {
                                  const success = await selectSystemBackground(profile.user_id, bg.url);
                                  if (success) {
                                    setActiveBgUrl(bg.url);
                                    setShowBgSettings(false);
                                  }
                                }
                              }
                            }}
                            disabled={!selectedBgId}
                            className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 text-sm font-medium transition-all shadow-lg shadow-amber-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            应用背景
                          </button>
                        </>
                      ) : (
                        <div className="text-center py-6">
                          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <Image className="w-5 h-5 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-400">暂无系统背景图</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isEditing && !showBgSettings && (
              <motion.div
                className="rounded-2xl p-5 mb-8 bg-white/60 backdrop-blur-xl border border-white/80 shadow-lg shadow-slate-200/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium">{profile.location}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="font-medium">加入于 {profile.created_at?.split('T')[0]}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {profile.is_public ? (
                      <>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                          <Eye className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="text-emerald-600 font-medium">公开收录</span>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <EyeOff className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="text-gray-500 font-medium">私密状态</span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center">
                  <Send className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <span className="font-medium">记录今日认知</span>
              </div>
              <div className="rounded-2xl p-5 bg-white/70 backdrop-blur-2xl border border-white/90 shadow-xl shadow-slate-200/60">
                <textarea
                  rows={3}
                  value={newLogContent}
                  onChange={(e) => { setNewLogContent(e.target.value); setError(null); setPostLimitError(null); }}
                  className="w-full px-0 py-0 bg-transparent border-0 text-[0.9375rem] text-gray-800 placeholder:text-gray-400 focus:outline-none resize-none"
                  placeholder="分享你的想法...（完成后可添加标签，让 AI 更容易发现你）"
                />
                <input
                  type="text"
                  value={newLogTags}
                  onChange={(e) => setNewLogTags(e.target.value)}
                  className="w-full mt-2 px-0 py-0 bg-transparent border-t border-gray-100 pt-3 text-sm text-gray-500 placeholder:text-gray-300 focus:outline-none"
                  placeholder="添加标签（选填，逗号分隔如：GEO, AI, 独立开发）"
                />
                {postLimitError && (
                  <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                    {postLimitError}
                  </div>
                )}
                {error && !postLimitError && (
                  <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}
                <div className="flex justify-end mt-4">
                  <motion.button
                    onClick={handlePublishLog}
                    disabled={isPublishing || !newLogContent.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-gray-800 to-gray-900 text-white text-sm font-medium rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg shadow-gray-200/50 disabled:opacity-40"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isPublishing ? '发布中...' : '发布'}
                  </motion.button>
                </div>
              </div>
            </motion.div>


            {logs.length > 0 && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.45 }}
              >
                <div className="flex items-center gap-2 text-sm text-gray-700 mb-4">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-cyan-600" />
                  </div>
                  <span className="font-medium">认知日志</span>
                </div>
                <div className="space-y-4">
                  {logs.map((log, index) => (
                    <motion.article
                      key={log.id}
                      className="rounded-2xl p-5 bg-white/70 backdrop-blur-2xl border border-white/90 shadow-xl shadow-slate-200/60"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 + index * 0.05 }}
                    >
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <Clock className="w-3 h-3 text-gray-500" />
                        </div>
                        <time>{(() => {
                          const dateStr = log.created_at;
                          const date = dateStr ? new Date(dateStr) : new Date('2025-05-01');
                          if (isNaN(date.getTime())) return '2025-05-01';
                          return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
                        })()}</time>
                      </div>
                      <p className="text-[0.9375rem] text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {log.content}
                      </p>
                      {log.tags && log.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {log.tags.map((tag: string, ti: number) => (
                            <span
                              key={ti}
                              className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* 底部操作栏 */}
                      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleLogLike(log.id)}
                            disabled={likeLoading[log.id]}
                            className={`text-xs transition-colors flex items-center gap-1 ${
                              likeErrors[log.id] ? 'text-red-500' : logLikes[log.id]?.liked ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
                            }`}
                            title={likeErrors[log.id] ? '点赞失败，请重试' : logLikes[log.id]?.liked ? '取消点赞' : '点赞'}
                          >
                            <ThumbsUp className={`w-3.5 h-3.5 ${logLikes[log.id]?.liked && !likeErrors[log.id] ? 'fill-blue-500' : ''}`} />
                            {logLikes[log.id]?.count > 0 && <span>{logLikes[log.id].count}</span>}
                          </button>
                          {log.canDelete && (
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
                              title="删除（发布后10分钟内可删除）"
                            >
                              <X className="w-3.5 h-3.5" />
                              删除
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div
              className="mt-12 text-center text-xs text-white/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              时空锚点 · 2026-06-01 · 北京市延庆区
            </motion.div>
          </div>
        </main>

        {/* 底部导航栏 */}
        <BottomNav />
      </div>
    </>
  );
}
