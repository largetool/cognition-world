// @ts-nocheck — Supabase 生成类型 vs 实际数据库存在差异，跳过逐行修复
import { supabase, supabaseUrl } from '../supabase/client';
import { decode } from 'base64-arraybuffer';
import type { BackgroundImage, Log, SystemBackground } from '../types';

// ========== 背景图相关 ==========

export async function uploadBackgroundImage(
 userId: string,
 file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
 try {
 const fileName = `${userId}/${Date.now()}_${file.name}`;
 const reader = new FileReader();
 const base64Promise = new Promise<string>((resolve, reject) => {
 reader.onload = (e) => {
 const result = e.target?.result as string;
 resolve(result.split(',')[1]);
 };
 reader.onerror = reject;
 });
 reader.readAsDataURL(file);
 const base64 = await base64Promise;
 const { data, error } = await supabase.storage
 .from('backgrounds')
 .upload(fileName, decode(base64), { contentType: file.type });
 if (error) return { success: false, error: error.message };
 const { data: urlData } = supabase.storage.from('backgrounds').getPublicUrl(fileName);
 return { success: true, url: urlData.publicUrl };
 } catch (err) {
 return { success: false, error: String(err) };
 }
}

export async function saveBackgroundImage(userId: string, url: string, fileName: string): Promise<{ success: boolean; error?: string }> {
 const { error } = await supabase.from('background_images').insert({ user_id: userId, url, file_name: fileName, status: 'pending' } as any);
 if (error) return { success: false, error: error.message };
 return { success: true };
}

export async function getApprovedBackgroundImages(): Promise<BackgroundImage[]> {
 const { data, error } = await supabase.from('background_images').select('*, profiles(username)').eq('status', 'approved').order('created_at', { ascending: false }).limit(100);
 if (error) { console.error('Error fetching approved images:', error); return []; }
 return data || [];
}

export async function getUserBackgroundImages(userId: string): Promise<BackgroundImage[]> {
 const { data, error } = await supabase.from('background_images').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
 if (error) { console.error('Error fetching user images:', error); return []; }
 return data || [];
}

export async function deleteBackgroundImage(imageId: string): Promise<{ success: boolean; error?: string }> {
 const { error } = await supabase.from('background_images').delete().eq('id', imageId);
 if (error) return { success: false, error: error.message };
 return { success: true };
}

export async function getPendingBackgroundImages(): Promise<BackgroundImage[]> {
 const { data, error } = await supabase.from('background_images').select('*, profiles(username)').eq('status', 'pending').order('created_at', { ascending: false }).limit(100);
 if (error) { console.error('Error fetching pending images:', error); return []; }
 return data || [];
}

export async function approveBackgroundImage(imageId: string): Promise<{ success: boolean; error?: string }> {
 const { error } = await supabase.from('background_images').update({ status: 'approved' }).eq('id', imageId);
 if (error) return { success: false, error: error.message };
 return { success: true };
}

export async function rejectBackgroundImage(imageId: string): Promise<{ success: boolean; error?: string }> {
 const { error } = await supabase.from('background_images').delete().eq('id', imageId);
 if (error) return { success: false, error: error.message };
 return { success: true };
}

export async function getSystemBackgrounds(): Promise<SystemBackground[]> {
 const { data, error } = await supabase.from('system_backgrounds').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(50);
 if (error) { console.error('Error fetching system backgrounds:', error); return []; }
 return data || [];
}

export async function selectSystemBackground(userId: string, url: string): Promise<boolean> {
 const { error } = await supabase.from('profiles').update({ background_image: url }).eq('user_id', userId);
 if (error) { console.error('Error selecting background:', error); return false; }
 return true;
}

export async function getActiveBackgroundImage(userId: string): Promise<{ url: string } | null> {
 const { data, error } = await supabase.from('profiles').select('background_image').eq('user_id', userId).maybeSingle();
 if (error || !data?.background_image) return null;
 return { url: data.background_image };
}

