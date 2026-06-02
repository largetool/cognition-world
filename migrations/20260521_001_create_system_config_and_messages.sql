-- 创建系统配置表
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建留言表
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建系统消息表
CREATE TABLE IF NOT EXISTS system_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'system' CHECK (type IN ('system', 'announcement')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 初始化留言板配置
INSERT INTO system_config (key, value) VALUES 
('message_board_config', '{"enabled":true,"rateLimit":10,"captchaRequired":false}')
ON CONFLICT (key) DO NOTHING;

-- 添加示例系统消息
INSERT INTO system_messages (content, type) VALUES 
('欢迎使用认知界消息中心！', 'system'),
('留言板功能已上线，欢迎交流。', 'announcement')
ON CONFLICT DO NOTHING;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_messages_type ON system_messages(type);

-- 启用 RLS
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_messages ENABLE ROW LEVEL SECURITY;

-- 系统配置：仅管理员可读写
CREATE POLICY "System config readable by all" ON system_config
  FOR SELECT USING (true);

CREATE POLICY "System config writable by admin only" ON system_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- 留言：所有人可读，登录用户可写
CREATE POLICY "Messages readable by all" ON messages
  FOR SELECT USING (true);

CREATE POLICY "Messages writable by authenticated" ON messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 系统消息：所有人可读，管理员可写
CREATE POLICY "System messages readable by all" ON system_messages
  FOR SELECT USING (true);

CREATE POLICY "System messages writable by admin" ON system_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
