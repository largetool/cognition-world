-- ============================================
-- 账户冻结功能 - profiles 表添加冻结字段
-- ============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS frozen_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS frozen_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS frozen_by UUID REFERENCES auth.users(id);
