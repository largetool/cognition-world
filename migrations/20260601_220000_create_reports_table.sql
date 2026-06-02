-- ============================================
-- 举报功能 - reports 表
-- ============================================

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_message_id UUID NOT NULL,
  message_table TEXT NOT NULL CHECK (message_table IN ('guestbook_messages', 'user_messages', 'logs', 'profiles')),
  message_content TEXT NOT NULL,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (LENGTH(reason) <= 200),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'dismissed')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_reports_status ON reports(status, created_at);
CREATE INDEX idx_reports_reported_user ON reports(reported_user_id);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 已登录用户可举报
CREATE POLICY "auth_insert_report"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- 只有管理员可以查看举报
CREATE POLICY "admin_select_reports"
  ON reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

-- 只有管理员可以更新举报状态
CREATE POLICY "admin_update_reports"
  ON reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));
