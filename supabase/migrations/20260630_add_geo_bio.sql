-- 添加 geo_bio 字段，存储 AI 生成的用户简介
-- 用于批量 GEO 富化，减少 SSR 时重复调用 Agnes API
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS geo_bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS geo_tags TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS geo_updated_at TIMESTAMPTZ;
