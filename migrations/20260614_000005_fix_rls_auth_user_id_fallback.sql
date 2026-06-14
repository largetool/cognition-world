-- ============================================
-- 修复 RLS：所有策略增加 profiles.id = auth.uid() 备用条件
--
-- 问题：20260614_000003 用 auth_user_id = auth.uid() 做匹配
--       但新登录用户的 auth_user_id 可能为 NULL → 所有操作 403
-- 修复：每个子查询同时检查 auth_user_id 和 id
--       (profiles.id = auth.users.id 是主键关联，无需额外填充)
--
-- 同时：system_backgrounds 缺少公开读取策略 → 背景图不显示
--       background_images 缺少公开读取策略 → 他人页面看不到背景图
-- ============================================

DO $$
BEGIN
  -- ============================================
  -- 1. logs 表 — 用户日志
  -- ============================================
  DROP POLICY IF EXISTS "用户可查看自己的日志" ON public.logs;

  CREATE POLICY "用户可查看自己的日志" ON public.logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE (auth_user_id = auth.uid() OR id = auth.uid())
        AND user_id = logs.user_id
    )
  );

  DROP POLICY IF EXISTS "用户可创建自己的日志" ON public.logs;

  CREATE POLICY "用户可创建自己的日志" ON public.logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE (auth_user_id = auth.uid() OR id = auth.uid())
        AND user_id = logs.user_id
    )
  );

  RAISE NOTICE '✓ logs 表 RLS 已修复（含 id 备用）';

  -- ============================================
  -- 2. post_likes 表 — 点赞
  -- ============================================
  DROP POLICY IF EXISTS "登录用户可点赞" ON public.post_likes;

  CREATE POLICY "登录用户可点赞" ON public.post_likes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE (auth_user_id = auth.uid() OR id = auth.uid())
        AND user_id = post_likes.user_id
    )
  );

  DROP POLICY IF EXISTS "用户可取消自己点赞" ON public.post_likes;

  CREATE POLICY "用户可取消自己点赞" ON public.post_likes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE (auth_user_id = auth.uid() OR id = auth.uid())
        AND user_id = post_likes.user_id
    )
  );

  RAISE NOTICE '✓ post_likes 表 RLS 已修复（含 id 备用）';

  -- ============================================
  -- 3. background_images 表 — 用户背景图
  -- ============================================
  DROP POLICY IF EXISTS "用户可管理自己的" ON public.background_images;

  CREATE POLICY "用户可管理自己的" ON public.background_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE (auth_user_id = auth.uid() OR id = auth.uid())
        AND user_id = background_images.user_id
    )
  );

  RAISE NOTICE '✓ background_images 表 RLS 已修复（含 id 备用）';

  -- ============================================
  -- 4. system_backgrounds 表 — 系统默认背景图
  --    新增：所有人可读（仅写入需管理员）
  -- ============================================
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_backgrounds') THEN
    -- 保留管理员管理权
    DROP POLICY IF EXISTS "仅管理员可管理" ON public.system_backgrounds;
    CREATE POLICY "仅管理员可写" ON public.system_backgrounds FOR INSERT
      WITH CHECK (public.is_admin_user(auth.uid()));
    CREATE POLICY "仅管理员可更新" ON public.system_backgrounds FOR UPDATE
      USING (public.is_admin_user(auth.uid()));
    CREATE POLICY "仅管理员可删除" ON public.system_backgrounds FOR DELETE
      USING (public.is_admin_user(auth.uid()));

    -- 新增：所有人可读
    DROP POLICY IF EXISTS "所有人可读背景图" ON public.system_backgrounds;
    CREATE POLICY "所有人可读背景图" ON public.system_backgrounds
      FOR SELECT USING (true);
  END IF;

  RAISE NOTICE '✓ system_backgrounds 表已修复（公开可读 + 管理员可写）';

  -- ============================================
  -- 5. edit_tokens 表
  -- ============================================
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'edit_tokens') THEN
    DROP POLICY IF EXISTS "用户可管理自己的令牌" ON public.edit_tokens;

    CREATE POLICY "用户可管理自己的令牌" ON public.edit_tokens FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE (auth_user_id = auth.uid() OR id = auth.uid())
          AND user_id = edit_tokens.user_id
      )
    );
  END IF;

  RAISE NOTICE '✓ edit_tokens 表 RLS 已修复';

  -- ============================================
  -- 6. conversations 表
  -- ============================================
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversations') THEN
    DROP POLICY IF EXISTS "参与者可读" ON public.conversations;

    CREATE POLICY "参与者可读" ON public.conversations FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE (auth_user_id = auth.uid() OR id = auth.uid())
          AND user_id = conversations.user1_id
      )
      OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE (auth_user_id = auth.uid() OR id = auth.uid())
          AND user_id = conversations.user2_id
      )
    );
  END IF;

  RAISE NOTICE '✓ conversations 表 RLS 已修复';

  -- ============================================
  -- 7. 验证全部策略
  -- 同时修复 sync_my_auth_id 函数：只更新当前用户，不是无差别全表更新
-- ============================================
RAISE NOTICE '============================================';
RAISE NOTICE '所有 RLS 策略已更新完成！';
  RAISE NOTICE '============================================';

END $$;

-- 修复 sync_my_auth_id 函数：WHERE 用 id = auth.uid() 精确匹配当前用户
-- 原版用 auth_user_id IS NULL 会无差别更新所有 NULL 行，没问题但不够精确
CREATE OR REPLACE FUNCTION public.sync_my_auth_id()
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.profiles
  SET auth_user_id = auth.uid()
  WHERE id = auth.uid()
    AND auth_user_id IS NULL;
  RETURN FOUND;
END;
$$;

-- 验证关键表的策略
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('logs', 'post_likes', 'background_images', 'system_backgrounds')
ORDER BY tablename, policyname;
