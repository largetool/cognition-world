-- ============================================
-- RLS 根本修复 v2 — 修正所有策略使用正确的列
-- ============================================
-- 问题诊断：
-- 20260612 迁移将 RLS 策略从 id = auth.uid() 改为 user_id = auth.uid()::text
-- 但 profiles.user_id 是显示 ID（如 "MAN000000002"），不是 auth.uid() 的 UUID
-- 导致所有 RLS 策略失效 → 日志发布、点赞、管理等全部静默失败
--
-- 修复方案：使用 profiles.id = auth.uid()（通过 FK 约束保证）
-- 并添加冗余 auth_user_id 列方便未来诊断
-- ============================================

-- ============================================
-- 第1步：添加 auth_user_id 列并回填
-- ============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auth_user_id UUID;
UPDATE public.profiles SET auth_user_id = id WHERE auth_user_id IS NULL;

-- ============================================
-- 第2步：修复 is_admin_user 函数
-- 同时支持 auth_user_id 和 id（向后兼容）
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin_user(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE (auth_user_id = user_uuid OR id = user_uuid) AND is_admin = true
  );
$$;

-- ============================================
-- 第3步：修复 sync_my_auth_id RPC
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_my_auth_id()
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.profiles
  SET auth_user_id = auth.uid()
  WHERE (auth_user_id IS NULL OR auth_user_id != auth.uid())
    AND auth.uid() IS NOT NULL;
  RETURN FOUND;
END;
$$;

-- ============================================
-- 第4步：删除所有错误的 RLS 策略
-- （那些使用 user_id = auth.uid()::text 的）
-- ============================================
DO $$
BEGIN
  -- profiles
  DROP POLICY IF EXISTS "管理员可查看所有资料" ON public.profiles;

  -- logs
  DROP POLICY IF EXISTS "用户可查看自己的日志" ON public.logs;
  DROP POLICY IF EXISTS "用户可创建自己的日志" ON public.logs;

  -- system_config
  BEGIN
    DROP POLICY IF EXISTS "仅管理员可写系统配置" ON public.system_config;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- system_backgrounds
  BEGIN
    DROP POLICY IF EXISTS "仅管理员可管理" ON public.system_backgrounds;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- background_images
  BEGIN
    DROP POLICY IF EXISTS "用户可管理自己的" ON public.background_images;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- edit_tokens
  BEGIN
    DROP POLICY IF EXISTS "用户可管理自己的令牌" ON public.edit_tokens;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- notifications
  BEGIN
    DROP POLICY IF EXISTS "仅管理员可写通知" ON public.notifications;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- ip_blacklist
  BEGIN
    DROP POLICY IF EXISTS "仅管理员可管理" ON public.ip_blacklist;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- user_messages
  BEGIN
    DROP POLICY IF EXISTS "管理员可删" ON public.user_messages;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- daily_post_logs
  BEGIN
    DROP POLICY IF EXISTS "用户可读自己的记录" ON public.daily_post_logs;
    DROP POLICY IF EXISTS "用户可更新自己的记录" ON public.daily_post_logs;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- post_likes
  BEGIN
    DROP POLICY IF EXISTS "登录用户可点赞" ON public.post_likes;
    DROP POLICY IF EXISTS "用户可取消自己点赞" ON public.post_likes;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- reports
  BEGIN
    DROP POLICY IF EXISTS "admin_select_reports" ON public.reports;
    DROP POLICY IF EXISTS "admin_update_reports" ON public.reports;
  EXCEPTION WHEN undefined_table THEN NULL; END;
END$$;

-- ============================================
-- 第5步：重新创建所有策略（使用正确的 id = auth.uid()）
-- ============================================

-- --- profiles ---
CREATE POLICY "管理员可查看所有资料" ON public.profiles
FOR ALL USING (public.is_admin_user(auth.uid()));

-- --- logs ---
CREATE POLICY "用户可查看自己的日志" ON public.logs
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_id = logs.user_id)
);

CREATE POLICY "用户可创建自己的日志" ON public.logs
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_id = logs.user_id)
);

-- --- system_config ---
CREATE POLICY "仅管理员可写系统配置" ON public.system_config FOR ALL
USING (public.is_admin_user(auth.uid()));

-- --- system_backgrounds ---
CREATE POLICY "仅管理员可管理" ON public.system_backgrounds FOR ALL
USING (public.is_admin_user(auth.uid()));

-- --- background_images ---
CREATE POLICY "用户可管理自己的" ON public.background_images FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_id = background_images.user_id));

-- --- edit_tokens ---
CREATE POLICY "用户可管理自己的令牌" ON public.edit_tokens FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_id = edit_tokens.user_id));

-- --- notifications ---
CREATE POLICY "仅管理员可写通知" ON public.notifications FOR ALL
USING (public.is_admin_user(auth.uid()));

-- --- ip_blacklist ---
CREATE POLICY "仅管理员可管理" ON public.ip_blacklist FOR ALL
USING (public.is_admin_user(auth.uid()));

-- --- user_messages ---
CREATE POLICY "管理员可删" ON public.user_messages FOR DELETE
USING (public.is_admin_user(auth.uid()));

-- --- daily_post_logs ---
CREATE POLICY "用户可读自己的记录" ON public.daily_post_logs FOR SELECT
USING (user_id = (SELECT user_id FROM public.profiles WHERE id = auth.uid() LIMIT 1));

CREATE POLICY "用户可更新自己的记录" ON public.daily_post_logs FOR UPDATE
USING (user_id = (SELECT user_id FROM public.profiles WHERE id = auth.uid() LIMIT 1));

-- --- post_likes ---
CREATE POLICY "登录用户可点赞" ON public.post_likes
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_id = post_likes.user_id)
);

CREATE POLICY "用户可取消自己点赞" ON public.post_likes
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_id = post_likes.user_id)
);

-- --- reports 管理策略 ---
DO $$
BEGIN
  DROP POLICY IF EXISTS "admin_select_reports" ON public.reports;
  CREATE POLICY "admin_select_reports" ON public.reports FOR SELECT
  USING (public.is_admin_user(auth.uid()));
EXCEPTION WHEN undefined_table THEN NULL;
END$$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "admin_update_reports" ON public.reports;
  CREATE POLICY "admin_update_reports" ON public.reports FOR UPDATE
  USING (public.is_admin_user(auth.uid()));
EXCEPTION WHEN undefined_table THEN NULL;
END$$;

-- ============================================
-- 第6步：确保所有表已启用 RLS
-- ============================================
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN (
        SELECT relname FROM pg_class WHERE relrowsecurity = true
      )
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);
  END LOOP;
END$$;