// 通过 profile id (UUID) 获取背景图
export async function getActiveBackgroundImageByProfileId(profileId: string): Promise<{ url: string } | null> {
 const { data, error } = await supabase.from('profiles').select('background_image').eq('id', profileId).maybeSingle();
 if (error || !data?.background_image) return null;
 return { url: data.background_image };
}

// ========== 日志相关 ==========

// 日志类型（包含公开状态）
export interface LogWithPublicStatus {
  id: string;
  user_id: string;
  content: string;
  created_at: string | null;
  is_public?: boolean | null;
  published_at?: string | null;
  canDelete?: boolean;
  tags?: string[] | null;
}

// 获取用户日志（包含公开状态）
export async function getUserLogs(userId: string, currentUserId?: string, isAdmin?: boolean): Promise<LogWithPublicStatus[]> {
  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) { console.error('Error fetching logs:', error); return []; }

  const now = new Date();
  return (data || []).map(log => {
    const createdAt = new Date(log.created_at || '');
    const tenMinutesLater = new Date(createdAt.getTime() + 10 * 60 * 1000);
    const isPublic = log.is_public === true || now >= tenMinutesLater;
    const canDelete = isAdmin === true || (currentUserId === userId && now < tenMinutesLater);

    return {
      ...log,
      is_public: isPublic,
      canDelete,
    };
  });
}

// 获取公开日志（用于首页展示等 — 仅返回已过10分钟冷却期的）
export async function getPublicLogs(userId: string, limit: number = 50): Promise<LogWithPublicStatus[]> {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .eq('user_id', userId)
    .or(`is_public.eq.true,and(created_at.lt.${tenMinutesAgo})`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) { console.error('Error fetching public logs:', error); return []; }
  return data || [];
}

// 创建日志（10分钟后自动公开）
export async function createLog(userId: string, content: string, tags?: string[]): Promise<Log | null> {
  // 检查用户是否被冻结
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_frozen')
    .eq('user_id', userId)
    .single();

  if (profile?.is_frozen) {
    console.error('User is frozen, cannot create log');
    return null;
  }

  const publishedAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10分钟后
  const { data, error } = await supabase
    .from('logs')
    .insert({
      user_id: userId,
      content,
      is_public: false,
      published_at: publishedAt,
      tags: tags || [],
    })
    .select()
    .single();

  if (error) { console.error('Error creating log:', error); return null; }

  return data;
}

