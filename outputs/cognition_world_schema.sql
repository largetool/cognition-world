-- 认知界 数据库结构
-- 导出时间: 2026-06-02
-- 目标 Supabase: https://nbgsichilfrjsopnnvia.supabase.co
-- 原数据库: Meoo Cloud

-- ====================================
-- 1. 扩展和类型
-- ====================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================
-- 2. 序列
-- ====================================

-- display_id 序列
CREATE SEQUENCE IF NOT EXISTS public.display_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- system_config_id_seq 序列
CREATE SEQUENCE IF NOT EXISTS public.system_config_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- ====================================
-- 3. 表结构
-- ====================================

-- profiles 表
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    username text NOT NULL,
    user_id text NOT NULL,
    tag text NOT NULL DEFAULT '',
    slogan text,
    location text NOT NULL DEFAULT '',
    is_public boolean DEFAULT true,
    is_hidden boolean DEFAULT false,
    is_admin boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    display_id integer,
    onboarding_completed boolean DEFAULT false,
    account_status text DEFAULT 'available'::text,
    geo_enabled boolean DEFAULT false,
    avatar_url text,
    background_image text,
    email text,
    role text DEFAULT 'user'::text,
    daily_posts_count integer DEFAULT 0,
    last_post_date date,
    slogan_approved boolean DEFAULT false,
    is_frozen boolean DEFAULT false,
    frozen_at timestamp with time zone,
    frozen_reason text,
    frozen_by uuid,
    hide_status text DEFAULT 'none'::text,
    hide_requested_at timestamp with time zone,
    cooling_ends_at timestamp with time zone,
    frozen_ends_at timestamp with time zone,
    hide_canceled_at timestamp with time zone,
    restored_at timestamp with time zone,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_user_id_key UNIQUE (user_id),
    CONSTRAINT profiles_username_key UNIQUE (username)
);

-- logs 表
CREATE TABLE IF NOT EXISTS public.logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    is_public boolean DEFAULT false,
    published_at timestamp with time zone,
    tags text[] DEFAULT '{}'::text[]
);

-- thoughts 表
CREATE TABLE IF NOT EXISTS public.thoughts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    content text NOT NULL,
    published_at timestamp with time zone DEFAULT now(),
    is_public boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    moderation_status text DEFAULT 'pending'::text
);

-- thought_marks 表
CREATE TABLE IF NOT EXISTS public.thought_marks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    original_thought_id uuid NOT NULL,
    author_id text NOT NULL,
    mark_content text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- background_images 表
CREATE TABLE IF NOT EXISTS public.background_images (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    url text NOT NULL,
    status text DEFAULT 'pending'::text,
    is_active boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);

-- system_backgrounds 表
CREATE TABLE IF NOT EXISTS public.system_backgrounds (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    url text NOT NULL,
    name text,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);

-- ip_blacklist 表
CREATE TABLE IF NOT EXISTS public.ip_blacklist (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    cidr text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now()
);

-- password_resets 表
CREATE TABLE IF NOT EXISTS public.password_resets (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    email text NOT NULL,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL DEFAULT (now() + '01:00:00'::interval),
    used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);

-- edit_tokens 表
CREATE TABLE IF NOT EXISTS public.edit_tokens (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    token text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);

-- conversations 表
CREATE TABLE IF NOT EXISTS public.conversations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user1_id text NOT NULL,
    user2_id text NOT NULL,
    last_message_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    is_public boolean DEFAULT false,
    public_title text,
    public_at timestamp with time zone
);

-- messages 表
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    sender_id text NOT NULL,
    receiver_id text NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- user_conversations 表
CREATE TABLE IF NOT EXISTS public.user_conversations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_a uuid NOT NULL,
    user_b uuid NOT NULL,
    last_message_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- user_messages 表
CREATE TABLE IF NOT EXISTS public.user_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    sender_username text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    is_deleted boolean DEFAULT false
);

-- guestbook 表
CREATE TABLE IF NOT EXISTS public.guestbook (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    content text NOT NULL,
    is_public boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'pending'::text,
    visible_after timestamp with time zone
);

-- guestbook_messages 表
CREATE TABLE IF NOT EXISTS public.guestbook_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    username text NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- system_config 表
CREATE TABLE IF NOT EXISTS public.system_config (
    id integer NOT NULL DEFAULT nextval('public.system_config_id_seq'::regclass),
    key text NOT NULL,
    value text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT system_config_pkey PRIMARY KEY (id),
    CONSTRAINT system_config_key_key UNIQUE (key)
);

