-- 外站链接功能：为 profiles 表添加 external_links 列
-- 数据结构：JSONB 数组，格式为 [{ "platform": "zhihu", "url": "https://..." }]
-- 运行方式：在 Supabase SQL Editor 中执行

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS external_links JSONB DEFAULT '[]'::jsonb;