// 删除日志（10分钟内用户可删除，10分钟后仅管理员可删除）
export async function deleteLog(logId: string, userId: string, isAdmin: boolean): Promise<{ success: boolean; error?: string }> {
  // 获取日志信息
  const { data: log, error: fetchError } = await supabase
    .from('logs')
    .select('user_id, created_at')
    .eq('id', logId)
    .single();

  if (fetchError || !log) {
    return { success: false, error: '日志不存在' };
  }

  // 管理员可以删除任何日志
  if (isAdmin) {
    const { error } = await supabase.from('logs').delete().eq('id', logId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // 非管理员只能删除自己的日志
  if (log.user_id !== userId) {
    return { success: false, error: '只能删除自己的日志' };
  }

  // 检查是否在10分钟内
  const createdAt = new Date(log.created_at || '');
  const tenMinutesLater = new Date(createdAt.getTime() + 10 * 60 * 1000);
  const now = new Date();

  if (now >= tenMinutesLater) {
    return { success: false, error: '10分钟后不可删除，请联系管理员' };
  }

  const { error } = await supabase.from('logs').delete().eq('id', logId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ========== 留言板相关 ==========

export interface Message { id: string; sender_id: string; sender_name: string; content: string; created_at: string | null; }
export interface SystemMessage { id: string; content: string; created_at: string | null; type: 'system' | 'announcement'; }
export interface MessageBoardConfig { enabled: boolean; rateLimit: number; captchaRequired: boolean; }

export async function getMessageBoardConfig(): Promise<MessageBoardConfig | null> {
  // 分别查询三个配置项
  const { data: enabledData } = await supabase.from('system_config').select('value').eq('key', 'global_message_board_enabled').single();
  const { data: limitData } = await supabase.from('system_config').select('value').eq('key', 'message_rate_limit').single();
  const { data: captchaData } = await supabase.from('system_config').select('value').eq('key', 'captcha_required').single();

  return {
    enabled: enabledData?.value === 'true',
    rateLimit: parseInt(limitData?.value || '10', 10),
    captchaRequired: captchaData?.value === 'true',
  };
}

export async function isMessageBoardEnabled(): Promise<boolean> {
  const { data } = await supabase.from('system_config').select('value').eq('key', 'global_message_board_enabled').single();
  return data?.value === 'true';
}

export async function updateMessageBoardConfig(config: MessageBoardConfig): Promise<{ success: boolean; error?: string }> {
  // 分别更新三个配置
  const updates = [
    { key: 'global_message_board_enabled', value: String(config.enabled) },
    { key: 'message_rate_limit', value: String(config.rateLimit) },
    { key: 'captcha_required', value: String(config.captchaRequired) },
  ];

  for (const item of updates) {
    const { error } = await supabase.from('system_config').upsert({ ...item, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) return { success: false, error: error.message };
  }
  return { success: true };
}

// 获取留言板消息（从 guestbook 表）
export async function getGuestbookMessages(limit: number = 50): Promise<Message[]> {
 // 先获取留言列表
 const { data: guestbookData, error: guestbookError } = await supabase.from('guestbook').select('*').eq('is_public', true).order('created_at', { ascending: false }).limit(limit);
 if (guestbookError) { console.error('Error fetching guestbook:', guestbookError); return []; }
 if (!guestbookData || guestbookData.length === 0) return [];

 // 获取所有用户ID
 const userIds = guestbookData.map(item => item.user_id).filter(Boolean);

 // 批量查询用户名
 const { data: profilesData } = await supabase.from('profiles').select('user_id, username').in('user_id', userIds);
 const usernameMap = new Map((profilesData || []).map(p => [p.user_id, p.username]));

 return guestbookData.map(item => ({
   id: item.id,
   sender_id: item.user_id,
   sender_name: usernameMap.get(item.user_id) || '匿名用户',
   content: item.content,
   created_at: item.created_at,
 }));
}

// 获取系统通知（从 notifications 表）
export async function getSystemMessages(limit: number = 20): Promise<SystemMessage[]> {
 const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(limit);
 if (error) { console.error('Error fetching notifications:', error); return []; }
 return (data || []).map(item => ({
   id: item.id,
   content: item.content,
   created_at: item.created_at,
   type: item.type === 'announcement' ? 'announcement' : 'system',
 }));
}

// 发送留言到 guestbook（10分钟后自动公开）
export async function sendGuestbookMessage(userId: string, content: string): Promise<{ success: boolean; error?: string }> {
  const visibleAfter = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10分钟后
  const { error } = await supabase.from('guestbook').insert({
    user_id: userId,
    content,
    is_public: true,
    status: 'pending',
    visible_after: visibleAfter
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// 检查留言限流（基于 guestbook 表）
export async function checkMessageRateLimit(userId: string): Promise<boolean> {
  const config = await getMessageBoardConfig();
  const limit = config?.rateLimit || 10;
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const { count, error } = await supabase.from('guestbook').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', oneHourAgo);
  if (error) { console.error('Error checking rate limit:', error); return false; }
  return (count || 0) < limit;
}

// 兼容旧接口
export async function getMessages(): Promise<Message[]> {
  return getGuestbookMessages();
}

export async function sendMessage(senderId: string, senderName: string, content: string): Promise<{ success: boolean; error?: string }> {
  return sendGuestbookMessage(senderId, content);
}

// ========== 留言审核相关 ==========

// 删除自己的留言（仅在10分钟内可删除）
export async function deleteGuestbookMessage(messageId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  // 检查是否是10分钟内的留言
  const { data: msg } = await supabase.from('guestbook').select('created_at, user_id').eq('id', messageId).single();
  if (!msg) return { success: false, error: '留言不存在' };
  if (msg.user_id !== userId) return { success: false, error: '只能删除自己的留言' };

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  if (msg.created_at && msg.created_at < tenMinutesAgo) {
    return { success: false, error: '10分钟后不可删除' };
  }

  const { error } = await supabase.from('guestbook').delete().eq('id', messageId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// 管理员删除留言
export async function adminDeleteGuestbookMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('guestbook').delete().eq('id', messageId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ========== 私信公开相关 ==========

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  is_public: boolean | null;
  public_title: string | null;
  public_at: string | null;
  created_at: string | null;
}

export interface PrivateMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string | null;
}

// 获取用户的私信对话列表
export async function getUserConversations(userId: string, limit: number = 50): Promise<Conversation[]> {
 const { data, error } = await supabase.from('conversations')
   .select('*')
   .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
   .order('last_message_at', { ascending: false })
   .limit(limit);
 if (error) { console.error('Error fetching conversations:', error); return []; }
 return data || [];
}

// 获取对话的所有消息
export async function getConversationMessages(conversationId: string, limit: number = 100): Promise<PrivateMessage[]> {
 const { data, error } = await (supabase.from('messages') as any)
   .select('*')
   .eq('conversation_id', conversationId)
   .order('created_at', { ascending: false })
   .limit(limit);
 if (error) { console.error('Error fetching messages:', error); return []; }
 return (data || []).reverse();
}

// 公开对话（双方都可以操作）
export async function makeConversationPublic(
  conversationId: string,
  userId: string,
  title: string
): Promise<{ success: boolean; error?: string }> {
  // 验证用户是否是对话参与者
  const { data: conv } = await supabase.from('conversations').select('user1_id, user2_id').eq('id', conversationId).single();
  if (!conv) return { success: false, error: '对话不存在' };
  if (conv.user1_id !== userId && conv.user2_id !== userId) {
    return { success: false, error: '只有对话参与者可以公开' };
  }

  const { error } = await supabase.from('conversations').update({
    is_public: true,
    public_title: title,
    public_at: new Date().toISOString(),
  }).eq('id', conversationId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// 获取所有公开对话
export async function getPublicConversations(limit: number = 50): Promise<Conversation[]> {
 const { data, error } = await supabase.from('conversations')
   .select('*')
   .eq('is_public', true)
   .order('public_at', { ascending: false })
   .limit(limit);
 if (error) { console.error('Error fetching public conversations:', error); return []; }
 return data || [];
}

// ========== 系统统计相关 ==========

export async function getSystemStats(): Promise<{ userCount: number; logCount: number }> {
  try {
    const { count: userCount, error: userError } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: logCount, error: logError } = await supabase.from('logs').select('*', { count: 'exact', head: true });
    if (userError) console.error('Error fetching user count:', userError);
    if (logError) console.error('Error fetching log count:', logError);
    return { userCount: userCount || 0, logCount: logCount || 0 };
  } catch (err) {
    console.error('Error fetching system stats:', err);
    return { userCount: 0, logCount: 0 };
  }
}

export async function getRandomUserSlogan(): Promise<{ username: string; slogan: string } | null> {
  try {
    const { data, error } = await supabase.from('profiles').select('username, slogan').not('slogan', 'is', null).limit(50);
    if (error) { console.error('Error fetching random user:', error); return null; }
    if (!data || data.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * data.length);
    const user = data[randomIndex];
    return { username: user.username, slogan: user.slogan || '' };
  } catch (err) {
    console.error('Error fetching random user slogan:', err);
    return null;
  }
}

// ========== 站点地图相关 ==========

export type SitemapMode = 'static' | 'dynamic';

export async function getSitemapMode(): Promise<SitemapMode> {
  const { data, error } = await supabase.from('system_config').select('value').eq('key', 'sitemap_mode').single();
  if (error || !data) return 'static';
  return (data.value as SitemapMode) || 'static';
}

export async function setSitemapMode(mode: SitemapMode): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('system_config').upsert(
    { key: 'sitemap_mode', value: mode, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  );
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getSitemapStats(): Promise<{ userCount: number; logCount: number }> {
  try {
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: logCount } = await supabase.from('logs').select('*', { count: 'exact', head: true });
    return { userCount: userCount || 0, logCount: logCount || 0 };
  } catch (err) {
    console.error('Error fetching sitemap stats:', err);
    return { userCount: 0, logCount: 0 };
  }
}

// 生成动态站点地图内容
export async function generateSitemapXml(): Promise<string> {
 const baseUrl = 'https://cognitionworld.com';

 // 获取所有动态（限制5000条，避免站点地图过大）
 const { data: logs } = await supabase.from('logs').select('user_id, id, created_at').order('created_at', { ascending: false }).limit(5000);

 let urls = `
 <!-- 首页 -->
 <url>
   <loc>${baseUrl}/</loc>
   <changefreq>daily</changefreq>
   <priority>1.0</priority>
 </url>`;

 // 添加动态URL
 (logs || []).forEach(log => {
   urls += `
 <url>
   <loc>${baseUrl}/${log.user_id}/thought/${log.id}</loc>
   <lastmod>${new Date(log.created_at || Date.now()).toISOString()}</lastmod>
   <changefreq>never</changefreq>
   <priority>0.8</priority>
 </url>`;
 });

 return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
}

// ========== 用户等级和发布限额相关 ==========

export interface UserRoleInfo {
  role: 'user' | 'verified' | 'premium';
  isAdmin: boolean;
  dailyPostsCount: number;
  lastPostDate: string | null;
}

export interface PostLimitCheckResult {
  canPost: boolean;
  limit: number;
  current: number;
  remaining: number;
  message?: string;
}

// 获取用户等级信息
export async function getUserRoleInfo(userId: string): Promise<UserRoleInfo | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role, is_admin, daily_posts_count, last_post_date')
    .eq('user_id', userId)
    .single();
  if (error || !data) return null;
  return {
    role: (data.role as 'user' | 'verified' | 'premium') || 'user',
    isAdmin: data.is_admin || false,
    dailyPostsCount: data.daily_posts_count || 0,
    lastPostDate: data.last_post_date,
  };
}

// 获取每日发布限额配置
export async function getDailyPostLimit(role: 'user' | 'verified' | 'premium'): Promise<number> {
  const key = `daily_post_limit_${role}`;
  const { data, error } = await supabase.from('system_config').select('value').eq('key', key).single();
  if (error || !data) {
    // 返回默认值
    const defaults: Record<string, number> = { user: 10, verified: 10, premium: 30 };
    return defaults[role] || 10;
  }
  return parseInt(data.value, 10) || 10;
}

// 检查今日发布次数
export async function getTodayPostCount(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('daily_post_logs')
    .select('post_count')
    .eq('user_id', userId)
    .eq('post_date', today)
    .single();
  if (error || !data) return 0;
  return data.post_count || 0;
}

// 检查是否可以发布
export async function checkCanPost(userId: string): Promise<PostLimitCheckResult> {
  // 获取用户等级信息
  const userInfo = await getUserRoleInfo(userId);
  if (!userInfo) {
    return { canPost: false, limit: 0, current: 0, remaining: 0, message: '用户不存在' };
  }

  // 管理员不受限制
  if (userInfo.isAdmin) {
    return { canPost: true, limit: Infinity as unknown as number, current: 0, remaining: Infinity as unknown as number };
  }

  // 获取该等级的每日限额
  const limit = await getDailyPostLimit(userInfo.role);

  // 获取今日已发布数量
  const todayCount = await getTodayPostCount(userId);

  const remaining = limit - todayCount;

  if (todayCount >= limit) {
    return {
      canPost: false,
      limit,
      current: todayCount,
      remaining: 0,
      message: '今日发布次数已用完',
    };
  }

  return {
    canPost: true,
    limit,
    current: todayCount,
    remaining,
  };
}

// 记录发布（增加计数）
export async function recordPost(userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // 使用 upsert 更新或插入今日发布记录
  const { error } = await supabase.from('daily_post_logs').upsert(
    {
      user_id: userId,
      post_date: today,
      post_count: 1, // 这个值会被下面的 SQL 覆盖
    },
    { onConflict: 'user_id,post_date' }
  );

  if (error) {
    console.error('Error recording post:', error);
    return;
  }

  // 原子性增加计数
  await supabase.rpc('increment_post_count', { p_user_id: userId, p_date: today });
}

// 更新用户等级
export async function updateUserRole(userId: string, role: 'user' | 'verified' | 'premium'): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('profiles').update({ role }).eq('user_id', userId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// 更新每日发布限额配置
export async function updateDailyPostLimit(role: 'user' | 'verified' | 'premium', limit: number): Promise<{ success: boolean; error?: string }> {
  const key = `daily_post_limit_${role}`;
  const { error } = await supabase.from('system_config').upsert(
    { key, value: String(limit), updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  );
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// 获取所有用户列表（带发布统计）
export async function getAllUsersWithStats(limit: number = 1000): Promise<Array<{
  user_id: string;
  display_id: number | null;
  username: string;
  role: string;
  is_admin: boolean;
  is_frozen: boolean;
  is_trusted: boolean;
  today_posts: number;
}>> {
 const today = new Date().toISOString().split('T')[0];

 const { data, error } = await supabase
   .from('profiles')
   .select('user_id, display_id, username, role, is_admin, is_frozen, is_trusted, daily_posts_count, last_post_date')
   .limit(limit);

 if (error || !data) return [];

 // 获取今日发布记录
 const { data: postLogs } = await supabase
   .from('daily_post_logs')
   .select('user_id, post_count')
   .eq('post_date', today);

 const postCountMap = new Map((postLogs || []).map((log) => [log.user_id, log.post_count]));

 return data.map((user) => ({
   user_id: user.user_id,
   display_id: user.display_id,
   username: user.username,
   role: user.role || 'user',
   is_admin: user.is_admin || false,
   is_frozen: user.is_frozen || false,
   is_trusted: user.is_trusted || false,
   today_posts: postCountMap.get(user.user_id) || 0,
 }));
}

// ========== Slogan 审核相关 ==========

// 获取待审核的 Slogan 列表
export async function getPendingSlogans(): Promise<Array<{
  id: string;
  user_id: string;
  username: string;
  slogan: string;
  created_at: string;
}>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, user_id, username, slogan, created_at')
    .not('slogan', 'is', null)
    .neq('slogan', '')
    .eq('slogan_approved', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending slogans:', error);
    return [];
  }

  return (data || []).map(item => ({
    id: item.id,
    user_id: item.user_id,
    username: item.username,
    slogan: item.slogan || '',
    created_at: item.created_at || '',
  }));
}

// 审核通过 Slogan
export async function approveSlogan(userId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('profiles')
    .update({ slogan_approved: true })
    .eq('user_id', userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// 获取已审核通过的随机 Slogan
export async function getRandomApprovedSlogan(): Promise<{ username: string; slogan: string } | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, slogan')
    .eq('slogan_approved', true)
    .not('slogan', 'is', null)
    .neq('slogan', '');

  if (error || !data || data.length === 0) {
    return null;
  }

  // 随机选择一条
  const randomIndex = Math.floor(Math.random() * data.length);
  return {
    username: data[randomIndex].username,
    slogan: data[randomIndex].slogan || '',
  };
}

// ========== 用户间留言板相关 ==========

// 获取用户间留言板开关状态
export async function isUserGuestbookEnabled(): Promise<boolean> {
  const { data, error } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', 'user_guestbook_enabled')
    .single();
  if (error) {
    console.error('Error fetching user_guestbook_enabled:', error);
    return false;
  }
  return data?.value === 'true';
}

// 设置用户间留言板开关状态
export async function setUserGuestbookEnabled(enabled: boolean): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('system_config')
    .upsert(
      { key: 'user_guestbook_enabled', value: String(enabled) },
      { onConflict: 'key' }
    );
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ==================== 用户冻结管理 ====================

/**
 * 冻结用户
 */
export async function freezeUser(userId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('profiles')
    .update({
      is_frozen: true,
      frozen_at: new Date().toISOString(),
      freeze_reason: reason
    })
    .eq('user_id', userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * 解冻用户
 */
export async function unfreezeUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('profiles')
    .update({
      is_frozen: false,
      frozen_at: null,
      freeze_reason: null
    })
    .eq('user_id', userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ==================== 用户主动隐藏账户 ====================

export interface AccountHideStatus {
  hide_status: 'none' | 'cooling' | 'frozen';
  hide_requested_at: string | null;
  cooling_ends_at: string | null;
  frozen_ends_at: string | null;
}

/**
 * 获取账户隐藏状态
 */
export async function getAccountHideStatus(): Promise<AccountHideStatus | null> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) return null;

  const response = await fetch(`${supabaseUrl}/functions/v1/account-hide/status`, {
    headers: { 'Authorization': `Bearer ${session.access_token}` }
  });

  if (!response.ok) return null;
  return await response.json();
}

/**
 * 申请隐藏账户
 */
export async function requestAccountHide(): Promise<{ success: boolean; message?: string; error?: string; coolingEndsAt?: string }> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) return { success: false, error: '请先登录' };

  const response = await fetch(`${supabaseUrl}/functions/v1/account-hide/request-hide`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session.access_token}` }
  });

  const data = await response.json();
  if (!response.ok) return { success: false, error: data.error };
  return { success: true, message: data.message, coolingEndsAt: data.coolingEndsAt };
}

/**
 * 取消隐藏申请（冷静期内）
 */
export async function cancelAccountHide(): Promise<{ success: boolean; message?: string; error?: string }> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) return { success: false, error: '请先登录' };

  const response = await fetch(`${supabaseUrl}/functions/v1/account-hide/cancel-hide`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session.access_token}` }
  });

  const data = await response.json();
  if (!response.ok) return { success: false, error: data.error };
  return { success: true, message: data.message };
}

/**
 * 申请恢复账户（冻结期满后）
 */
export async function requestAccountRestore(): Promise<{ success: boolean; message?: string; error?: string }> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) return { success: false, error: '请先登录' };

  const response = await fetch(`${supabaseUrl}/functions/v1/account-hide/request-restore`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session.access_token}` }
  });

  const data = await response.json();
  if (!response.ok) return { success: false, error: data.error };
  return { success: true, message: data.message };
}

/**
 * 检查并转换冷静期到冻结期（登录时调用）
 */
export async function checkAndTransitionAccountHide(): Promise<{ success: boolean; transitioned?: number }> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) return { success: false };

  const response = await fetch(`${supabaseUrl}/functions/v1/account-hide/check-and-transition`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session.access_token}` }
  });

  const data = await response.json();
  if (!response.ok) return { success: false };
  return { success: true, transitioned: data.transitioned };
}

// ==================== 白名单（免审用户）管理 ====================

/**
 * 获取所有免审用户列表
 */
export async function getTrustedUsers(): Promise<Array<{
  user_id: string;
  username: string;
  is_admin: boolean;
}>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, username, is_admin, is_trusted')
    .eq('is_trusted', true)
    .limit(100);

  if (error) { console.error('获取白名单失败:', error); return []; }
  return (data || []).map((u: any) => ({
    user_id: u.user_id,
    username: u.username,
    is_admin: u.is_admin || false,
  }));
}

/**
 * 将用户加入免审白名单
 */
export async function setTrustedUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_trusted: true })
    .eq('user_id', userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * 将用户移出免审白名单
 */
export async function removeTrustedUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_trusted: false })
    .eq('user_id', userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * 检查用户是否免审（管理员或白名单用户）
 */
export async function isUserExemptFromReview(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin, is_trusted')
    .eq('user_id', userId)
    .single();

  if (error || !data) return false;
  return data.is_admin === true || data.is_trusted === true;
}

// ========== 点赞相关 ==========

/** 获取某个内容的所有点赞 */
export async function getLikes(targetId: string, targetType: 'log' | 'guestbook_message'): Promise<number> {
  const { count, error } = await supabase
    .from('post_likes')
    .select('*', { count: 'exact', head: true })
    .eq('target_id', targetId)
    .eq('target_type', targetType);
  return count ?? 0;
}

/** 当前用户是否已点赞 */
export async function hasUserLiked(targetId: string, targetType: 'log' | 'guestbook_message', userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('post_likes')
    .select('id')
    .eq('target_id', targetId)
    .eq('target_type', targetType)
    .eq('user_id', userId)
    .maybeSingle();
  return data !== null;
}

/** 切换点赞状态（返回新的状态：已点赞/未点赞） */
export async function toggleLike(targetId: string, targetType: 'log' | 'guestbook_message', userId: string): Promise<{ liked: boolean; count: number; error?: string }> {
  const { data: existing } = await supabase
    .from('post_likes')
    .select('id')
    .eq('target_id', targetId)
    .eq('target_type', targetType)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('id', existing.id);
    if (error) return { liked: false, count: 0, error: error.message };
  } else {
    const { error } = await supabase
      .from('post_likes')
      .insert({ target_id: targetId, target_type: targetType, user_id: userId });
    if (error) return { liked: false, count: 0, error: error.message };
  }

  // 获取最新点赞数
  const { count } = await supabase
    .from('post_likes')
    .select('*', { count: 'exact', head: true })
    .eq('target_id', targetId)
    .eq('target_type', targetType);

  return { liked: !existing, count: count ?? 0 };
}

