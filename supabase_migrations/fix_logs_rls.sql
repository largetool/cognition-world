-- =====================================================
-- 修复 logs 和 reports 的 RLS 策略
-- 关键问题：已有迁移用中文策略名，必须按原名 DROP
-- 日期：2026-06-19
-- =====================================================

-- 0. 先创建管理员判断函数
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid()
      AND is_admin = true
  );
$$;

-- =====================================================
-- 1. 修复 logs DELETE 策略 — 允许管理员删除任意日志
--    旧策略 "用户可删除10分钟内的日志" 只允许本人删10分钟内的
-- =====================================================
DROP POLICY IF EXISTS "用户可删除10分钟内的日志" ON public.logs;

CREATE POLICY "用户可删除10分钟内的日志" ON public.logs
    FOR DELETE USING (
        is_current_user_admin()
        OR (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE auth_user_id = auth.uid()
                  AND user_id = logs.user_id
            )
            AND created_at > NOW() - INTERVAL '10 minutes'
        )
    );

-- =====================================================
-- 2. 修复 reports INSERT 策略 — 允许登录用户提交举报
--    （原表没有 INSERT 策略，匿名用户无法举报）
-- =====================================================
DROP POLICY IF EXISTS "Auth users can create reports" ON public.reports;
DROP POLICY IF EXISTS "登录用户可举报" ON public.reports;

CREATE POLICY "登录用户可举报" ON public.reports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE auth_user_id = auth.uid()
              AND user_id = reports.reporter_id
        )
    );

-- =====================================================
-- 3. 确保 reports SELECT 策略存在（管理员 + 本人可查看）
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;

CREATE POLICY "用户可查看自己的举报" ON public.reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE auth_user_id = auth.uid()
              AND user_id = reports.reporter_id
        )
    );
