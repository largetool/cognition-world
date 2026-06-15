-- ============================================
-- 全面修复：post_likes + daily_post_logs + 策略检查
-- 1. 删除并重建 post_likes 所有策略
-- 2. daily_post_logs 添加唯一约束
-- 3. 验证 auth_user_id 同步状态
-- ============================================

-- ============================================
-- 1. 重建 post_likes 全部策略（彻底清理旧的）
-- ============================================
DROP POLICY IF EXISTS "所有人可读点赞" ON public.post_likes;
DROP POLICY IF EXISTS "登录用户可点赞" ON public.post_likes;
DROP POLICY IF EXISTS "用户可取消自己点赞" ON public.post_likes;

-- ① 公开读取：任何人都能查看点赞
CREATE POLICY "所有人可读点赞" ON public.post_likes
FOR SELECT USING (true);

-- ② 点赞：登录用户可以添加，且必须匹配自己的 user_id
CREATE POLICY "登录用户可点赞" ON public.post_likes
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid()
      AND user_id = post_likes.user_id
  )
);

-- ③ 取消点赞：只能取消自己的
CREATE POLICY "用户可取消自己点赞" ON public.post_likes
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid()
      AND user_id = post_likes.user_id
  )
);

RAISE NOTICE '✓ post_likes 策略已彻底重建';

-- ============================================
-- 2. daily_post_logs 唯一约束
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_post_logs') THEN
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

-- ============================================
-- 3. 验证所有 post_likes 策略
-- ============================================
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'post_likes'
ORDER BY policyname;

-- ============================================
-- 4. 检查 auth_user_id 是否已同步
-- ============================================
SELECT user_id, username,
  CASE WHEN auth_user_id IS NOT NULL THEN '✅ 已同步' ELSE '❌ 未同步' END as auth_status
FROM public.profiles
ORDER BY created_at DESC
LIMIT 20;
