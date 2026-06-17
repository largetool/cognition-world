-- =====================================================
-- 点赞功能：post_likes 表
-- 日期：2026-06-17
-- =====================================================

-- 1. 创建表
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_id UUID NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('log', 'guestbook_message')),
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    -- 同一用户对同一内容只能点赞一次
    UNIQUE (target_id, target_type, user_id)
);

-- 2. 创建索引（加速查询）
CREATE INDEX IF NOT EXISTS idx_post_likes_target ON post_likes(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);

-- 3. 启用 RLS
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略
-- 所有人都可以查看点赞数
CREATE POLICY "Anyone can view likes" ON post_likes
    FOR SELECT USING (true);

-- 只有登录用户可以点赞（user_id 必须匹配 auth.uid()）
CREATE POLICY "Auth users can like" ON post_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 只有自己的点赞可以取消
CREATE POLICY "Users can delete their own likes" ON post_likes
    FOR DELETE USING (auth.uid() = user_id);

-- 5. 同步已有数据（如果 profiles 表的 user_id 需要和 auth.uid 保持一致）
-- 注意：下面这条根据实际情况决定是否运行
-- SELECT sync_my_auth_id(); -- 为当前登录用户同步
