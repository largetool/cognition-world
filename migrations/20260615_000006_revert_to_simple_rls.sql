-- ============================================
-- 回到 000003 简洁方案：只用 auth_user_id = auth.uid()
-- 去掉 000005 引入的 OR id = auth.uid() 备用条件
-- 保留 000004 的 post_likes 公开读取
-- 保留 system_backgrounds 公开读取
-- ============================================

DO $$
BEGIN
  -- ============================================
  -- 1. logs 表 — 用户日志
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

  -- 日志删除策略：只能删除10分钟内的
  DROP POLICY IF EXISTS "用户可删除10分钟内的日志" ON public.logs;

  CREATE POLICY "用户可删除10分钟内的日志" ON public.logs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND user_id = logs.user_id)
    AND created_at > NOW() - INTERVAL '10 minutes'
  );

  -- 日志更新策略（发布/隐藏）
  DROP POLICY IF EXISTS "用户可更新自己的日志" ON public.logs;

  CREATE POLICY "用户可更新自己的日志" ON public.logs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND user_id = logs.user_id)
  );

  RAISE NOTICE '✓ logs 表 RLS 已修复（4条策略）';

  -- ============================================
  -- 2. post_likes 表 — 点赞（含公开读取）
  -- ============================================
  DROP POLICY IF EXISTS "所有人可读点赞" ON public.post_likes;

  CREATE POLICY "所有人可读点赞" ON public.post_likes
  FOR SELECT USING (true);

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

  RAISE NOTICE '✓ post_likes 表 RLS 已修复（3条策略）';

  -- ============================================
  -- 3. background_images 表 — 用户背景图
  -- ============================================
  DROP POLICY IF EXISTS "用户可管理自己的" ON public.background_images;

  CREATE POLICY "用户可管理自己的" ON public.background_images FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND user_id = background_images.user_id
  ));

  RAISE NOTICE '✓ background_images 表 RLS 已修复';

  -- ============================================
  -- 4. system_backgrounds 表 — 系统默认背景图
  -- ============================================
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_backgrounds') THEN
    DROP POLICY IF EXISTS "仅管理员可写" ON public.system_backgrounds;
    DROP POLICY IF EXISTS "仅管理员可更新" ON public.system_backgrounds;
    DROP POLICY IF EXISTS "仅管理员可删除" ON public.system_backgrounds;
    DROP POLICY IF EXISTS "仅管理员可管理" ON public.system_backgrounds;
    DROP POLICY IF EXISTS "所有人可读背景图" ON public.system_backgrounds;

    CREATE POLICY "所有人可读背景图" ON public.system_backgrounds
    FOR SELECT USING (true);

    CREATE POLICY "仅管理员可管理" ON public.system_backgrounds FOR ALL
    USING (public.is_admin_user(auth.uid()));
  END IF;

  RAISE NOTICE '✓ system_backgrounds 表已修复（公开可读 + 管理员可管理）';

  -- ============================================
  -- 5. profiles 管理员策略
  -- ============================================
  DROP POLICY IF EXISTS "管理员可查看所有资料" ON public.profiles;

  CREATE POLICY "管理员可查看所有资料" ON public.profiles
  FOR ALL USING (
    public.is_admin_user(auth.uid())
  );

  RAISE NOTICE '✓ profiles 管理员策略已修复';

  -- ============================================
  -- 6. reports 表
  -- ============================================
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reports') THEN
    DROP POLICY IF EXISTS "管理员可查看" ON public.reports;
    DROP POLICY IF EXISTS "管理员可更新" ON public.reports;

    CREATE POLICY "管理员可查看" ON public.reports FOR SELECT
    USING (public.is_admin_user(auth.uid()));

    CREATE POLICY "管理员可更新" ON public.reports FOR UPDATE
    USING (public.is_admin_user(auth.uid()));
  END IF;

  RAISE NOTICE '✓ reports 表 RLS 已修复';

  -- ============================================
  -- 7. edit_tokens 表
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
  -- 8. conversations 表
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

END $$;

-- ============================================
-- 9. sync_my_auth_id 函数 — 简化为 000003 原版
--    不能放在 DO 块内，单独执行
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_my_auth_id()
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.profiles
  SET auth_user_id = auth.uid()
  WHERE auth_user_id IS NULL
    AND auth.uid() IS NOT NULL;
  RETURN FOUND;
END;
$$;

-- 验证关键表的策略
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('logs', 'post_likes', 'background_images', 'system_backgrounds')
ORDER BY tablename, policyname;
