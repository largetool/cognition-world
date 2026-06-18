-- =====================================================
-- 修复 reports.reported_message_id 列类型
-- 问题：reported_message_id 是 uuid 类型，但应用发送
--       的是字符串 ID（如 "000000001"），导致报错：
--       "invalid input syntax for type uuid"
-- 日期：2026-06-18
-- =====================================================

-- 将 reported_message_id 从 uuid 改为 text
ALTER TABLE reports ALTER COLUMN reported_message_id TYPE TEXT;
