-- ============================================
-- 全面修复所有被破坏的 RLS 策略
-- 问题根因：20260612 迁移错误地使用了
--   user_id = auth.uid()::text
-- 但 user_id 是显示 ID（如 MAN000000002），不是 UUID
-- 修复：用 profiles.auth_user_id = auth.uid() 做 JOIN
--
-- 注意：管理员策略必须用 is_admin_user(auth.uid())
-- 否则子查询查 profiles 表 → 触发自身 RLS → 无限递归
-- ============================================

DO $$
BEGIN
  -- ============================================
  -- 第1部分：修复 logs 表 RLS（核心发布功能）
  -- ============================================
  DROP POLICY IF EXISTS "用户可查看自己的日志" ON public.logs;

  CREATE POLICY "用户可查看自己的日志" ON public.logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND user_id = logs.user_id)
  );

  DROP POLICY IF EXISTS "用户可创建自己的日志" ON public.logs;

  CREATE POLICY "用户可创建自己的日志" ON public.logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND user_id = logs.user_id)
  );

  RAISE NOTICE '✓ logs 表 RLS 已修复';

  -- ============================================
  -- 第2部分：修复 post_likes 表 RLS（点赞功能）
  -- ============================================
  DROP POLICY IF EXISTS "登录用户可点赞" ON public.post_likes;

  CREATE POLICY "登录用户可点赞" ON public.post_likes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND user_id = post_likes.user_id)
  );

  DROP POLICY IF EXISTS "用户可取消自己点赞" ON public.post_likes;

  CREATE POLICY "用户可取消自己点赞" ON public.post_likes
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND user_id = post_likes.user_id)
  );

  RAISE NOTICE '✓ post_likes 表 RLS 已修复';

  -- ============================================
  -- 第3部分：修复 profiles 管理员策略（必须用 is_admin_user 避免递归！）
  -- ============================================
  DROP POLICY IF EXISTS "管理员可查看所有资料" ON public.profiles;

  -- 【关键】用 is_admin_user() SECURITY DEFINER 函数
  -- 这个函数以 OWNER 权限执行，跳过 RLS，避免无限递归
  CREATE POLICY "管理员可查看所有资料" ON public.profiles
  FOR ALL USING (
    public.is_admin_user(auth.uid())
  );

  RAISE NOTICE '✓ profiles 管理员策略已修复（使用 is_admin_user 避免递归）';

  -- ============================================
  -- 第4部分：清理 background_images 重复策略
  -- ============================================
  -- 删除旧的策略名（来自原始 schema）
  DROP POLICY IF EXISTS "用户可管理自己的背景图" ON public.background_images;
  -- 删除被 20260612 破坏的
  DROP POLICY IF EXISTS "用户可管理自己的" ON public.background_images;

  CREATE POLICY "用户可管理自己的" ON public.background_images FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND user_id = background_images.user_id
  ));

  RAISE NOTICE '✓ background_images 表 RLS 已修复';

  -- ============================================
  -- 第5部分：修复 system_config 管理员策略
  -- ============================================
  DROP POLICY IF EXISTS "仅管理员可写系统配置" ON public.system_config;

  CREATE POLICY "仅管理员可写系统配置" ON public.system_config FOR ALL
  USING (public.is_admin_user(auth.uid()));

  RAISE NOTICE '✓ system_config 表 RLS 已修复';

  -- ============================================
  -- 第6部分：修复 system_backgrounds 管理员策略
  -- ============================================
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_backgrounds') THEN
    DROP POLICY IF EXISTS "仅管理员可管理" ON public.system_backgrounds;

    CREATE POLICY "仅管理员可管理" ON public.system_backgrounds FOR ALL
    USING (public.is_admin_user(auth.uid()));
  END IF;

  RAISE NOTICE '✓ system_backgrounds 表 RLS 已修复';

  -- ============================================
  -- 第7部分：修复 reports 表策略
  -- ============================================
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reports') THEN
    DROP POLICY IF EXISTS "管理员可查看" ON public.reports;

    CREATE POLICY "管理员可查看" ON public.reports FOR SELECT
    USING (public.is_admin_user(auth.uid()));

    DROP POLICY IF EXISTS "管理员可更新" ON public.reports;

    CREATE POLICY "管理员可更新" ON public.reports FOR UPDATE
    USING (public.is_admin_user(auth.uid()));
  END IF;

  RAISE NOTICE '✓ reports 表 RLS 已修复';

  -- ============================================
  -- 第8部分：修复 edit_tokens 策略
  -- ============================================
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'edit_tokens') THEN
    DROP POLICY IF EXISTS "用户可管理自己的令牌" ON public.edit_tokens;

    CREATE POLICY "用户可管理自己的令牌" ON public.edit_tokens FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND user_id = edit_tokens.user_id
    ));
  END IF;

  RAISE NOTICE '✓ edit_tokens 表 RLS 已修复';

  -- ============================================
  -- 第9部分：修复 notifications 管理员策略
  -- ============================================
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    DROP POLICY IF EXISTS "仅管理员可写通知" ON public.notifications;

    CREATE POLICY "仅管理员可写通知" ON public.notifications FOR ALL
    USING (public.is_admin_user(auth.uid()));
  END IF;

  RAISE NOTICE '✓ notifications 表 RLS 已修复';

  -- ============================================
  -- 第10部分：修复 user_messages 管理员策略
  -- ============================================
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_messages') THEN
    DROP POLICY IF EXISTS "管理员可删" ON public.user_messages;

    CREATE POLICY "管理员可删" ON public.user_messages FOR DELETE
    USING (public.is_admin_user(auth.uid()));
  END IF;

  RAISE NOTICE '✓ user_messages 表 RLS 已修复';

  -- ============================================
  -- 第11部分：修复 conversations 表策略
  -- ============================================
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversations') THEN
    DROP POLICY IF EXISTS "参与者可读" ON public.conversations;

    CREATE POLICY "参与者可读" ON public.conversations FOR SELECT
    USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND user_id = conversations.user1_id)
      OR
      EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND user_id = conversations.user2_id)
    );
  END IF;

  RAISE NOTICE '✓ conversations 表 RLS 已修复';

  -- ============================================
  -- 第12部分：修复 ip_blacklist 管理员策略
  -- ============================================
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ip_blacklist') THEN
    DROP POLICY IF EXISTS "仅管理员可管理" ON public.ip_blacklist;

    CREATE POLICY "仅管理员可管理" ON public.ip_blacklist FOR ALL
    USING (public.is_admin_user(auth.uid()));
  END IF;

  RAISE NOTICE '✓ ip_blacklist 表 RLS 已修复';

  -- ============================================
  -- 总结
  -- ============================================
  RAISE NOTICE '============================================';
  RAISE NOTICE '所有 RLS 策略修复完成！';
  RAISE NOTICE '============================================';

END $$;

-- 验证当前 RLS 配置
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('logs', 'post_likes', 'profiles', 'daily_post_logs', 'background_images')
ORDER BY tablename, policyname;
