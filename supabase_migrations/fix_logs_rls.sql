-- =====================================================
-- 修复 logs 表的 RLS 策略
-- 问题：auth.uid() 返回 uuid，但 user_id 列是 text，
--       PostgreSQL 拒绝 uuid = text 的隐式比较
-- 日期：2026-06-17
-- =====================================================

-- 1. 修复 INSERT 策略（发布日志）
DROP POLICY IF EXISTS "Users can insert their own logs" ON logs;
CREATE POLICY "Users can insert their own logs" ON logs
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 2. 修复 DELETE 策略（删除日志：本人或管理员）
DROP POLICY IF EXISTS "Users can delete their own logs" ON logs;
CREATE POLICY "Users can delete their own logs" ON logs
    FOR DELETE USING (auth.uid()::text = user_id OR is_current_user_admin());

-- 3. 如果 SELECT 策略也有类似问题，一并修复
DROP POLICY IF EXISTS "Users can view logs" ON logs;
CREATE POLICY "Users can view logs" ON logs
    FOR SELECT USING (true);

-- =====================================================
-- 修复 reports 表的 RLS 策略（举报功能）
-- =====================================================

-- 允许登录用户提交举报
DROP POLICY IF EXISTS "Auth users can create reports" ON reports;
CREATE POLICY "Auth users can create reports" ON reports
    FOR INSERT WITH CHECK (auth.uid()::text = reporter_id);

-- 管理员可以查看所有举报
DROP POLICY IF EXISTS "Admins can view reports" ON reports;
CREATE POLICY "Admins can view reports" ON reports
    FOR SELECT USING (is_current_user_admin());

-- 用户只能查看自己提交的举报
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
CREATE POLICY "Users can view their own reports" ON reports
    FOR SELECT USING (auth.uid()::text = reporter_id);
