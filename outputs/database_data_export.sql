-- 认知界 数据库数据导出
-- 导出时间: 2026-06-02
-- 目标 Supabase: https://nbgsichilfrjsopnnvia.supabase.co

-- ====================================
-- 1. profiles 表数据 (2 行)
-- ====================================
INSERT INTO profiles (id, username, user_id, tag, slogan, location, is_public, is_hidden, is_admin, created_at, updated_at, display_id, onboarding_completed, account_status, geo_enabled, avatar_url, background_image, email, role, daily_posts_count, last_post_date, slogan_approved, is_frozen, frozen_at, frozen_reason, frozen_by, hide_status, hide_requested_at, cooling_ends_at, frozen_ends_at, hide_canceled_at, restored_at) VALUES
('2f79998b-908b-4a41-93a6-7c1d24d725de', '用户2f79998b', 'USER2F79998B000000000', '', '', '', true, false, false, '2026-05-31 17:40:20.853948', '2026-05-31 17:40:20.853948', 2, false, 'available', false, NULL, NULL, 'largetool@sina.com', 'user', 0, NULL, false, false, NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL),
('6204b4b8-32a2-4ae9-831e-067a57df396b', '一言超人', 'YIYANCHAOREN000000000', '心理咨询师，成长教练，认知界独立创始人', '我创造认知界，致力于打破个人信息孤岛和垄断，让每个普通人，用最便捷的方式，平等的拥有被世界看见，被世界连接的机会。', '中国 北京 延庆 延庆镇石河营西', true, false, true, '2026-05-28 10:52:04.881485', '2026-05-28 10:52:04.881485', 0, false, 'available', false, NULL, 'https://3015-01kt3zy4txam44n1n6v9f85b1y.sandbox.meoo.host/762c0945448fec934c25.jpg', 'largetool@qq.com', 'user', 0, NULL, true, false, NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL);

-- ====================================
-- 2. logs 表数据 (4 行)
-- ====================================
INSERT INTO logs (id, user_id, content, created_at, is_public, published_at) VALUES
('14e83868-7794-42bf-81a9-e99fc62554d5', 'YIYANCHAOREN000000000', '被推送？很多平台都有规则。\n问题是，这些规则往往不是直接写出来的。', '2026-05-31 22:26:49.750906', false, '2026-05-31 22:36:48.729+08'),
('31f500da-0614-4ef0-a6a1-e0c53f3c066e', 'YIYANCHAOREN000000000', '想获得更多曝光，就得去猜规则。 但猜规则这件事，本身就不容易。', '2026-05-31 22:48:11.644448', false, '2026-05-31 22:58:10.667+08'),
('e578d559-1a66-4e24-8bba-551eb81884b7', 'YIYANCHAOREN000000000', '当一个人开始研究什么能发、什么不能发的时候， 他表达的东西可能已经发生变化了。', '2026-05-31 22:48:35.009341', false, '2026-05-31 22:58:33.992+08'),
('e6f5a367-8295-4cbd-98f3-1d906e05a6e6', 'YIYANCHAOREN000000000', '有时候人们发布内容， 考虑的已经不是自己想说什么， 而是什么更容易被看见。', '2026-05-31 22:48:47.810277', false, '2026-05-31 22:58:46.814+08');

