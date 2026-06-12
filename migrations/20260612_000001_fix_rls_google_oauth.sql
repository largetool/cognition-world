-- ============================================
-- RLS 修复：Google OAuth 用户兼容性
-- 问题：原策略用 profiles.id = auth.uid()，但 Google OAuth 用户的 profiles.id ≠ auth.uid()
-- 修复：改为 profiles.user_id = auth.uid()::text
-- 每个操作都加了表存在性检查，避免 "relation does not exist" 错误
-- ============================================

-- 第1步：删除所有使用 id = auth.uid() 的旧策略（带表存在性检查）
-- ============================================

DO $$
BEGIN
  -- profiles（始终存在）
  DROP POLICY IF EXISTS "管理员可查看所有资料" ON public.profiles;

  -- logs（始终存在）
  DROP POLICY IF EXISTS "用户可查看自己的日志" ON public.logs;
  DROP POLICY IF EXISTS "用户可创建自己的日志" ON public.logs;

  -- system_config
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_config') THEN
    DROP POLICY IF EXISTS "仅管理员可写系统配置" ON public.system_config;
  END IF;

  -- system_backgrounds
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_backgrounds') THEN
    DROP POLICY IF EXISTS "仅管理员可管理" ON public.system_backgrounds;
    DROP POLICY IF EXISTS "只有管理员可管理系统背景图" ON public.system_backgrounds;
    DROP POLICY IF EXISTS "所有人可查看系统背景图" ON public.system_backgrounds;
  END IF;

  -- background_images
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'background_images') THEN
    DROP POLICY IF EXISTS "用户可管理自己的" ON public.background_images;
  END IF;

  -- edit_tokens
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'edit_tokens') THEN
    DROP POLICY IF EXISTS "用户可管理自己的令牌" ON public.edit_tokens;
  END IF;

  -- notifications
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    DROP POLICY IF EXISTS "仅管理员可写通知" ON public.notifications;
  END IF;

  -- system_messages
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_messages') THEN
    DROP POLICY IF EXISTS "仅管理员可写" ON public.system_messages;
  END IF;

  -- ip_blacklist
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ip_blacklist') THEN
    DROP POLICY IF EXISTS "仅管理员可管理" ON public.ip_blacklist;
  END IF;

  -- user_messages
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_messages') THEN
    DROP POLICY IF EXISTS "管理员可删" ON public.user_messages;
  END IF;

  -- daily_post_logs
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_post_logs') THEN
    DROP POLICY IF EXISTS "用户可读自己的记录" ON public.daily_post_logs;
    DROP POLICY IF EXISTS "用户可更新自己的记录" ON public.daily_post_logs;
  END IF;
END$$;

-- ============================================
-- 第2步：重新创建所有策略（使用 user_id = auth.uid()::text）
-- ============================================

-- profiles: 管理员（始终存在）
CREATE POLICY "管理员可查看所有资料" ON public.profiles
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid()::text AND is_admin = true)
);

-- logs: 用户查看自己的（始终存在）
CREATE POLICY "用户可查看自己的日志" ON public.logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()::text AND p.user_id = logs.user_id
  )
);

-- logs: 用户创建自己的（始终存在）
CREATE POLICY "用户可创建自己的日志" ON public.logs
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()::text AND p.user_id = logs.user_id
  )
);

-- 以下操作只在表存在时执行
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_config') THEN
    DROP POLICY IF EXISTS "仅管理员可写系统配置" ON public.system_config;
    CREATE POLICY "仅管理员可写系统配置" ON public.system_config FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid()::text AND is_admin = true));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_backgrounds') THEN
    DROP POLICY IF EXISTS "仅管理员可管理" ON public.system_backgrounds;
    CREATE POLICY "仅管理员可管理" ON public.system_backgrounds FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid()::text AND is_admin = true));
    DROP POLICY IF EXISTS "所有人可查看系统背景图" ON public.system_backgrounds;
    CREATE POLICY "所有人可查看系统背景图" ON public.system_backgrounds
    FOR SELECT USING (true);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'background_images') THEN
    DROP POLICY IF EXISTS "用户可管理自己的" ON public.background_images;
    CREATE POLICY "用户可管理自己的" ON public.background_images FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()::text AND p.user_id = background_images.user_id
    ));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'edit_tokens') THEN
    DROP POLICY IF EXISTS "用户可管理自己的令牌" ON public.edit_tokens;
    CREATE POLICY "用户可管理自己的令牌" ON public.edit_tokens FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()::text AND p.user_id = edit_tokens.user_id
    ));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    DROP POLICY IF EXISTS "仅管理员可写通知" ON public.notifications;
    CREATE POLICY "仅管理员可写通知" ON public.notifications FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid()::text AND is_admin = true));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_messages') THEN
    DROP POLICY IF EXISTS "仅管理员可写" ON public.system_messages;
    CREATE POLICY "仅管理员可写" ON public.system_messages FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid()::text AND is_admin = true));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ip_blacklist') THEN
    DROP POLICY IF EXISTS "仅管理员可管理" ON public.ip_blacklist;
    CREATE POLICY "仅管理员可管理" ON public.ip_blacklist FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid()::text AND is_admin = true));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_messages') THEN
    DROP POLICY IF EXISTS "管理员可删" ON public.user_messages;
    CREATE POLICY "管理员可删" ON public.user_messages FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid()::text AND is_admin = true));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_post_logs') THEN
    DROP POLICY IF EXISTS "用户可读自己的记录" ON public.daily_post_logs;
    CREATE POLICY "用户可读自己的记录" ON public.daily_post_logs FOR SELECT
    USING (user_id = (SELECT p.user_id FROM public.profiles p WHERE p.user_id = auth.uid()::text LIMIT 1));
    DROP POLICY IF EXISTS "用户可更新自己的记录" ON public.daily_post_logs;
    CREATE POLICY "用户可更新自己的记录" ON public.daily_post_logs FOR UPDATE
    USING (user_id = (SELECT p.user_id FROM public.profiles p WHERE p.user_id = auth.uid()::text LIMIT 1));
  END IF;
END$$;
