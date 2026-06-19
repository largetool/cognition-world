-- =====================================================
-- 认知界：综合修复 SQL
-- 安全运行，无论之前跑过什么，不会重复执行已生效的变更
-- 覆盖：管理员判断函数、auth_user_id 同步、点赞表 & RLS、举报列类型、日志 INSERT/DELETE 策略
-- 日期：2026-06-19
-- =====================================================

-- =====================================================
-- 0. 修复 auth_user_id：确保所有用户通过 profiles.id (UUID) 同步
--    这是所有 RLS 策略（auth_user_id = auth.uid()）正常工作的前提
-- =====================================================
UPDATE public.profiles
SET auth_user_id = id
WHERE auth_user_id IS NULL;

-- =====================================================
-- 1. 管理员判断函数
--    使用 profiles.id = auth.uid() 而非 auth_user_id，
--    因为 id 就是 auth.users 的 UUID，永远匹配
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND is_admin = true
  );
$$;

-- =====================================================
-- 2. 日志删除策略 — 允许管理员删除任意用户日志
-- =====================================================
DROP POLICY IF EXISTS "用户可删除10分钟内的日志" ON public.logs;

CREATE POLICY "用户可删除10分钟内的日志" ON public.logs
    FOR DELETE USING (
        is_current_user_admin()
        OR (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE auth_user_id = auth.uid()
                  AND user_id = logs.user_id
            )
            AND created_at > NOW() - INTERVAL '10 minutes'
        )
    );

-- =====================================================
-- 2.5 日志新增策略 — 允许管理员发布（RLS 默认 INSERT 策略无管理员豁免）
-- =====================================================
DROP POLICY IF EXISTS "用户可创建自己的日志" ON public.logs;

CREATE POLICY "用户可创建自己的日志" ON public.logs
    FOR INSERT WITH CHECK (
        is_current_user_admin()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE auth_user_id = auth.uid()
              AND user_id = logs.user_id
        )
    );

-- =====================================================
-- 3. post_likes 表（如果不存在则创建）
-- =====================================================
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_id TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('log', 'guestbook_message')),
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (target_id, target_type, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_target ON public.post_likes(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON public.post_likes(user_id);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- 替换 post_likes 所有策略
DROP POLICY IF EXISTS "Anyone can view likes" ON public.post_likes;
DROP POLICY IF EXISTS "Auth users can like" ON public.post_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.post_likes;
DROP POLICY IF EXISTS "所有人可读点赞" ON public.post_likes;
DROP POLICY IF EXISTS "登录用户可点赞" ON public.post_likes;
DROP POLICY IF EXISTS "用户可取消自己点赞" ON public.post_likes;

CREATE POLICY "所有人可读点赞" ON public.post_likes
    FOR SELECT USING (true);

CREATE POLICY "登录用户可点赞" ON public.post_likes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE auth_user_id = auth.uid()
              AND user_id = post_likes.user_id
        )
    );

CREATE POLICY "用户可取消自己点赞" ON public.post_likes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE auth_user_id = auth.uid()
              AND user_id = post_likes.user_id
        )
    );

-- =====================================================
-- 4. reports 表列类型修复 — 先删策略再改列，改完重建
-- =====================================================

-- 先把所有引用 reports 列的策略全部删掉（避免 ALTER 时报 policy dependency 错误）
DROP POLICY IF EXISTS "Auth users can create reports" ON public.reports;
DROP POLICY IF EXISTS "登录用户可举报" ON public.reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "用户可查看自己的举报" ON public.reports;
DROP POLICY IF EXISTS "管理员可查看" ON public.reports;
DROP POLICY IF EXISTS "管理员可更新" ON public.reports;
DROP POLICY IF EXISTS "Admins can view reports" ON public.reports;

DO $$
BEGIN
  -- 去掉外键约束（如果存在）
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reports_reporter_id_fkey'
      AND table_name = 'reports'
  ) THEN
    ALTER TABLE public.reports DROP CONSTRAINT reports_reporter_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reports_reported_user_id_fkey'
      AND table_name = 'reports'
  ) THEN
    ALTER TABLE public.reports DROP CONSTRAINT reports_reported_user_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reports_reviewed_by_fkey'
      AND table_name = 'reports'
  ) THEN
    ALTER TABLE public.reports DROP CONSTRAINT reports_reviewed_by_fkey;
  END IF;

  -- 改 reporter_id：只有还是 uuid 类型时才 ALTER
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reports'
      AND column_name = 'reporter_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.reports ALTER COLUMN reporter_id DROP DEFAULT;
    ALTER TABLE public.reports ALTER COLUMN reporter_id TYPE TEXT;
  END IF;

  -- 改 reported_message_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reports'
      AND column_name = 'reported_message_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.reports ALTER COLUMN reported_message_id TYPE TEXT;
  END IF;

  -- 改 reported_user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reports'
      AND column_name = 'reported_user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.reports ALTER COLUMN reported_user_id DROP DEFAULT;
    ALTER TABLE public.reports ALTER COLUMN reported_user_id TYPE TEXT;
  END IF;
END $$;

-- =====================================================
-- 5. reports RLS 策略 — 重建
-- =====================================================

CREATE POLICY "登录用户可举报" ON public.reports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE auth_user_id = auth.uid()
              AND user_id = reports.reporter_id
        )
    );

CREATE POLICY "用户可查看自己的举报" ON public.reports
    FOR SELECT USING (
        is_current_user_admin()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE auth_user_id = auth.uid()
              AND user_id = reports.reporter_id
        )
    );