-- notifications 表
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- announcements 表
CREATE TABLE IF NOT EXISTS public.announcements (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    title text NOT NULL,
    content text NOT NULL,
    is_active boolean DEFAULT true,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- feedback 表
CREATE TABLE IF NOT EXISTS public.feedback (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id text,
    content text NOT NULL,
    is_resolved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- tags 表
CREATE TABLE IF NOT EXISTS public.tags (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    category text DEFAULT 'neutral'::text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- content_moderation 表
CREATE TABLE IF NOT EXISTS public.content_moderation (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    content_id uuid NOT NULL,
    content_type text NOT NULL,
    risk_score integer,
    risk_type text,
    action text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- user_credit 表
CREATE TABLE IF NOT EXISTS public.user_credit (
    user_id text NOT NULL,
    credit_score integer DEFAULT 100,
    last_updated timestamp with time zone DEFAULT now(),
    CONSTRAINT user_credit_pkey PRIMARY KEY (user_id)
);

-- daily_post_logs 表
CREATE TABLE IF NOT EXISTS public.daily_post_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    post_date date NOT NULL DEFAULT CURRENT_DATE,
    post_count integer NOT NULL DEFAULT 1,
    created_at timestamp with time zone DEFAULT now()
);

-- invite_codes 表
CREATE TABLE IF NOT EXISTS public.invite_codes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code text NOT NULL,
    max_uses integer DEFAULT 1,
    used_count integer DEFAULT 0,
    expires_at timestamp with time zone,
    created_by text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- invite_code_uses 表
CREATE TABLE IF NOT EXISTS public.invite_code_uses (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    invite_code_id uuid NOT NULL,
    user_id text NOT NULL,
    used_at timestamp with time zone DEFAULT now()
);

-- avatar_reviews 表
CREATE TABLE IF NOT EXISTS public.avatar_reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    temp_url text NOT NULL,
    status text NOT NULL DEFAULT 'pending'::text,
    reviewer_note text,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- reports 表
CREATE TABLE IF NOT EXISTS public.reports (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    reporter_id uuid NOT NULL,
    reported_message_id uuid NOT NULL,
    message_table text NOT NULL,
    message_content text NOT NULL,
    reported_user_id uuid NOT NULL,
    reason text NOT NULL,
    status text NOT NULL DEFAULT 'pending'::text,
    admin_notes text,
    reviewed_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone
);

-- ====================================
-- 4. 函数
-- ====================================

-- is_admin_user 函数
CREATE OR REPLACE FUNCTION public.is_admin_user(user_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_uuid AND is_admin = true
  );
$function$;

-- increment_post_count 函数
CREATE OR REPLACE FUNCTION public.increment_post_count(p_user_id text, p_date date)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
 UPDATE daily_post_logs
 SET post_count = post_count + 1
 WHERE user_id = p_user_id AND post_date = p_date;
 
 -- 如果没有记录，插入一条
 IF NOT FOUND THEN
 INSERT INTO daily_post_logs (user_id, post_date, post_count)
 VALUES (p_user_id, p_date, 1)
 ON CONFLICT (user_id, post_date) DO UPDATE
 SET post_count = daily_post_logs.post_count + 1;
 END IF;
END;
$function$;

-- assign_display_id 函数 (触发器)
CREATE OR REPLACE FUNCTION public.assign_display_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.display_id IS NULL THEN
    NEW.display_id := nextval('public.display_id_seq');
  END IF;
  RETURN NEW;
END;
$function$;

-- ====================================
-- 5. 触发器
-- ====================================

-- profiles 表 display_id 自动分配触发器
DROP TRIGGER IF EXISTS assign_display_id_trigger ON public.profiles;
CREATE TRIGGER assign_display_id_trigger
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_display_id();

-- ====================================
-- 6. RLS 策略
-- ====================================

-- 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.background_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_backgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edit_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guestbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guestbook_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_post_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatar_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- profiles 表策略
CREATE POLICY "允许注册时插入资料" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "所有人可查看公开资料" ON public.profiles FOR SELECT USING ((is_public = true) AND (is_hidden = false));
CREATE POLICY "用户可更新自己的资料" ON public.profiles FOR UPDATE USING (uid() = id);
CREATE POLICY "用户可查看自己的资料" ON public.profiles FOR SELECT USING (uid() = id);
CREATE POLICY "管理员可查看所有资料" ON public.profiles FOR ALL USING (is_admin_user(uid()));

-- logs 表策略
CREATE POLICY "所有人可查看公开用户日志" ON public.logs FOR SELECT USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.user_id = logs.user_id) AND (profiles.is_public = true) AND (profiles.is_hidden = false)))));
CREATE POLICY "用户可创建自己的日志" ON public.logs FOR INSERT WITH CHECK ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = uid()) AND (profiles.user_id = logs.user_id)))));
CREATE POLICY "用户可查看自己的日志" ON public.logs FOR SELECT USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = uid()) AND (profiles.user_id = logs.user_id)))));
CREATE POLICY "管理员可查看所有日志" ON public.logs FOR ALL USING (is_admin_user(uid()));

