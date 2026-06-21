import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, Trash2, Shield, Image as ImageIcon, Upload, MessageSquare, Settings, Save, Globe, AlertTriangle, Flag, Lock, Unlock, Eye, X, UserPlus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../hooks/useAuth';
import { getPendingBackgroundImages, approveBackgroundImage, rejectBackgroundImage, getSystemBackgrounds, getMessageBoardConfig, updateMessageBoardConfig, getSitemapMode, setSitemapMode, getSitemapStats, type SitemapMode, getAllUsersWithStats, updateUserRole, getDailyPostLimit, updateDailyPostLimit, getPendingSlogans, approveSlogan, rejectSlogan, isUserGuestbookEnabled, setUserGuestbookEnabled, freezeUser, unfreezeUser, getTrustedUsers, setTrustedUser, removeTrustedUser } from '../utils/storage';
import { getAllBlacklist, addToBlacklist, removeFromBlacklist } from '../utils/ip';
import { getDefaultSEO, isAdminFromProfile, parseSupabaseTime } from '../types';
import type { Profile, BackgroundImage, IPBlacklist, SystemBackground } from '../types';
import { supabase, supabaseUrl } from '../supabase/client';

export function AdminPage() {
 const navigate = useNavigate();
 const { user, isLoading: authLoading } = useAuth() as { user: Profile | null; isLoading: boolean };
 const fileInputRef = useRef<HTMLInputElement>(null);
 const [activeTab, setActiveTab] = useState<'images' | 'blacklist' | 'system' | 'messages' | 'sitemap' | 'users' | 'slogans' | 'reports' | 'whitelist'>('images');
 const [globalMessageBoardEnabled, setGlobalMessageBoardEnabled] = useState(true);
 const [messageRateLimit, setMessageRateLimit] = useState(10);
 const [captchaRequired, setCaptchaRequired] = useState(false);
 const [isSavingConfig, setIsSavingConfig] = useState(false);
 const [pendingImages, setPendingImages] = useState<BackgroundImage[]>([]);
 const [blacklist, setBlacklist] = useState<IPBlacklist[]>([]);
 const [systemBackgrounds, setSystemBackgrounds] = useState<SystemBackground[]>([]);
 const [newCidr, setNewCidr] = useState('');
 const [newDescription, setNewDescription] = useState('');
 const [isLoading, setIsLoading] = useState(true);
 const [isUploading, setIsUploading] = useState(false);
 const [uploadError, setUploadError] = useState('');

 const [sitemapMode, setSitemapMode] = useState<SitemapMode>('static');
 const [sitemapStats, setSitemapStats] = useState({ userCount: 0, logCount: 0 });
 const [isSavingSitemap, setIsSavingSitemap] = useState(false);

 const [users, setUsers] = useState<Array<{
 user_id: string;
 display_id: number | null;
 username: string;
 role: string;
 is_admin: boolean;
 is_frozen: boolean;
 today_posts: number;
 }>>([]);
 const [postLimits, setPostLimits] = useState({
 user: 10,
 verified: 10,
 premium: 30,
 });
 const [isLoadingUsers, setIsLoadingUsers] = useState(false);
 const [isSavingLimits, setIsSavingLimits] = useState(false);
 const [userPage, setUserPage] = useState(1);
 const USERS_PER_PAGE = 20;

 const [pendingSlogans, setPendingSlogans] = useState<Array<{
 id: string;
 user_id: string;
 username: string;
 slogan: string;
 created_at: string;
 }>>([]);
 const [currentSloganIndex, setCurrentSloganIndex] = useState(0);
 const [isLoadingSlogans, setIsLoadingSlogans] = useState(false);

 const [userGuestbookEnabled, setUserGuestbookEnabled] = useState(false);
 const [isSavingUserGuestbook, setIsSavingUserGuestbook] = useState(false);

 // 举报管理
 const [reports, setReports] = useState<Array<{
   id: string;
   reporter_id: string;
   reporter_username: string;
   reported_message_id: string;
   message_table: string;
   message_content: string;
   reported_user_id: string;
   reported_username: string;
   reason: string;
   status: 'pending' | 'confirmed' | 'dismissed';
   admin_notes: string | null;
   created_at: string;
 }>>([]);
 const [isLoadingReports, setIsLoadingReports] = useState(false);
 const [reportFilter, setReportFilter] = useState<'pending' | 'confirmed' | 'dismissed'>('pending');
 const [selectedReport, setSelectedReport] = useState<string | null>(null);
 const [reviewNotes, setReviewNotes] = useState('');
 const [isReviewing, setIsReviewing] = useState(false);
 const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());

 // 白名单管理
 const [trustedUsers, setTrustedUsers] = useState<Array<{ user_id: string; username: string; is_admin: boolean }>>([]);
 const [searchUsername, setSearchUsername] = useState('');
 const [searchResults, setSearchResults] = useState<Array<{ user_id: string; username: string; is_admin: boolean; is_trusted: boolean }>>([]);
 const [isSearching, setIsSearching] = useState(false);
 const [isLoadingTrusted, setIsLoadingTrusted] = useState(false);

 useEffect(() => {
 if (authLoading) return;
 const checkAuth = async () => {
 if (!user) {
 navigate('/login');
 return;
 }
 if (!user.is_admin) {
 navigate('/');
 return;
 }
 loadData();
 };
 checkAuth();
 }, [navigate, user, authLoading]);

