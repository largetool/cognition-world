-- ============================================
-- 修复 post_likes SELECT 策略
-- 问题：20260612 迁移把 "所有人可读点赞" 策略改成了
--   USING (auth.uid()::text = user_id)
-- 但未登录用户 auth.uid() 为 NULL → SELECT 403
-- 修复：恢复 USING (true)，点赞数对所有人可见
-- ============================================

DROP POLICY IF EXISTS "所有人可读点赞" ON public.post_likes;

CREATE POLICY "所有人可读点赞" ON public.post_likes
FOR SELECT USING (true);

RAISE NOTICE '✓ post_likes SELECT 策略已修复：所有人可读';

-- 验证当前 post_likes 策略
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'post_likes'
ORDER BY cmd;
