-- 管理员留言板表
-- 每个用户给管理员发送私密留言，仅发送者和管理员可见

CREATE TABLE IF NOT EXISTS guestbook_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE guestbook_messages ENABLE ROW LEVEL SECURITY;

-- 用户可以看到自己的留言（比较 UUID 和 TEXT，将 user_id 转为 UUID）
CREATE POLICY "Users can view own messages"
  ON guestbook_messages FOR SELECT
  USING (auth.uid() = user_id::uuid);

-- 管理员可以看到所有留言（profiles.id 是 UUID，直接与 auth.uid() 比较）
CREATE POLICY "Admins can view all messages"
  ON guestbook_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ));

-- 已登录用户可以插入留言
CREATE POLICY "Authenticated users can insert"
  ON guestbook_messages FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