// 切换到举报管理 tab 时自动加载
useEffect(() => {
 if (activeTab === 'reports') {
  loadReports();
 }
}, [activeTab]);

 const loadData = async () => {
 setIsLoading(true);
 const [images, list, sysBgs, msgConfig, sMode, sStats, usersList, guestbookEnabled] = await Promise.all([
 getPendingBackgroundImages(),
 getAllBlacklist(),
 getSystemBackgrounds(),
 getMessageBoardConfig(),
 getSitemapMode(),
 getSitemapStats(),
 getAllUsersWithStats(),
 isUserGuestbookEnabled(),
 ]);
 setPendingImages(images);
 setBlacklist(list);
 setSystemBackgrounds(sysBgs as any);
 if (msgConfig) {
 setGlobalMessageBoardEnabled(msgConfig.enabled);
 setMessageRateLimit(msgConfig.rateLimit);
 setCaptchaRequired(msgConfig.captchaRequired);
 }
 setSitemapMode(sMode);
 setSitemapStats(sStats);
 setUsers(usersList);
 setUserGuestbookEnabled(guestbookEnabled);
 const slogans = await getPendingSlogans();
 setPendingSlogans(slogans);
 const [userLimit, verifiedLimit, premiumLimit] = await Promise.all([
 getDailyPostLimit('user'),
 getDailyPostLimit('verified'),
 getDailyPostLimit('premium'),
 ]);
 setPostLimits({ user: userLimit, verified: verifiedLimit, premium: premiumLimit });
    setIsLoading(false);
  };

  // 加载白名单
  const loadTrustedUsers = async () => {
    setIsLoadingTrusted(true);
    const users = await getTrustedUsers();
    setTrustedUsers(users);
    setIsLoadingTrusted(false);
  };

  // 加载举报列表
  const loadReports = async (filter?: string) => {
    setIsLoadingReports(true);
    try {
      const edgeUrl = supabaseUrl;
      const session = (await supabase.auth.getSession()).data.session;
      const authHeaders = session ? { Authorization: `Bearer ${session.access_token}` } : {};

      const status = filter ?? reportFilter;
      const response = await fetch(`${edgeUrl}/functions/v1/reports/list?status=${status}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeaders as Record<string, string>),
        },
      });

      const result = await response.json();
      if (result.error) {
        console.error('加载举报列表失败:', result.error, '完整响应:', JSON.stringify(result));
      } else if (result.reports) {
        setReports(result.reports.map((r: any) => ({
          id: r.id,
          reporter_id: r.reporter_id,
          reporter_username: r.reporter_username || '未知',
          reported_message_id: r.reported_message_id,
          message_table: r.message_table,
          message_content: r.message_content,
          reported_user_id: r.reported_user_id,
          reported_username: r.reported_username || '未知',
          reason: r.reason,
          status: r.status,
          admin_notes: r.admin_notes,
          created_at: r.created_at,
        })));
      }
    } catch (err) {
      console.error('加载举报列表失败:', err);
    }
    setIsLoadingReports(false);
  };

  // 审核举报
  const handleReviewReport = async (action: 'confirmed' | 'dismissed') => {
    if (!selectedReport) return;

    setIsReviewing(true);
    try {
      const edgeUrl = supabaseUrl;
      const session = (await supabase.auth.getSession()).data.session;
      const authHeaders = session ? { Authorization: `Bearer ${session.access_token}` } : {};

      const response = await fetch(`${edgeUrl}/functions/v1/reports/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeaders as Record<string, string>),
        },
        body: JSON.stringify({
          reportId: selectedReport,
          status: action,
          notes: reviewNotes.trim() || null,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSelectedReport(null);
        setReviewNotes('');
        await loadReports();
      } else {
        alert('审核失败: ' + result.error);
      }
    } catch (err) {
      console.error('审核举报失败:', err);
      alert('审核失败');
    }
    setIsReviewing(false);
  };

  // 多选切换
  const toggleSelectReport = (id: string) => {
    setSelectedReports(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedReports.size === reports.filter(r => r.status === 'pending').length) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(reports.filter(r => r.status === 'pending').map(r => r.id)));
    }
  };

  // 批量审核
  const handleBatchReview = async (action: 'confirmed' | 'dismissed') => {
    if (selectedReports.size === 0) return;
    if (action === 'confirmed' && !confirm(`确定要确认 ${selectedReports.size} 条举报为违规吗？违规内容将被隐藏，双方将收到通知。`)) return;
    if (action === 'dismissed' && !confirm(`确定要驳回 ${selectedReports.size} 条举报吗？`)) return;

    setIsReviewing(true);
    try {
      const edgeUrl = supabaseUrl;
      const session = (await supabase.auth.getSession()).data.session;
      const authHeaders = session ? { Authorization: `Bearer ${session.access_token}` } : {};

      const response = await fetch(`${edgeUrl}/functions/v1/reports/batch-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeaders as Record<string, string>),
        },
        body: JSON.stringify({
          reportIds: [...selectedReports],
          status: action,
          notes: reviewNotes.trim() || null,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSelectedReports(new Set());
        setReviewNotes('');
        await loadReports();
        alert(`批量处理完成：成功 ${result.results.success} 条${result.results.failed > 0 ? `，失败 ${result.results.failed} 条` : ''}`);
      } else {
        alert('批量处理失败: ' + result.error);
      }
    } catch (err) {
      console.error('批量审核失败:', err);
      alert('批量审核失败');
    }
    setIsReviewing(false);
  };

  const handleSaveSitemapMode = async () => {
 setIsSavingSitemap(true);
 try {
 await setSitemapMode(sitemapMode);
 alert('站点地图设置已保存');
 } catch (err) {
 alert('保存失败：' + (err instanceof Error ? err.message : '未知错误'));
 }
 setIsSavingSitemap(false);
 };

 const handleSaveMessageConfig = async () => {
 setIsSavingConfig(true);
 const result = await updateMessageBoardConfig({
 enabled: globalMessageBoardEnabled,
 rateLimit: messageRateLimit,
 captchaRequired: captchaRequired,
 });
 if (result.success) {
 alert('配置已保存');
 } else {
 alert('保存失败：' + (result.error || '未知错误'));
 }
 setIsSavingConfig(false);
 };

 const toggleUserGuestbook = async () => {
 setIsSavingUserGuestbook(true);
 try {
 await setUserGuestbookEnabled(!userGuestbookEnabled);
 setUserGuestbookEnabled(!userGuestbookEnabled);
 alert('用户间留言板设置已保存');
 } catch (err) {
 alert('保存失败：' + (err instanceof Error ? err.message : '未知错误'));
 }
 setIsSavingUserGuestbook(false);
 };

 const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const files = e.target.files;
 if (!files || files.length === 0) return;
 setIsUploading(true);
 setUploadError('');
 for (const file of Array.from(files)) {
 if (!file.type.startsWith('image/')) {
 setUploadError('请上传图片文件');
 continue;
 }
 if (file.size > 5 * 1024 * 1024) {
 setUploadError('图片大小不能超过5MB');
 continue;
 }
 const reader = new FileReader();
 reader.onload = async (e) => {
 const result = e.target?.result as string;
 const base64 = result.split(',')[1];
 const { data, error } = await supabase.functions.invoke('upload-system-backgrounds', {
 body: { name: file.name, base64Data: base64, contentType: file.type }
 });
 if (error || !data?.success) {
 setUploadError(`上传失败: ${error?.message || data?.error || '未知错误'}`);
 }
 };
 reader.readAsDataURL(file);
 }
 setTimeout(() => {
 loadData();
 setIsUploading(false);
 }, 2000);
 };

 const handleDeleteSystemBg = async (id: string) => {
 const { error } = await supabase
 .from('system_backgrounds')
 .delete()
 .eq('id', id);
 if (!error) {
 loadData();
 }
 };

 const handleApprove = async (imageId: string) => {
 await approveBackgroundImage(imageId);
 loadData();
 };

 const handleReject = async (imageId: string) => {
 await rejectBackgroundImage(imageId);
 loadData();
 };

 const handleAddBlacklist = async () => {
 if (!newCidr) return;
 const result = await addToBlacklist(newCidr, newDescription);
 if (result.success) {
 setNewCidr('');
 setNewDescription('');
 loadData();
 }
 };

 const handleRemoveBlacklist = async (id: string) => {
 await removeFromBlacklist(id);
 loadData();
 };

 return (
 <div className="min-h-screen bg-[var(--bg-primary)]">
 <SEOHead data={{ ...getDefaultSEO(), title: '管理后台 - 认知界' }} />
 <Navbar user={user} />
 <div style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }} className="px-4 py-3">
 <div className="max-w-4xl mx-auto flex items-center gap-3">
 <span style={{ color: '#475569', fontSize: '1.125rem' }}>🔒</span>
 <div>
 <p style={{ color: '#334155', fontWeight: 500, fontSize: '0.875rem' }}>管理面板</p>
 <p style={{ color: '#64748b', fontSize: '0.75rem' }}>仅限管理员访问</p>
 </div>
 </div>
 </div>
 <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
 <div className="max-w-4xl mx-auto">
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
 <div className="flex items-center justify-between mb-8">
 <div>
 <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">管理后台</h1>
 <p className="text-[var(--text-secondary)]">GM 专属功能</p>
 </div>
 <Link to="/" className="flex items-center space-x-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
 <ArrowLeft className="w-5 h-5" />
 <span>返回首页</span>
 </Link>
 </div>
 <div className="flex flex-wrap gap-2 mb-6">
 {[
 { key: 'images', icon: ImageIcon, label: '背景图审核', count: pendingImages.length },
 { key: 'blacklist', icon: Shield, label: 'IP黑名单' },
 { key: 'system', icon: Upload, label: '系统背景' },
 { key: 'messages', icon: MessageSquare, label: '留言板控制' },
 { key: 'sitemap', icon: Globe, label: '站点地图' },
 { key: 'users', icon: Shield, label: '用户权限' },
              { key: 'slogans', icon: MessageSquare, label: 'Slogen 审核', count: pendingSlogans.length },
              { key: 'reports', icon: Flag, label: '举报管理' },
              { key: 'whitelist', icon: CheckCircle, label: '免审白名单' },
            ].map((tab) => (
 <button
 key={tab.key}
 onClick={() => setActiveTab(tab.key as any)}
 className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
 activeTab === tab.key ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
 }`}
 >
 <tab.icon className="w-4 h-4" />
 <span>{tab.label}</span>
                {tab.count && tab.count > 0 && (
 <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs">{tab.count}</span>
 )}
 </button>
 ))}
 </div>
 {activeTab === 'images' && (
 <GlassCard>
 <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">待审核背景图</h2>
 {isLoading ? (
 <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)] mx-auto" /></div>
 ) : pendingImages.length > 0 ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {pendingImages.map((image) => (
 <div key={image.id} className="rounded-xl overflow-hidden border border-[var(--border-light)]">
 <img src={image.url} alt="Background" className="w-full aspect-video object-cover" />
 <div className="p-3">
 <p className="text-sm text-[var(--text-secondary)] mb-2">用户: {(image as any).profiles?.username || image.user_id}</p>
 <div className="flex space-x-2">
 <button onClick={() => handleApprove(image.id)} className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors">
 <CheckCircle className="w-4 h-4" /><span>通过</span>
 </button>
 <button onClick={() => handleReject(image.id)} className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">
 <XCircle className="w-4 h-4" /><span>拒绝</span>
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-12 text-[var(--text-tertiary)]">暂无待审核的背景图</div>
 )}
 </GlassCard>
 )}
 {activeTab === 'blacklist' && (
 <GlassCard>
 <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">IP黑名单管理</h2>
 <div className="flex space-x-2 mb-6">
 <input type="text" value={newCidr} onChange={(e) => setNewCidr(e.target.value)} placeholder="CIDR 格式，如 192.168.1.0/24" className="input-field flex-1" />
 <input type="text" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="描述（可选）" className="input-field flex-1" />
 <button onClick={handleAddBlacklist} disabled={!newCidr} className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50">添加</button>
 </div>
 {isLoading ? (
 <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)] mx-auto" /></div>
 ) : blacklist.length > 0 ? (
 <div className="space-y-2">
 {blacklist.map((item) => (
 <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-secondary)]">
 <div>
 <span className="font-mono text-[var(--text-primary)]">{item.cidr}</span>
 {item.description && <span className="ml-2 text-sm text-[var(--text-tertiary)]">{item.description}</span>}
 </div>
 <button onClick={() => handleRemoveBlacklist(item.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-12 text-[var(--text-tertiary)]">暂无黑名单记录</div>
 )}
 </GlassCard>
 )}
 {activeTab === 'system' && (
 <GlassCard>
 <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">系统背景管理</h2>
 <div className="mb-4">
 <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" multiple className="hidden" />
 <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full px-4 py-3 border border-dashed border-[rgba(0,0,0,0.15)] rounded-xl text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
 {isUploading ? <><div className="w-4 h-4 border-2 border-gray-300 border-t-[var(--accent)] rounded-full animate-spin" /><span>上传中...</span></> : <><Upload className="w-4 h-4" /><span>上传系统背景图</span></>}
 </button>
 {uploadError && <p className="mt-2 text-xs text-red-500">{uploadError}</p>}
 <p className="mt-2 text-xs text-[var(--text-tertiary)]">支持 JPG、PNG 格式，最大 5MB</p>
 </div>
 {isLoading ? (
 <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)] mx-auto" /></div>
 ) : systemBackgrounds.length > 0 ? (
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
 {systemBackgrounds.map((bg) => (
 <div key={bg.id} className="relative aspect-video rounded-xl overflow-hidden border border-[var(--border-light)] group">
 <img src={bg.url} alt={bg.name || '系统背景'} className="w-full h-full object-cover" />
 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
 <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
 <span className="text-xs text-white truncate">{bg.name || '系统背景'}</span>
 <button onClick={() => handleDeleteSystemBg(bg.id)} className="p-1.5 bg-white/20 text-white hover:bg-red-500/80 rounded-lg transition-colors"><Trash2 className="w-3 h-3" /></button>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-12 text-[var(--text-tertiary)]">暂无系统背景图</div>
 )}
 </GlassCard>
 )}
 {activeTab === 'messages' && (
 <div className="space-y-6">
 <GlassCard>
 <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Settings className="w-5 h-5" />留言板全局控制</h2>
 <div className="space-y-6">
 <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl">
 <div>
 <h3 className="font-medium text-[var(--text-primary)]">全局留言板开关</h3>
 <p className="text-sm text-[var(--text-secondary)]">关闭后，所有用户都无法发送和查看留言</p>
 </div>
 <button onClick={() => setGlobalMessageBoardEnabled(!globalMessageBoardEnabled)} className={`w-12 h-6 rounded-full transition-colors relative ${globalMessageBoardEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
 <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${globalMessageBoardEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
 </button>
 </div>
 <div className="p-4 bg-[var(--bg-secondary)] rounded-xl space-y-4">
 <div>
 <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">最大留言数（每小时）</label>
 <input type="number" value={messageRateLimit} onChange={(e) => setMessageRateLimit(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-[var(--border-light)] rounded-lg text-[var(--text-primary)]" min="1" max="100" />
 <p className="text-xs text-[var(--text-tertiary)] mt-1">每个用户每小时最多发送的留言数</p>
 </div>
 <div>
 <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">需要验证码（超过限制时）</label>
 <select value={captchaRequired ? 'true' : 'false'} onChange={(e) => setCaptchaRequired(e.target.value === 'true')} className="w-full px-3 py-2 bg-white border border-[var(--border-light)] rounded-lg text-[var(--text-primary)]">
 <option value="true">是</option>
 <option value="false">否</option>
 </select>
 </div>
 </div>
 <button onClick={handleSaveMessageConfig} disabled={isSavingConfig} className="w-full px-4 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
 {isSavingConfig ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />保存中...</> : <><Save className="w-4 h-4" />保存设置</>}
 </button>
 </div>
 </GlassCard>
 <GlassCard>
 <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5" />用户间留言板</h2>
 <div className="space-y-6">
 <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl">
 <div>
 <h3 className="font-medium text-[var(--text-primary)]">用户间留言板开关</h3>
 <p className="text-sm text-[var(--text-secondary)]">开启后，用户可以在个人主页互相留言</p>
 </div>
 <button onClick={toggleUserGuestbook} disabled={isSavingUserGuestbook} className={`w-12 h-6 rounded-full transition-colors relative ${userGuestbookEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
 <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${userGuestbookEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
 </button>
 </div>
 <div className="p-4 bg-amber-50 rounded-lg">
 <p className="text-sm text-amber-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />注意：用户间留言板功能涉及用户隐私，请谨慎开启</p>
 </div>
 </div>
 </GlassCard>
 </div>
 )}
 {activeTab === 'sitemap' && (
 <GlassCard>
 <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Globe className="w-5 h-5" />站点地图设置</h2>
 <div className="space-y-6">
 <div className="p-4 bg-[var(--bg-secondary)] rounded-xl">
 <h3 className="font-medium text-[var(--text-primary)] mb-3">当前数据</h3>
 <div className="grid grid-cols-2 gap-4">
 <div className="p-3 bg-white rounded-lg">
 <p className="text-sm text-[var(--text-secondary)]">用户数量</p>
 <p className="text-2xl font-bold text-[var(--text-primary)]">{sitemapStats.userCount}</p>
 </div>
 <div className="p-3 bg-white rounded-lg">
 <p className="text-sm text-[var(--text-secondary)]">日志数量</p>
 <p className="text-2xl font-bold text-[var(--text-primary)]">{sitemapStats.logCount}</p>
 </div>
 </div>
 </div>
 <div className="p-4 bg-[var(--bg-secondary)] rounded-xl">
 <h3 className="font-medium text-[var(--text-primary)] mb-3">站点地图模式</h3>
 <div className="space-y-3">
 <button onClick={() => setSitemapMode('static')} className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${sitemapMode === 'static' ? 'border-[var(--accent)] bg-white' : 'border-transparent bg-white hover:border-gray-200'}`}>
 <div className="flex items-center justify-between">
 <div><p className="font-medium text-[var(--text-primary)]">静态模式</p><p className="text-sm text-[var(--text-secondary)]">使用预生成的 sitemap.xml，适合内容稳定的站点</p></div>
 {sitemapMode === 'static' && <CheckCircle className="w-5 h-5 text-[var(--accent)]" />}
 </div>
 </button>
 <button onClick={() => setSitemapMode('dynamic')} className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${sitemapMode === 'dynamic' ? 'border-[var(--accent)] bg-white' : 'border-transparent bg-white hover:border-gray-200'}`}>
 <div className="flex items-center justify-between">
 <div><p className="font-medium text-[var(--text-primary)]">动态模式</p><p className="text-sm text-[var(--text-secondary)]">实时生成站点地图，包含最新用户和日志</p></div>
 {sitemapMode === 'dynamic' && <CheckCircle className="w-5 h-5 text-[var(--accent)]" />}
 </div>
 </button>
 </div>
 </div>
 <button onClick={handleSaveSitemapMode} disabled={isSavingSitemap} className="w-full px-4 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
 {isSavingSitemap ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />保存中...</> : <><Save className="w-4 h-4" />保存设置</>}
 </button>
 </div>
 </GlassCard>
 )}
 {activeTab === 'users' && (
 <div className="space-y-6">
 <GlassCard>
 <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Settings className="w-5 h-5" />每日发布限额配置</h2>
 <div className="p-4 bg-amber-50 rounded-lg mb-6">
 <p className="text-sm text-amber-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />当成本较高时，建议将访客和认证用户限额下调至5条</p>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
 <div>
 <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">普通用户 (user)</label>
 <input type="number" min="1" max="100" value={postLimits.user} onChange={(e) => setPostLimits({ ...postLimits, user: parseInt(e.target.value) || 10 })} className="w-full px-4 py-2 rounded-lg border border-[var(--border-light)] bg-white" />
 </div>
 <div>
 <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">认证用户 (verified)</label>
 <input type="number" min="1" max="100" value={postLimits.verified} onChange={(e) => setPostLimits({ ...postLimits, verified: parseInt(e.target.value) || 10 })} className="w-full px-4 py-2 rounded-lg border border-[var(--border-light)] bg-white" />
 </div>
 <div>
 <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">付费用户 (premium)</label>
 <input type="number" min="1" max="100" value={postLimits.premium} onChange={(e) => setPostLimits({ ...postLimits, premium: parseInt(e.target.value) || 30 })} className="w-full px-4 py-2 rounded-lg border border-[var(--border-light)] bg-white" />
 </div>
 </div>
 <button onClick={async () => { setIsSavingLimits(true); const results = await Promise.all([updateDailyPostLimit('user', postLimits.user), updateDailyPostLimit('verified', postLimits.verified), updateDailyPostLimit('premium', postLimits.premium)]); if (results.every(r => r.success)) { alert('限额配置已保存'); } else { alert('保存失败'); } setIsSavingLimits(false); }} disabled={isSavingLimits} className="w-full px-4 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
 {isSavingLimits ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />保存中...</> : <><Save className="w-4 h-4" />保存限额配置</>}
 </button>
 </GlassCard>
 <GlassCard>
 <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Shield className="w-5 h-5" />用户权限管理</h2>
 {isLoadingUsers ? (
 <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)] mx-auto" /></div>
 ) : users.length > 0 ? (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="border-b border-[var(--border-light)]">
 <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">用户ID</th>
 <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">用户名</th>
 <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">等级</th>
 <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">今日发布</th>
 <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">状态</th>
 <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">管理员</th>
 <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">操作</th>
 </tr>
 </thead>
 <tbody>
 {users.slice((userPage - 1) * USERS_PER_PAGE, userPage * USERS_PER_PAGE).map((u) => (
 <tr key={u.user_id} className="border-b border-[var(--border-light)] last:border-0">
 <td className="py-3 px-4"><span className="font-mono text-xs text-[var(--text-secondary)]">{String(u.display_id ?? '').padStart(9, '0')}</span></td>
 <td className="py-3 px-4"><span className="font-medium text-[var(--text-primary)]">{u.username}</span></td>
 <td className="py-3 px-4">
 <select value={u.role} onChange={async (e) => { const result = await updateUserRole(u.user_id, e.target.value as 'user' | 'verified' | 'premium'); if (result.success) { loadData(); } else { alert('更新失败：' + result.error); } }} disabled={u.is_admin} className="px-3 py-1 rounded-lg border border-[var(--border-light)] bg-white text-sm disabled:opacity-50">
 <option value="user">普通用户</option>
 <option value="verified">认证用户</option>
 <option value="premium">付费用户</option>
 </select>
 </td>
 <td className="py-3 px-4"><span className={`text-sm ${u.today_posts >= postLimits[u.role as keyof typeof postLimits] ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>{u.today_posts} 条</span></td>
 <td className="py-3 px-4">
 {u.is_frozen ? (
 <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
 <Lock className="w-3 h-3" />已冻结
 </span>
 ) : (
 <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">正常</span>
 )}
 </td>
 <td className="py-3 px-4">{u.is_admin ? <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">管理员</span> : <span className="text-[var(--text-tertiary)] text-sm">-</span>}</td>
 <td className="py-3 px-4">
 <div className="flex items-center gap-2">
 <Link to={`/${String(u.display_id ?? 0).padStart(9, '0')}`} className="text-sm text-[var(--accent)] hover:underline">查看</Link>
 {!u.is_admin && (
 u.is_frozen ? (
 <button
 onClick={async () => {
 if (confirm(`确定要解冻用户 "${u.username}" 吗？`)) {
 const result = await unfreezeUser(u.user_id);
 if (result.success) {
 loadData();
 } else {
 alert('解冻失败：' + result.error);
 }
 }
 }}
 className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
 >
 <Unlock className="w-3 h-3" />解冻
 </button>
 ) : (
 <button
 onClick={async () => {
 const reason = prompt(`请输入冻结用户 "${u.username}" 的原因：`);
 if (reason) {
 const result = await freezeUser(u.user_id, reason);
 if (result.success) {
 try {
 await (supabase.rpc as any)('send_freeze_notification', {
 p_user_display_id: u.user_id,
 p_reason: reason,
 });
 } catch (e) { console.error('发送冻结通知失败:', e); }
 loadData();
 } else {
 alert('冻结失败：' + result.error);
 }
 }
 }}
 className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
 >
 <Lock className="w-3 h-3" />冻结
 </button>
 )
 )}
   {/* 删除用户按钮（非 admin 账号可删除） */}
   {u.username !== 'admin' && (
     <button
       onClick={async () => {
         const msg = `⚠️ 确定要永久删除用户 "${u.username}"（ID: ${String(u.display_id ?? 0).padStart(9, '0')}）吗？\n\n此操作不可撤销！\n该用户的所有日志、点赞、留言和上传的背景图将一并删除。`;
         if (!confirm(msg)) return;
         if (!confirm('⚠️ 再次确认：删除后无法恢复，确定继续？')) return;
         const { data, error } = await (supabase.rpc as any)('admin_delete_user', { target_user_id: u.user_id });;
         const result = data as { success: boolean; error?: string } | null;
         if (error || result?.error) {
           alert('删除失败：' + (result?.error || error?.message || '未知错误'));
         } else {
           alert(`用户 "${u.username}" 已删除`);
           loadData();
         }
       }}
       className="text-sm text-red-700 hover:text-red-900 flex items-center gap-1 font-medium"
       title="永久删除此用户及其所有数据"
     >
       <Trash2 className="w-3.5 h-3.5" />删除
     </button>
   )}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 {/* 分页 */}
 {users.length > USERS_PER_PAGE && (() => {
   const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
   const pages: number[] = [];
   const maxVisible = 5;
   let start = Math.max(1, userPage - Math.floor(maxVisible / 2));
   let end = Math.min(totalPages, start + maxVisible - 1);
   if (end - start + 1 < maxVisible) {
     start = Math.max(1, end - maxVisible + 1);
   }
   for (let i = start; i <= end; i++) pages.push(i);
   return (
     <div className="mt-4 flex items-center justify-center gap-1">
       <button
         onClick={() => setUserPage(p => Math.max(1, p - 1))}
         disabled={userPage === 1}
         className="px-3 py-1.5 rounded-lg text-sm hover:bg-[var(--bg-secondary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
       >
         <ChevronLeft className="w-4 h-4" />
       </button>
       {start > 1 && (
         <>
           <button onClick={() => setUserPage(1)} className="px-3 py-1.5 rounded-lg text-sm hover:bg-[var(--bg-secondary)] transition-colors">1</button>
           {start > 2 && <span className="px-1 text-[var(--text-tertiary)]">...</span>}
         </>
       )}
       {pages.map(p => (
         <button
           key={p}
           onClick={() => setUserPage(p)}
           className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
             p === userPage
               ? 'bg-[var(--accent)] text-white'
               : 'hover:bg-[var(--bg-secondary)]'
           }`}
         >
           {p}
         </button>
       ))}
       {end < totalPages && (
         <>
           {end < totalPages - 1 && <span className="px-1 text-[var(--text-tertiary)]">...</span>}
           <button onClick={() => setUserPage(totalPages)} className="px-3 py-1.5 rounded-lg text-sm hover:bg-[var(--bg-secondary)] transition-colors">{totalPages}</button>
         </>
       )}
       <button
         onClick={() => setUserPage(p => Math.min(totalPages, p + 1))}
         disabled={userPage === totalPages}
         className="px-3 py-1.5 rounded-lg text-sm hover:bg-[var(--bg-secondary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
       >
         <ChevronRight className="w-4 h-4" />
       </button>
       <span className="ml-3 text-xs text-[var(--text-tertiary)]">共 {users.length} 人</span>
     </div>
   );
 })()}
 </div>
 ) : (
 <p className="text-center py-8 text-[var(--text-tertiary)]">暂无用户数据</p>
 )}
 </GlassCard>
 </div>
 )}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <GlassCard>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <Flag className="w-5 h-5" />
                        举报管理
                      </h2>
                      {reportFilter === 'pending' && reports.some(r => r.status === 'pending') && (
                        <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer select-none hover:text-[var(--text-primary)] transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedReports.size > 0 && selectedReports.size === reports.filter(r => r.status === 'pending').length}
                            onChange={toggleSelectAll}
                            className="rounded border-gray-300 text-[var(--accent)] focus:ring-[var(--accent)]"
                          />
                          全选待处理
                        </label>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {(['pending', 'confirmed', 'dismissed'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => { setReportFilter(filter); loadReports(filter); }}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                            reportFilter === filter
                              ? 'bg-[var(--accent)] text-white'
                              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-light)]'
                          }`}
                        >
                          {filter === 'pending' ? '待处理' : filter === 'confirmed' ? '已确认' : '已驳回'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 批量操作栏 */}
                  {selectedReports.size > 0 && (
                    <div className="flex items-center justify-between p-3 mb-3 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/30">
                      <span className="text-sm font-medium text-[var(--accent)]">已选择 {selectedReports.size} 条举报</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleBatchReview('confirmed')}
                          disabled={isReviewing}
                          className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center gap-1"
                        >
                          {isReviewing ? (
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <><Eye className="w-3.5 h-3.5" />批量确认违规</>
                          )}
                        </button>
                        <button
                          onClick={() => handleBatchReview('dismissed')}
                          disabled={isReviewing}
                          className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-sm hover:bg-gray-300 disabled:opacity-50 transition-colors flex items-center gap-1"
                        >
                          {isReviewing ? (
                            <div className="w-3.5 h-3.5 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" />
                          ) : (
                            <><XCircle className="w-3.5 h-3.5" />批量驳回</>
                          )}
                        </button>
                        <button
                          onClick={() => setSelectedReports(new Set())}
                          className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          取消选择
                        </button>
                      </div>
                    </div>
                  )}

                  {isLoadingReports ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)] mx-auto" />
                    </div>
                  ) : reports.length > 0 ? (
                    <div className="space-y-3">
                      {reports.map((report) => (
                        <div
                          key={report.id}
                          onClick={() => { setSelectedReport(report.id); setReviewNotes(report.admin_notes || ''); }}
                          className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                            selectedReport === report.id
                              ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                              : 'border-[var(--border-light)] hover:border-[var(--accent)]/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {report.status === 'pending' && (
                              <div className="pt-0.5" onClick={e => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selectedReports.has(report.id)}
                                  onChange={() => toggleSelectReport(report.id)}
                                  className="rounded border-gray-300 text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  report.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                  report.status === 'confirmed' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {report.status === 'pending' ? '待处理' : report.status === 'confirmed' ? '已确认' : '已驳回'}
                                </span>
                                <span className="text-xs text-[var(--text-tertiary)]">
                                  {parseSupabaseTime(report.created_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
                                </span>
                              </div>
                              <p className="text-sm text-[var(--text-secondary)] mb-1">
                                举报者: {report.reporter_username}
                              </p>
                              <p className="text-sm text-[var(--text-secondary)] mb-1">
                                被举报用户: {report.reported_username}
                              </p>
                              <p className="text-sm text-[var(--text-primary)] line-clamp-2">
                                原因: {report.reason}
                              </p>
                              <p className="text-xs text-[var(--text-tertiary)] mt-2 line-clamp-1">
                                内容: {report.message_content}
                              </p>
                            </div>
                            <Eye className="w-4 h-4 text-[var(--text-tertiary)]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>
                      <p className="text-lg font-medium text-[var(--text-primary)] mb-2">
                        {reportFilter === 'pending' ? '暂无待处理的举报' : '暂无举报记录'}
                      </p>
                    </div>
                  )}
                </GlassCard>

                {/* 举报详情 */}
                <AnimatePresence>
                  {selectedReport && (() => {
                    const report = reports.find(r => r.id === selectedReport);
                    if (!report) return null;
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                      >
                        <GlassCard>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">举报详情</h3>
                            <button
                              onClick={() => setSelectedReport(null)}
                              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                              <X className="w-5 h-5 text-[var(--text-secondary)]" />
                            </button>
                          </div>

                          <div className="space-y-4">
                            <div className="p-4 bg-[var(--bg-secondary)] rounded-xl">
                              <p className="text-sm text-[var(--text-secondary)] mb-1">被举报内容</p>
                              <p className="text-[var(--text-primary)]">{report.message_content}</p>
                              <p className="text-xs text-[var(--text-tertiary)] mt-2">
                                来源: {report.message_table === 'logs' ? '认知日志' :
                                       report.message_table === 'guestbook_messages' ? '留言板' : '用户留言'}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-[var(--text-secondary)] mb-1">举报者</p>
                                <p className="font-medium text-[var(--text-primary)]">{report.reporter_username}</p>
                              </div>
                              <div>
                                <p className="text-sm text-[var(--text-secondary)] mb-1">被举报用户</p>
                                <p className="font-medium text-[var(--text-primary)]">{report.reported_username}</p>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm text-[var(--text-secondary)] mb-1">举报原因</p>
                              <p className="text-[var(--text-primary)]">{report.reason}</p>
                            </div>

                            {report.status === 'pending' && (
                              <>
                                <div>
                                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                    处理备注（可选）
                                  </label>
                                  <textarea
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="添加处理备注..."
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-lg border border-[var(--border-light)] bg-white resize-none"
                                  />
                                </div>

                                <div className="flex gap-3">
                                  <button
                                    onClick={() => handleReviewReport('confirmed')}
                                    disabled={isReviewing}
                                    className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                  >
                                    {isReviewing ? (
                                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                      <>
                                        <Eye className="w-4 h-4" />
                                        确认违规（隐藏内容）
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleReviewReport('dismissed')}
                                    disabled={isReviewing}
                                    className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                  >
                                    {isReviewing ? (
                                      <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" />
                                    ) : (
                                      <>
                                        <XCircle className="w-4 h-4" />
                                        无法认定，驳回
                                      </>
                                    )}
                                  </button>
                                </div>
                              </>
                            )}

                            {report.status !== 'pending' && (
                              <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-sm text-[var(--text-secondary)] mb-1">处理结果</p>
                                <p className="text-[var(--text-primary)]">
                                  {report.status === 'confirmed' ? '已确认违规（内容已隐藏，双方已通知）' : '已驳回举报'}
                                </p>
                                {report.admin_notes && (
                                  <p className="text-sm text-[var(--text-secondary)] mt-2">
                                    备注: {report.admin_notes}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </GlassCard>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>
            )}
            {activeTab === 'slogans' && (
              <GlassCard>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Slogen 审核</h2>
 {isLoadingSlogans ? (
 <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)] mx-auto" /></div>
 ) : pendingSlogans.length > 0 && currentSloganIndex < pendingSlogans.length ? (
 <div className="space-y-6">
 <div className="bg-[var(--bg-secondary)] rounded-xl p-6">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
 <span className="text-purple-600 font-bold">{pendingSlogans[currentSloganIndex].username.charAt(0).toUpperCase()}</span>
 </div>
 <div>
 <p className="font-semibold text-[var(--text-primary)]">{pendingSlogans[currentSloganIndex].username}</p>
 <p className="text-xs text-[var(--text-tertiary)]">注册时间：{parseSupabaseTime(pendingSlogans[currentSloganIndex].created_at).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
 </div>
 </div>
 <blockquote className="text-xl font-medium text-[var(--text-primary)] italic border-l-4 border-purple-300 pl-4 py-2">"{pendingSlogans[currentSloganIndex].slogan}"</blockquote>
 </div>
 <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
 <span>待审核：{pendingSlogans.length - currentSloganIndex} 条</span>
 <span>进度：{currentSloganIndex + 1} / {pendingSlogans.length}</span>
 </div>
 <div className="grid grid-cols-5 gap-2">
 <button onClick={async () => { const result = await approveSlogan(pendingSlogans[currentSloganIndex].user_id); if (result.success) { setCurrentSloganIndex(prev => prev + 1); } else { alert('审核失败：' + result.error); } }} className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"><CheckCircle className="w-4 h-4" /><span>展示</span></button>
 <button onClick={async () => { if (!confirm(`确定拒绝展示 "${pendingSlogans[currentSloganIndex].username}" 的 Slogan？（不会删除原文）`)) return; const result = await rejectSlogan(pendingSlogans[currentSloganIndex].user_id); if (result.success) { setCurrentSloganIndex(prev => prev + 1); } else { alert('拒绝失败：' + result.error); } }} className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"><XCircle className="w-4 h-4" /><span>拒绝展示</span></button>
 <button onClick={() => setCurrentSloganIndex(prev => prev + 1)} className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"><span>跳过</span></button>
 <button onClick={() => setCurrentSloganIndex(prev => Math.min(prev + 1, pendingSlogans.length))} className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-light)] transition-colors"><span>下一条</span></button>
 <button onClick={() => setCurrentSloganIndex(prev => Math.min(prev + 5, pendingSlogans.length))} className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-light)] transition-colors"><span>下5条</span></button>
 </div>
 </div>
 ) : (
 <div className="text-center py-12">
 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-green-500" /></div>
 <p className="text-lg font-medium text-[var(--text-primary)] mb-2">所有 Slogan 已审核</p>
 <p className="text-sm text-[var(--text-secondary)]">暂无待审核的 Slogan</p>
 </div>
 )}
 </GlassCard>
 )}
            {activeTab === 'whitelist' && (
              <GlassCard>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />免审白名单管理
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                  白名单用户发布日志可跳过内容审核（节省 API 费用）。管理员默认免审。
                </p>

                {/* 已信任用户列表 */}
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">当前白名单用户</h3>
                  {isLoadingTrusted ? (
                    <div className="text-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--accent)] mx-auto" />
                    </div>
                  ) : trustedUsers.length > 0 ? (
                    <div className="space-y-2">
                      {trustedUsers.map((u) => (
                        <div key={u.user_id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-secondary)]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-indigo-600 font-bold text-sm">{u.username.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <span className="font-medium text-[var(--text-primary)]">{u.username}</span>
                              {u.is_admin && (
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs">管理员</span>
                              )}
                            </div>
                          </div>
                          {!u.is_admin && (
                            <button
                              onClick={async () => {
                                const result = await removeTrustedUser(u.user_id);
                                if (result.success) {
                                  loadTrustedUsers();
                                } else {
                                  alert('移除失败：' + result.error);
                                }
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm"
                            >
                              <XCircle className="w-4 h-4" />移出白名单
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-tertiary)] text-center py-4">暂无白名单用户</p>
                  )}
                </div>

                {/* 搜索并添加用户 */}
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">添加用户到白名单</h3>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={searchUsername}
                      onChange={(e) => setSearchUsername(e.target.value)}
                      placeholder="输入用户名搜索..."
                      className="flex-1 px-4 py-2 rounded-lg border border-[var(--border-light)] bg-white text-sm"
                    />
                    <button
                      onClick={async () => {
                        if (!searchUsername.trim()) return;
                        setIsSearching(true);
                        const { data, error } = await (supabase as any)
                          .from('profiles')
                          .select('user_id, username, is_admin, is_trusted')
                          .ilike('username', `%${searchUsername.trim()}%`)
                          .limit(10);
                        if (error) {
                          console.error('搜索用户失败:', error);
                          setSearchResults([]);
                        } else {
                          setSearchResults(data || []);
                        }
                        setIsSearching(false);
                      }}
                      disabled={isSearching || !searchUsername.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 text-sm"
                    >
                      <Search className="w-4 h-4" />搜索
                    </button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      {searchResults.map((u) => (
                        <div key={u.user_id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-secondary)]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 font-bold text-sm">{u.username.charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="text-[var(--text-primary)]">{u.username}</span>
                            {u.is_admin && <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs">管理员</span>}
                            {u.is_trusted && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">已信任</span>}
                          </div>
                          {!u.is_trusted ? (
                            <button
                              onClick={async () => {
                                const result = await setTrustedUser(u.user_id);
                                if (result.success) {
                                  setSearchResults(searchResults.map(r => r.user_id === u.user_id ? { ...r, is_trusted: true } : r));
                                  loadTrustedUsers();
                                } else {
                                  alert('添加失败：' + result.error);
                                }
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors text-sm"
                            >
                              <UserPlus className="w-4 h-4" />加入白名单
                            </button>
                          ) : (
                            <span className="text-sm text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />已在白名单
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.length === 0 && !isSearching && searchUsername.trim() && (
                    <p className="text-sm text-[var(--text-tertiary)] text-center py-4">未找到匹配的用户</p>
                  )}
                </div>
              </GlassCard>
            )}
 </motion.div>
 </div>
 </div>
 <footer style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
 <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>管理面板 · 仅限管理员访问</p>
 </footer>
 <Footer />
 </div>
 );
}
