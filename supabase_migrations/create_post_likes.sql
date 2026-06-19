-- =====================================================
-- 点赞功能：post_likes 表
-- 注意：post_likes.user_id 存的是用户显示 ID（如 "000000003"），
--       不是 auth.uid()。RLS 必须通过 profiles 表做映射：
--       profiles.auth_user_id (uuid) → profiles.user_id (显示ID)
-- 日期：2026-06-19
-- =====================================================

-- 1. 创建表（如果不存在 — 不 DROP 避免数据丢失）
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_id TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('log', 'guestbook_message')),
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (target_id, target_type, user_id)
);

-- 2. 创建索引（加速查询）
CREATE INDEX IF NOT EXISTS idx_post_likes_target ON post_likes(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);

-- 3. 启用 RLS
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- 4. 先删除旧的错误策略（如果有）
DROP POLICY IF EXISTS "Auth users can like" ON post_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON post_likes;
DROP POLICY IF EXISTS "Anyone can view likes" ON post_likes;

-- 5. 创建正确的 RLS 策略
-- 所有人都可以查看点赞数
CREATE POLICY "Anyone can view likes" ON post_likes
    FOR SELECT USING (true);

-- 只有登录用户可以点赞（通过 profiles.auth_user_id 验证身份）
CREATE POLICY "登录用户可点赞" ON post_likes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE auth_user_id = auth.uid()
              AND user_id = post_likes.user_id
        )
    );

-- 只有自己的点赞可以取消
CREATE POLICY "用户可取消自己点赞" ON post_likes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE auth_user_id = auth.uid()
              AND user_id = post_likes.user_id
        )
    );