-- ====================================
-- 3. system_backgrounds 表数据 (10 行)
-- ====================================
INSERT INTO system_backgrounds (id, url, name, description, is_active, created_at) VALUES
('578f1e04-2b33-4691-afcb-ec1dbb5c2303', 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1920&q=80', '星空背景1', NULL, true, '2026-05-04 14:16:16.238464'),
('85641eaf-9a39-43f6-8058-36481d3c9e44', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80', '云层山脉', NULL, true, '2026-05-04 14:16:16.238464'),
('92426c03-f28f-42a0-8d5f-b63b092883aa', 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80', '白色波浪', NULL, true, '2026-05-04 14:16:16.238464'),
('266acb09-adc9-45ed-ae0f-071d9bb383fe', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80', '迷雾森林', NULL, true, '2026-05-04 14:16:16.238464'),
('f7beb009-f2db-4955-a1ea-782c5f7195da', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80', '层叠山峦', NULL, true, '2026-05-04 14:16:16.238464'),
('a036b3ee-c2e3-4093-9530-559255c8467d', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80', '白色建筑', NULL, true, '2026-05-04 14:16:16.238464'),
('89d28bb7-bd64-4aff-b35c-46cdc159c4f9', 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1920&q=80', '日落山丘', NULL, true, '2026-05-04 14:16:16.238464'),
('7dbfb97f-2a22-4164-af78-d978f92d0213', 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&q=80', '海洋地平线', NULL, true, '2026-05-04 14:16:16.238464'),
('597d1691-6d43-4bcd-9634-1d4264e3c2cf', 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80', '白色波浪2', NULL, true, '2026-05-04 14:16:16.238464'),
('697762ef-882d-4840-9eee-aa7e05bfb007', 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=80', '银河星系', NULL, true, '2026-05-04 14:16:16.238464');

-- ====================================
-- 4. system_config 表数据 (8 行)
-- ====================================
INSERT INTO system_config (id, key, value, created_at, updated_at) VALUES
(4, 'sitemap_mode', 'static', '2026-05-26 21:51:45.536998+08', '2026-05-26 21:51:45.536998+08'),
(5, 'daily_post_limit_user', '10', '2026-05-29 21:43:17.040477+08', '2026-05-29 21:43:17.040477+08'),
(6, 'daily_post_limit_verified', '10', '2026-05-29 21:43:17.040477+08', '2026-05-29 21:43:17.040477+08'),
(7, 'daily_post_limit_premium', '30', '2026-05-29 21:43:17.040477+08', '2026-05-29 21:43:17.040477+08'),
(1, 'global_message_board_enabled', 'true', '2026-05-26 20:36:03.85573+08', '2026-05-31 22:07:49.707+08'),
(2, 'message_rate_limit', '10', '2026-05-26 20:36:03.85573+08', '2026-05-31 22:07:51.213+08'),
(3, 'captcha_required', 'true', '2026-05-26 20:36:03.85573+08', '2026-05-31 22:07:51.642+08'),
(11, 'user_guestbook_enabled', 'false', '2026-06-01 21:15:10.231964+08', '2026-06-01 21:15:10.231964+08');

-- ====================================
-- 5. ip_blacklist 表数据 (15 行)
-- ====================================
INSERT INTO ip_blacklist (id, cidr, description, created_at) VALUES
('ddc47190-b089-4750-b1a6-fc1616388c98', '103.21.244.0/22', 'Cloudflare IP Range', '2026-05-03 08:13:52.617914'),
('bc618667-977d-4e97-9f66-a28e4f1b621a', '103.22.200.0/22', 'Cloudflare IP Range', '2026-05-03 08:13:52.617914'),
('931a55d5-ab98-4ecc-83f4-36c7203bbd74', '103.31.4.0/22', 'Cloudflare IP Range', '2026-05-03 08:13:52.617914'),
('6fdb6198-4ee2-47e0-b38f-018933762417', '104.16.0.0/13', 'Cloudflare IP Range', '2026-05-03 08:13:52.617914'),
('30a32db9-0996-455c-b863-92d479300144', '104.24.0.0/14', 'Cloudflare IP Range', '2026-05-03 08:13:52.617914'),
('7a8f297d-a284-4b41-8b4f-fad953858ab2', '108.162.192.0/18', 'Cloudflare IP Range', '2026-05-03 08:13:52.617914'),
('a6632f61-bd7a-47d7-86de-a67718127b1c', '131.0.72.0/22', 'Cloudflare IP Range', '2026-05-03 08:13:52.617914'),
('f01013d5-ddcf-43b7-8eff-5854b5c45772', '141.101.64.0/18', 'Cloudflare IP Range', '2026-05-03 08:13:52.617914'),
('31b57007-7a40-4c14-9b53-1341c9d386d3', '162.158.0.0/15', 'Cloudflare IP Range', '2026-05-03 08:13:52.617914'),
('2483301c-317b-4b25-844b-71b53a565c5f', '172.64.0.0/13', 'Cloudflare IP Range', '2026-05-03 08:13:52.617914'),
('f8da2196-a07d-4add-b145-aa551cad5915', '173.245.48.0/20', 'Cloudflare IP Range', '2026-05-03 08:13:52.617914'),
('e62267d7-edc4-41d3-9254-4cbe45ab40ee', '188.114.96.0/20', 'Cloudflare IP Range', '2026-05-03 08:13:52.617914'),
('40eec5d3-b082-4018-a85c-8b274615e4b0', '190.93.240.0/20', 'Cloudflare IP Range', '2026-05-03 08:13:52.617914'),
('bbeb928d-cf68-403a-a0c2-8983545bd221', '197.234.240.0/22', 'Cloudflare IP Range', '2026-05-03 08:13:52.617914'),
('3c844be2-e842-4f5c-a288-5a69a610359c', '198.41.128.0/17', 'Cloudflare IP Range', '2026-05-03 08:13:52.617914');

-- ====================================
-- 6. guestbook 表数据 (1 行)
-- ====================================
INSERT INTO guestbook (id, user_id, content, is_public, created_at, status, visible_after) VALUES
('6211825e-3466-44db-942e-2fcf993024e2', 'USER', '你好', true, '2026-05-26 20:45:26.593085+08', 'approved', '2026-05-26 20:45:26.593085+08');

-- ====================================
-- 7. daily_post_logs 表数据 (1 行)
-- ====================================
INSERT INTO daily_post_logs (id, user_id, post_date, post_count, created_at) VALUES
('04c1cbe1-4afb-4d7e-9ded-af7fee1f757a', 'YIYANCHAOREN000000000', '2026-05-31', 2, '2026-05-31 22:26:50.661205+08');

-- ====================================
-- 8. password_resets 表数据 (4 行)
-- ====================================
INSERT INTO password_resets (id, user_id, email, token, expires_at, used, created_at) VALUES
('900c97c0-083d-4d63-88a1-5544df0bc700', '2f79998b-908b-4a41-93a6-7c1d24d725de', 'largetool@sina.com', 'e9799e5f-89f5-4d5f-a5a8-19a752e695f7', '2026-05-31 10:49:46.011', false, '2026-05-31 17:49:47.022297'),
('7087c0e6-edf8-4b2e-983f-0563ebf5be71', '2f79998b-908b-4a41-93a6-7c1d24d725de', 'largetool@sina.com', '807bbb52-d572-4a24-b093-daedd49bec85', '2026-05-31 10:49:53.729', false, '2026-05-31 17:49:55.763923'),
('4842c08e-0a77-4623-a625-93a4d7653130', '2f79998b-908b-4a41-93a6-7c1d24d725de', 'largetool@sina.com', 'a9ebe8ff-f492-405f-a5bd-902c87266535', '2026-05-31 10:51:50.032', false, '2026-05-31 17:51:51.239196'),
('9179e307-8458-454b-8d6b-c631feebc8a6', '6204b4b8-32a2-4ae9-831e-067a57df396b', 'largetool@qq.com', '431ddc43-1dda-4c7b-a5b6-9c8c3e54f2ae', '2026-05-31 10:53:52.369', false, '2026-05-31 17:53:53.198283');

-- ====================================
-- 导出完成
-- 总数据量: 45 行
-- ====================================