-- thoughts 表策略
CREATE POLICY "所有人可查看公开想法" ON public.thoughts FOR SELECT USING ((is_public = true) OR ((uid())::text = user_id));
CREATE POLICY "用户可在10分钟内删除自己的想法" ON public.thoughts FOR DELETE USING (((uid())::text = user_id) AND ((now() - published_at) < '00:10:00'::interval));
CREATE POLICY "用户可更新自己的想法" ON public.thoughts FOR UPDATE USING ((uid())::text = user_id);
CREATE POLICY "认证用户可创建想法" ON public.thoughts FOR INSERT WITH CHECK ((uid())::text = user_id);

-- background_images 表策略
CREATE POLICY "所有人可查看已审核背景图" ON public.background_images FOR SELECT USING (status = 'approved'::text);
CREATE POLICY "用户可管理自己的背景图" ON public.background_images FOR ALL USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = uid()) AND (profiles.user_id = background_images.user_id)))));
CREATE POLICY "管理员可管理所有背景图" ON public.background_images FOR ALL USING (is_admin_user(uid()));

-- system_backgrounds 表策略
CREATE POLICY "所有人可查看系统背景图" ON public.system_backgrounds FOR SELECT USING (true);
CREATE POLICY "只有管理员可管理系统背景图" ON public.system_backgrounds FOR ALL USING ((uid() IN ( SELECT profiles.id FROM profiles WHERE (profiles.is_admin = true))));

-- ip_blacklist 表策略
CREATE POLICY "所有人可查看IP黑名单" ON public.ip_blacklist FOR SELECT USING (true);
CREATE POLICY "管理员可管理IP黑名单" ON public.ip_blacklist FOR ALL USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = uid()) AND (profiles.is_admin = true)))));

-- password_resets 表策略
CREATE POLICY "允许匿名创建重置请求" ON public.password_resets FOR INSERT WITH CHECK (true);
CREATE POLICY "允许更新自己的重置请求" ON public.password_resets FOR UPDATE USING ((uid() = user_id) OR (EXISTS ( SELECT 1 FROM users WHERE ((users.id = uid()) AND ((users.email)::text = ( SELECT password_resets_1.email FROM password_resets password_resets_1 WHERE (password_resets_1.id = password_resets_1.id)))))));
CREATE POLICY "允许用户查看自己的重置请求" ON public.password_resets FOR SELECT USING ((uid() = user_id) OR (EXISTS ( SELECT 1 FROM users WHERE ((users.id = uid()) AND ((users.email)::text = ( SELECT password_resets_1.email FROM password_resets password_resets_1 WHERE (password_resets_1.id = password_resets_1.id)))))));

-- guestbook 表策略
CREATE POLICY "anon_insert_guestbook" ON public.guestbook FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_select_guestbook" ON public.guestbook FOR SELECT USING (is_public = true);
CREATE POLICY "users_delete_own_guestbook" ON public.guestbook FOR DELETE USING (user_id = CURRENT_USER);

-- guestbook_messages 表策略
CREATE POLICY "anon_select_guestbook" ON public.guestbook_messages FOR SELECT USING (true);
CREATE POLICY "users_delete_own_guestbook" ON public.guestbook_messages FOR DELETE USING (user_id = uid());
CREATE POLICY "users_insert_guestbook" ON public.guestbook_messages FOR INSERT WITH CHECK (user_id = uid());

-- daily_post_logs 表策略
CREATE POLICY "anon_insert_post_logs" ON public.daily_post_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "users_select_own_post_logs" ON public.daily_post_logs FOR SELECT USING (user_id = ( SELECT profiles.user_id FROM profiles WHERE (profiles.id = uid())));
CREATE POLICY "users_update_own_post_logs" ON public.daily_post_logs FOR UPDATE USING (user_id = ( SELECT profiles.user_id FROM profiles WHERE (profiles.id = uid())));

-- notifications 表策略
CREATE POLICY "用户可更新自己的通知" ON public.notifications FOR UPDATE USING (user_id = (uid())::text);
CREATE POLICY "用户可查看自己的通知" ON public.notifications FOR SELECT USING (user_id = (uid())::text);
CREATE POLICY "系统可创建通知" ON public.notifications FOR INSERT WITH CHECK (true);

