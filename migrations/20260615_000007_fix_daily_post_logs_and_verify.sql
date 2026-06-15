-- ============================================
-- 修复 daily_post_logs 缺少唯一约束问题 (42P10)
-- 验证 post_likes 策略的 WITH CHECK
-- ============================================

-- 1. daily_post_logs 添加唯一约束（upsert 需要）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_post_logs') THEN
    -- 检查约束是否已存在
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'daily_post_logs_user_id_post_date_key'
        AND conrelid = 'public.daily_post_logs'::regclass
    ) THEN
      ALTER TABLE public.daily_post_logs
      ADD CONSTRAINT daily_post_logs_user_id_post_date_key UNIQUE (user_id, post_date);
      RAISE NOTICE '✓ daily_post_logs 已添加 UNIQUE(user_id, post_date)';
    ELSE
      RAISE NOTICE '✓ daily_post_logs 唯一约束已存在';
    END IF;
  END IF;
END $$;

-- 2. 验证 post_likes INSERT 策略的 WITH CHECK
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'post_likes';

-- 3. 如果 post_likes INSERT 策略的 with_check 为空，重新创建
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'post_likes'
      AND policyname = '登录用户可点赞' AND cmd = 'INSERT'
      AND with_check IS NULL
  ) THEN
    RAISE NOTICE '⚠ post_likes INSERT 策略缺少 WITH CHECK，正在重建...';

    DROP POLICY IF EXISTS "登录用户可点赞" ON public.post_likes;

    CREATE POLICY "登录用户可点赞" ON public.post_likes
    FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND user_id = post_likes.user_id)
    );

    RAISE NOTICE '✓ post_likes INSERT 策略已重建';
  ELSE
    RAISE NOTICE '✓ post_likes INSERT 策略 with_check 正常';
  END IF;
END $$;

-- 4. 验证用户 profile 的 auth_user_id 是否设置
SELECT user_id, username, auth_user_id IS NOT NULL AS auth_synced
FROM public.profiles
LIMIT 10;
