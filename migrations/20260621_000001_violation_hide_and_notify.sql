-- ============================================
-- 举报处理改进：隐藏违规内容 + 通知双方
-- 1. logs 表加 is_hidden / violation_reason
-- 2. guestbook_messages 表加 is_hidden
-- 3. notifications 加 user_id 支持定向通知
-- 4. 违规通知 RPC 函数
-- ============================================

-- 1. logs 表：隐藏违规日志
ALTER TABLE public.logs ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE public.logs ADD COLUMN IF NOT EXISTS violation_reason TEXT;

-- 2. guestbook_messages 表：隐藏违规留言（如有此表）
DO $$ BEGIN
  ALTER TABLE public.guestbook_messages ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- 3. notifications 表：支持定向通知
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_content_id TEXT;

-- 4. 创建违规通知 RPC 函数（SECURITY DEFINER 绕过 RLS）
CREATE OR REPLACE FUNCTION public.send_violation_notifications(
  p_reporter_user_id UUID,      -- 举报者的 auth.users UUID
  p_reporter_username TEXT,
  p_reported_user_id UUID,       -- 被举报者的 auth.users UUID
  p_reason TEXT,
  p_content_type TEXT            -- 'logs', 'guestbook_messages', 'user_messages', 'profiles'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 感谢举报者的消息
  INSERT INTO public.notifications (user_id, content, type)
  VALUES (
    p_reporter_user_id,
    '感谢您对认知界平台的支持！您举报的' || p_content_type || '内容（原因：'
    || p_reason || '）经审核已确认违规。我们已对该内容进行了隐藏处理，感谢您为维护社区环境做出的贡献。',
    'system'
  );

  -- 通知被举报者
  INSERT INTO public.notifications (user_id, content, type)
  VALUES (
    p_reported_user_id,
    '系统通知：您的' || p_content_type || '内容因违反社区规范（' || p_reason
    || '）已被设置为不对外展示。请以后发布信息时遵守法律法规和社区公约，共同维护良好的社区环境。如有疑问，请联系管理员。',
    'system'
  );
END;
$$;

-- 5. 冻结用户通知 RPC 函数（接收显示 user_id，内部解析为 auth UUID）
CREATE OR REPLACE FUNCTION public.send_freeze_notification(
  p_user_display_id TEXT,       -- 用户的显示 ID（如 "000000003"）
  p_reason TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_uuid UUID;
BEGIN
  SELECT auth_user_id INTO v_auth_uuid FROM public.profiles WHERE user_id = p_user_display_id;
  IF v_auth_uuid IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, content, type)
    VALUES (
      v_auth_uuid,
      '系统通知：您的账号因违反社区规范（' || p_reason
      || '）已被冻结。如需申诉，请联系管理员。',
      'system'
    );
  END IF;
END;
$$;

-- 6. 更新 logs RLS：公开查询时排除隐藏日志
DROP POLICY IF EXISTS "所有人可查看公开用户日志" ON public.logs;
CREATE POLICY "所有人可查看公开用户日志" ON public.logs
  FOR SELECT USING (
    is_hidden = false
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = logs.user_id
        AND is_public = true
        AND is_hidden = false
    )
  );

-- 验证
SELECT '✅ 迁移完成' AS status;
