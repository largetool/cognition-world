-- =====================================================
-- 修复 reports 表列类型
-- 问题：reports 表有 3 个 UUID 列，但应用发送的是
--       用户显示 ID（纯数字字符串如 "000000003"）
--       reporter_id UUID → TEXT
--       reported_message_id UUID → TEXT
--       reported_user_id UUID → TEXT
-- 日期：2026-06-19
-- =====================================================

-- 先去掉外键约束（UUID 列引用了 auth.users(id)）
ALTER TABLE reports ALTER COLUMN reporter_id DROP DEFAULT;
ALTER TABLE reports ALTER COLUMN reported_user_id DROP DEFAULT;
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey;
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_reported_user_id_fkey;
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_reviewed_by_fkey;

-- 修改列类型
ALTER TABLE reports ALTER COLUMN reporter_id TYPE TEXT;
ALTER TABLE reports ALTER COLUMN reported_message_id TYPE TEXT;
ALTER TABLE reports ALTER COLUMN reported_user_id TYPE TEXT;
