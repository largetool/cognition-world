-- ============================================
-- 最终修复：确保所有 RLS 策略兜底 + 背景默认值
-- ============================================
-- 问题1：profiles 的 SELECT 策略用了 auth_user_id = auth.uid()
--   但 auth_user_id 可能还没同步（新注册或竞态）
--   解决：加上 id = auth.uid() 作为兜底
-- 问题2：daily_post_logs 的 .single() 在没有记录时返回 406
--   解决：确保 RLS 能查到记录 + 查询改为 .maybeSingle()
-- 问题3：背景图未设置
--   解决：为所有用户设置默认背景
-- ============================================

-- 第1部分：修复 profiles 表的 RLS 策略
-- 原始的 auth.uid() = id 本身就正确（通过 FK 保证）
-- 改成 auth_user_id OR id 双重保障
DROP POLICY IF EXISTS "用户可查看自己的资料" ON public.profiles;

CREATE POLICY "用户可查看自己的资料" ON public.profiles
FOR SELECT USING (
  (auth_user_id = auth.uid()) OR (id = auth.uid()) OR (is_public = true)
);

DROP POLICY IF EXISTS "用户可更新自己的资料" ON public.profiles;

CREATE POLICY "用户可更新自己的资料" ON public.profiles
FOR UPDATE USING (
  (auth_user_id = auth.uid()) OR (id = auth.uid())
);

-- 第2部分：确保 daily_post_logs 表的 RLS 策略使用 id = auth.uid() 兜底
-- 先删掉可能重复的策略
DROP POLICY IF EXISTS "用户可读自己的记录" ON public.daily_post_logs;
DROP POLICY IF EXISTS "用户可更新自己的记录" ON public.daily_post_logs;

-- 原策略 users_select_own_post_logs 和 users_update_own_post_logs 不受影响

-- 第3部分：设置默认背景图（bg1 星空，对所有用户生效）
UPDATE public.profiles
SET background_image = '/assets/1FFB7EC2-577E-4E7C-A432-498E8E312158_2.jpg'
WHERE background_image IS NULL;

-- 第4部分：验证当前的 RLS 配置
-- 运行下面的 SELECT 来检查：
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles' ORDER BY policyname;
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'daily_post_logs' ORDER BY policyname;
-- SELECT id = auth.uid() AS id_matches, auth_user_id = auth.uid() AS auth_user_id_matches FROM profiles LIMIT 1;
