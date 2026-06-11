-- ============================================
-- 添加 is_trusted 白名单字段
-- trusted 用户可免内容审核，节省 API 费用
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_trusted BOOLEAN DEFAULT false;

-- 管理员自动设为 trusted（但保留 is_admin 作为独立权限）
UPDATE public.profiles SET is_trusted = true WHERE is_admin = true;
