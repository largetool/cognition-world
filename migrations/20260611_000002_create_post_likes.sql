-- ============================================
-- 创建点赞表 + RLS 策略
-- 支持日志(logs)和留言板(guestbook_messages)两种类型
-- ============================================

CREATE TABLE IF NOT EXISTS public.post_likes (
    id SERIAL PRIMARY KEY,
    target_id TEXT NOT NULL,          -- 被点赞内容的 ID
    target_type TEXT NOT NULL,        -- 'log' 或 'guestbook_message'
    user_id TEXT NOT NULL,            -- 点赞者的 user_id
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(target_id, target_type, user_id)  -- 每人只能点赞一次
);

-- 启用 RLS
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- 所有人可读点赞数据
CREATE POLICY "所有人可读点赞" ON public.post_likes
    FOR SELECT USING (true);

-- 登录用户可点赞（不能重复）
CREATE POLICY "登录用户可点赞" ON public.post_likes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 用户可取消自己的点赞
CREATE POLICY "用户可取消自己点赞" ON public.post_likes
    FOR DELETE USING (auth.uid()::text = user_id);

-- 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_post_likes_target ON public.post_likes(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON public.post_likes(user_id);
