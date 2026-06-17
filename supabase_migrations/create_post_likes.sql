-- =====================================================
-- 点赞功能：post_likes 表
-- 日期：2026-06-17
-- =====================================================

-- 先删除旧表（如果之前已运行过未完整成功的版本）
DROP TABLE IF EXISTS post_likes CASCADE;

-- 1. 创建表（user_id/text 以匹配 profiles.user_id 的类型）
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_id TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('log', 'guestbook_message')),
    user_id TEXT NOT NULL,
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

-- 只有登录用户可以点赞（auth.uid() 是 uuid，user_id 是 text，需转换）
CREATE POLICY "Auth users can like" ON post_likes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 只有自己的点赞可以取消
CREATE POLICY "Users can delete their own likes" ON post_likes
    FOR DELETE USING (auth.uid()::text = user_id);