-- announcements 表策略
CREATE POLICY "所有人可查看公告" ON public.announcements FOR SELECT USING (is_active = true);

-- feedback 表策略
CREATE POLICY "所有人可提交反馈" ON public.feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "管理员可查看反馈" ON public.feedback FOR SELECT USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = uid()) AND (profiles.is_admin = true)))));

-- tags 表策略
CREATE POLICY "所有人可查看标签" ON public.tags FOR SELECT USING (is_active = true);

-- content_moderation 表策略
CREATE POLICY "管理员可查看审核记录" ON public.content_moderation FOR SELECT USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.user_id = (uid())::text) AND (profiles.is_admin = true)))));

-- user_credit 表策略
CREATE POLICY "用户可查看自己的信用分" ON public.user_credit FOR SELECT USING (user_id = (uid())::text);
CREATE POLICY "系统可创建信用分记录" ON public.user_credit FOR INSERT WITH CHECK (true);
CREATE POLICY "系统可更新信用分" ON public.user_credit FOR UPDATE USING (true);

-- conversations 表策略
CREATE POLICY "用户可查看自己的对话" ON public.conversations FOR SELECT USING (((uid())::text = user1_id) OR ((uid())::text = user2_id));

-- messages 表策略
CREATE POLICY "用户可查看自己的消息" ON public.messages FOR SELECT USING (((uid())::text = sender_id) OR ((uid())::text = receiver_id));
CREATE POLICY "认证用户可发送消息" ON public.messages FOR INSERT WITH CHECK ((uid())::text = sender_id);

-- user_conversations 表策略
CREATE POLICY "auth_insert_conversation" ON public.user_conversations FOR INSERT WITH CHECK ((uid() = user_a) AND (user_a <> user_b));
CREATE POLICY "participants_read_conversation" ON public.user_conversations FOR SELECT USING ((uid() = user_a) OR (uid() = user_b));

-- user_messages 表策略
CREATE POLICY "admin_delete_message" ON public.user_messages FOR DELETE USING ((EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = uid()) AND (profiles.is_admin = true)))));
CREATE POLICY "auth_insert_message" ON public.user_messages FOR INSERT WITH CHECK (uid() = sender_id);
CREATE POLICY "participants_read_messages" ON public.user_messages FOR SELECT USING ((EXISTS ( SELECT 1 FROM user_conversations c WHERE ((c.id = user_messages.conversation_id) AND ((c.user_a = uid()) OR (c.user_b = uid()))))) OR (uid() IS NOT NULL));
CREATE POLICY "sender_delete_own_message" ON public.user_messages FOR DELETE USING ((uid() = sender_id) AND (created_at > (now() - '00:10:00'::interval)));

-- avatar_reviews 表策略
CREATE POLICY "用户可查看自己的头像审核" ON public.avatar_reviews FOR SELECT USING (((uid())::text = user_id) OR (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = uid()) AND (profiles.is_admin = true)))));

-- ====================================
-- 7. 索引
-- ====================================

-- profiles 表索引
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_public ON public.profiles(is_public);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_display_id ON public.profiles(display_id);

-- logs 表索引
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON public.logs(created_at);

-- thoughts 表索引
CREATE INDEX IF NOT EXISTS idx_thoughts_user_id ON public.thoughts(user_id);
CREATE INDEX IF NOT EXISTS idx_thoughts_created_at ON public.thoughts(created_at);

-- background_images 表索引
CREATE INDEX IF NOT EXISTS idx_background_images_user_id ON public.background_images(user_id);
CREATE INDEX IF NOT EXISTS idx_background_images_status ON public.background_images(status);

-- guestbook 表索引
CREATE INDEX IF NOT EXISTS idx_guestbook_user_id ON public.guestbook(user_id);
CREATE INDEX IF NOT EXISTS idx_guestbook_created_at ON public.guestbook(created_at);

-- password_resets 表索引
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON public.password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON public.password_resets(user_id);

-- reports 表索引
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON public.reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- ====================================
-- 8. 外键约束
-- ====================================

-- 注意：根据实际数据情况，可能需要手动添加外键
-- 以下外键约束在新数据库中可能需要根据数据完整性添加

-- ALTER TABLE public.logs ADD CONSTRAINT fk_logs_user_id 
--     FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

-- ALTER TABLE public.thoughts ADD CONSTRAINT fk_thoughts_user_id 
--     FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

-- ALTER TABLE public.background_images ADD CONSTRAINT fk_background_images_user_id 
--     FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

-- ALTER TABLE public.password_resets ADD CONSTRAINT fk_password_resets_user_id 
--     FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- ====================================
-- 导出完成
-- ====================================
