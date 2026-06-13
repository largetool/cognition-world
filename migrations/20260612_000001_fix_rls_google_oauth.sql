-- ============================================
-- RLS 修复：Google OAuth 用户兼容性
-- 问题：原策略用 profiles.id = auth.uid()，但 Google OAuth 用户的 profiles.id ≠ auth.uid()
-- 修复：改为 profiles.user_id = auth.uid()::text
-- 问题=42P01，所以用异常捕获跳过
-- ============================================

DO $$
BEGIN
  -- 第1步：删除旧策略（异常捕获跳过不存在的表）
  -- ============================================

  -- profiles
  DROP POLICY IF EXISTS "管理员可查看所有资料" ON public.profiles;

  -- logs
  DROP POLICY IF EXISTS "用户可查看自己的日志" ON public.logs;
  DROP POLICY IF EXISTS "用户可创建自己的日志" ON public.logs;

  -- system_config（可能不存在）
  BEGIN
    DROP POLICY IF EXISTS "仅管理员可写系统配置" ON public.system_config;
  EXCEPTION WHEN undefined_table THEN END;

  -- system_backgrounds（可能不存在）
  BEGIN
    DROP POLICY IF EXISTS "仅管理员可管理" ON public.system_backgrounds;
    DROP POLICY IF EXISTS "只有管理员可管理系统背景图" ON public.system_backgrounds;
    DROP POLICY IF EXISTS "所有人可查看系统背景图" ON public.system_backgrounds;
  EXCEPTION WHEN undefined_table THEN END;

  -- background_images（可能不存在）
  BEGIN
    DROP POLICY IF EXISTS "用户可管理自己的" ON public.background_images;
  EXCEPTION WHEN undefined_table THEN END;

  -- edit_tokens（可能不存在）
  BEGIN
    DROP POLICY IF EXISTS "用户可管理自己的令牌" ON public.edit_tokens;
  EXCEPTION WHEN undefined_table THEN END;

  -- notifications（可能不存在）
  BEGIN
    DROP POLICY IF EXISTS "仅管理员可写通知" ON public.notifications;
  EXCEPTION WHEN undefined_table THEN END;

  -- system_messages（可能不存在）
  BEGIN
    DROP POLICY IF EXISTS "仅管理员可写" ON public.system_messages;
  EXCEPTION WHEN undefined_table THEN END;

  -- ip_blacklist（可能不存在）
  BEGIN
    DROP POLICY IF EXISTS "仅管理员可管理" ON public.ip_blacklist;
  EXCEPTION WHEN undefined_table THEN END;

  -- user_messages（可能不存在）
  BEGIN
    DROP POLICY IF EXISTS "管理员可删" ON public.user_messages;
  EXCEPTION WHEN undefined_table THEN END;

  -- daily_post_logs（可能不存在）
  BEGIN
    DROP POLICY IF EXISTS "用户可读自己的记录" ON public.daily_post_logs;
    DROP POLICY IF EXISTS "用户可更新自己的记录" ON public.daily_post_logs;
  EXCEPTION WHEN undefined_table THEN END;

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

  -- system_config
  BEGIN
    DROP POLICY IF EXISTS "仅管理员可写系统配置" ON public.system_config;
    CREATE POLICY "仅管理员可写系统配置" ON public.system_config FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid()::text AND is_admin = true));
  EXCEPTION WHEN undefined_table THEN END;

  -- system_backgrounds
  BEGIN
    DROP POLICY IF EXISTS "仅管理员可管理" ON public.system_backgrounds;
    CREATE POLICY "仅管理员可管理" ON public.system_backgrounds FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid()::text AND is_admin = true));
    DROP POLICY IF EXISTS "所有人可查看系统背景图" ON public.system_backgrounds;
    CREATE POLICY "所有人可查看系统背景图" ON public.system_backgrounds
    FOR SELECT USING (true);
  EXCEPTION WHEN undefined_table THEN END;

  -- background_images
  BEGIN
    DROP POLICY IF EXISTS "用户可管理自己的" ON public.background_images;
    CREATE POLICY "用户可管理自己的" ON public.background_images FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()::text AND p.user_id = background_images.user_id
    ));
  EXCEPTION WHEN undefined_table THEN END;

  -- edit_tokens
  BEGIN
    DROP POLICY IF EXISTS "用户可管理自己的令牌" ON public.edit_tokens;
    CREATE POLICY "用户可管理自己的令牌" ON public.edit_tokens FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()::text AND p.user_id = edit_tokens.user_id
    ));
  EXCEPTION WHEN undefined_table THEN END;

  -- notifications
  BEGIN
    DROP POLICY IF EXISTS "仅管理员可写通知" ON public.notifications;
    CREATE POLICY "仅管理员可写通知" ON public.notifications FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid()::text AND is_admin = true));
  EXCEPTION WHEN undefined_table THEN END;

  -- system_messages（跳过，表不存在）

  -- ip_blacklist
  BEGIN
    DROP POLICY IF EXISTS "仅管理员可管理" ON public.ip_blacklist;
    CREATE POLICY "仅管理员可管理" ON public.ip_blacklist FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid()::text AND is_admin = true));
  EXCEPTION WHEN undefined_table THEN END;

  -- user_messages
  BEGIN
    DROP POLICY IF EXISTS "管理员可删" ON public.user_messages;
    CREATE POLICY "管理员可删" ON public.user_messages FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid()::text AND is_admin = true));
  EXCEPTION WHEN undefined_table THEN END;

  -- daily_post_logs
  BEGIN
    DROP POLICY IF EXISTS "用户可读自己的记录" ON public.daily_post_logs;
    CREATE POLICY "用户可读自己的记录" ON public.daily_post_logs FOR SELECT
    USING (user_id = (SELECT p.user_id FROM public.profiles p WHERE p.user_id = auth.uid()::text LIMIT 1));
    DROP POLICY IF EXISTS "用户可更新自己的记录" ON public.daily_post_logs;
    CREATE POLICY "用户可更新自己的记录" ON public.daily_post_logs FOR UPDATE
    USING (user_id = (SELECT p.user_id FROM public.profiles p WHERE p.user_id = auth.uid()::text LIMIT 1));
  EXCEPTION WHEN undefined_table THEN END;

END$$;
