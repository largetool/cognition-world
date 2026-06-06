-- 添加日志标签字段（选填，逗号分隔的标签列表）
-- 用于 GEO 优化：标签作为 JSON-LD about 字段，帮助 AI 理解日志主题
ALTER TABLE IF EXISTS public.logs
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.logs.tags IS '用户自选标签（数组），选填，用于 GEO 优化和内容分类';
