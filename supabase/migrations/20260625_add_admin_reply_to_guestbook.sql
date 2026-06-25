-- 为管理员留言板添加回复功能
-- 管理员可以在后台回复用户留言，用户在前台看到回复

ALTER TABLE guestbook_messages
  ADD COLUMN IF NOT EXISTS admin_reply TEXT,
  ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;
