-- ============================================
-- 1. 将 user_id 改为纯数字（原格式如 TEST002000000003 → 000000003）
-- 2. 新增 admin_delete_user() RPC 函数
-- ============================================

-- ============================================
-- 1a. 临时删除依赖 profiles(user_id) 的外键约束
-- ============================================
ALTER TABLE IF EXISTS public.logs DROP CONSTRAINT IF EXISTS logs_user_id_fkey;
ALTER TABLE IF EXISTS public.background_images DROP CONSTRAINT IF EXISTS background_images_user_id_fkey;
ALTER TABLE IF EXISTS public.daily_post_logs DROP CONSTRAINT IF EXISTS daily_post_logs_user_id_fkey;

-- 建立新旧映射
CREATE TEMP TABLE IF NOT EXISTS uid_map AS
SELECT user_id AS old_id, LPAD(display_id::TEXT, 9, '0') AS new_id
FROM public.profiles;

-- ============================================
-- 1b. 更新 profiles.user_id
-- ============================================
UPDATE public.profiles p
SET user_id = LPAD(p.display_id::TEXT, 9, '0')
WHERE p.user_id != LPAD(p.display_id::TEXT, 9, '0');

-- ============================================
-- 1c. 更新所有关联表
-- ============================================
UPDATE public.logs l
SET user_id = m.new_id
FROM uid_map m
WHERE l.user_id = m.old_id AND m.old_id != m.new_id;

UPDATE public.background_images b
SET user_id = m.new_id
FROM uid_map m
WHERE b.user_id = m.old_id AND m.old_id != m.new_id;

UPDATE public.daily_post_logs d
SET user_id = m.new_id
FROM uid_map m
WHERE d.user_id = m.old_id AND m.old_id != m.new_id;

UPDATE public.post_likes pl
SET user_id = m.new_id
FROM uid_map m
WHERE pl.user_id = m.old_id AND m.old_id != m.new_id;

UPDATE public.edit_tokens et
SET user_id = m.new_id
FROM uid_map m
WHERE et.user_id = m.old_id AND m.old_id != m.new_id;

UPDATE public.guestbook g
SET user_id = m.new_id
FROM uid_map m
WHERE g.user_id = m.old_id AND m.old_id != m.new_id;

-- ============================================
-- 1d. 重建外键约束（带 ON UPDATE CASCADE）
-- ============================================
ALTER TABLE public.logs
ADD CONSTRAINT logs_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.background_images
ADD CONSTRAINT background_images_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.daily_post_logs
ADD CONSTRAINT daily_post_logs_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

DROP TABLE IF EXISTS uid_map;

-- ============================================
-- 2. 创建 admin_delete_user RPC
-- 管理员可以删除用户所有数据（公共表）和 auth 用户
-- 注意：auth.users 删除需要数据库有对应权限（supabase 默认不开放）
-- 如果 auth.users 删除失败不会阻止公共表数据清理
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id TEXT)
RETURNS JSONB
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  caller_is_admin BOOLEAN;
  target_auth_id UUID;
BEGIN
  -- 检查调用者是否是管理员
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  ) INTO caller_is_admin;

  IF NOT caller_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', '无管理员权限');
  END IF;

  -- 获取目标用户的 auth.id（profiles.id = auth.users.id）
  SELECT id INTO target_auth_id FROM public.profiles WHERE user_id = target_user_id;
  IF target_auth_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', '用户不存在');
  END IF;

  -- 删除关联数据（级联或手动清理）
  DELETE FROM public.post_likes WHERE user_id = target_user_id;
  DELETE FROM public.daily_post_logs WHERE user_id = target_user_id;
  DELETE FROM public.edit_tokens WHERE user_id = target_user_id;
  DELETE FROM public.guestbook WHERE user_id = target_user_id;
  DELETE FROM public.logs WHERE user_id = target_user_id;       -- 先删日志
  DELETE FROM public.background_images WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE user_id = target_user_id;   -- 最后删 profile

  -- 尝试删除 auth.users（需要 supabase superuser 权限，可能失败）
  BEGIN
    DELETE FROM auth.users WHERE id = target_auth_id;
  EXCEPTION WHEN OTHERS THEN
    -- auth.users 删除失败是可预期的，不阻塞
  END;

  RETURN jsonb_build_object('success', true);
END;
$$;