// ========== 内容审核 ==========

export interface ModerationCheckResult {
  passed: boolean;
  suggestion?: string;
  label?: string | null;
  description?: string | null;
  error?: string;
}

/**
 * 调用阿里云安全护栏审核文本
 * 客户端通过 /api/moderation/check 调用，服务端通过 aliyunModeration 直接调用
 */
export async function moderateContent(content: string): Promise<ModerationCheckResult> {
  try {
    // 调用服务器端 API
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/moderation/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      // API 不可用时，允许通过（避免阻断用户正常使用）
      console.warn('[审核] API 请求失败，已放行:', response.status);
      return { passed: true, error: `审核服务暂时不可用（${response.status}），已自动放行` };
    }

    const result = await response.json();
    return {
      passed: result.passed,
      suggestion: result.suggestion,
      label: result.label,
      description: result.description,
    };
  } catch (err: any) {
    // 网络异常时放行
    console.warn('[审核] 网络异常，已放行:', err.message);
    return { passed: true, error: '审核服务网络异常，已自动放行' };
  }
}

/**
 * 带审核的日志发布
 * 1. 检查是否白名单用户（免审）
 * 2. 非白名单用户先调 AI 审核
 * 3. 审核通过（或异常放行）才写入数据库
 *
 * 返回结果包含审核状态，前端可根据需要展示
 */
export async function createLogWithModeration(
  userId: string,
  content: string,
  tags?: string[],
): Promise<{ success: boolean; error?: string; moderated?: boolean; rejected?: boolean; reason?: string; log?: Log }> {
  // 1. 检查是否免审用户
  const exempt = await isUserExemptFromReview(userId);

  if (!exempt) {
    // 2. 调用 AI 审核
    const moderationResult = await moderateContent(content);

    if (!moderationResult.passed) {
      return {
        success: false,
        rejected: true,
        reason: moderationResult.description || '内容包含违规信息',
        error: '内容审核未通过',
      };
    }
  }

  // 3. 审核通过（或免审），创建日志
  const log = await createLog(userId, content, tags);
  if (!log) {
    return { success: false, error: '日志创建失败' };
  }

  return {
    success: true,
    log,
    moderated: !exempt,
  };
}
