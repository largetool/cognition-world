-- ============================================
-- RLS 修复：Google OAuth 用户兼容性
-- 问题：原策略用 profiles.id = auth.uid()，但 Google OAuth 用户的 profiles.id ≠ auth.uid()
-- 修复：改为 profiles.user_id = auth.uid()::text
-- ============================================

-- 第1步：删除所有使用 id = auth.uid() 的旧策略
-- ============================================

-- profiles 管理员策略
DROP POLICY IF EXISTS "管理员可查看所有资料" ON public.profiles;

-- logs 表
DROP POLICY IF EXISTS "用户可查看自己的日志" ON public.logs;
DROP POLICY IF EXISTS "用户可创建自己的日志" ON public.logs;

-- system_config
DROP POLICY IF EXISTS "仅管理员可写系统配置" ON public.system_config;

-- system_backgrounds
DROP POLICY IF EXISTS "仅管理员可管理" ON public.system_backgrounds;
DROP POLICY IF EXISTS "只有管理员可管理系统背景图" ON public.system_backgrounds;

-- background_images
DROP POLICY IF EXISTS "用户可管理自己的" ON public.background_images;

-- edit_tokens
DROP POLICY IF EXISTS "用户可管理自己的令牌" ON public.edit_tokens;

-- notifications
DROP POLICY IF EXISTS "仅管理员可写通知" ON public.notifications;

-- system_messages
DROP POLICY IF EXISTS "仅管理员可写" ON public.system_messages;

-- ip_blacklist
DROP POLICY IF EXISTS "仅管理员可管理" ON public.ip_blacklist;

-- user_messages (admin delete policy)
DROP POLICY IF EXISTS "管理员可删" ON public.user_messages;

-- daily_post_logs
DROP POLICY IF EXISTS "用户可读自己的记录" ON public.daily_post_logs;
DROP POLICY IF EXISTS "用户可更新自己的记录" ON public.daily_post_logs;

-- ============================================
-- 第2步：重新创建所有策略（使用 user_id = auth.uid()::text）
-- ============================================

-- profiles: 管理员
CREATE POLICY "管理员可查看所有资料" ON public.profiles
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid()::text AND is_admin = true)
);

-- logs: 用户查看自己的
CREATE POLICY "用户可查看自己的日志" ON public.logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()::text AND p.user_id = logs.user_id
  )
);

-- logs: 用户创建自己的
CREATE POLICY "用户可创建自己的日志" ON public.logs
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()::text AND p.user_id = logs.user_id
  )
);

-- system_config: 管理员可写
CREATE POLICY "仅管理员可写系统配置" ON public.system_config FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid()::text AND is_admin = true)
);

-- system_backgrounds: 管理员可管理
CREATE POLICY "仅管理员可管理" ON public.system_backgrounds FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid()::text AND is_admin = true)
);

-- background_images: 用户管理自己的
CREATE POLICY "用户可管理自己的" ON public.background_images FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()::text AND p.user_id = background_images.user_id
  )
);

-- edit_tokens: 用户管理自己的
CREATE POLICY "用户可管理自己的令牌" ON public.edit_tokens FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()::text AND p.user_id = edit_tokens.user_id
  )
);

-- notifications: 管理员可写
CREATE POLICY "仅管理员可写通知" ON public.notifications FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid()::text AND is_admin = true)
);

-- system_messages: 管理员可写
CREATE POLICY "仅管理员可写" ON public.system_messages FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid()::text AND is_admin = true)
);

-- ip_blacklist: 管理员可管理
CREATE POLICY "仅管理员可管理" ON public.ip_blacklist FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid()::text AND is_admin = true)
);

-- user_messages: 管理员可删除
CREATE POLICY "管理员可删" ON public.user_messages FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid()::text AND is_admin = true)
);

-- daily_post_logs: 用户读自己的
CREATE POLICY "用户可读自己的记录" ON public.daily_post_logs FOR SELECT
USING (
  user_id = (SELECT p.user_id FROM public.profiles p WHERE p.user_id = auth.uid()::text LIMIT 1)
);

-- daily_post_logs: 用户更新自己的
CREATE POLICY "用户可更新自己的记录" ON public.daily_post_logs FOR UPDATE
USING (
  user_id = (SELECT p.user_id FROM public.profiles p WHERE p.user_id = auth.uid()::text LIMIT 1)
);

-- ============================================
-- 第3步：修复 system_backgrounds 管理员策略（原版用 auth.uid() IN (SELECT id FROM...)）
-- ============================================
DROP POLICY IF EXISTS "所有人可查看系统背景图" ON public.system_backgrounds;
CREATE POLICY "所有人可查看系统背景图" ON public.system_backgrounds
FOR SELECT USING (true);
