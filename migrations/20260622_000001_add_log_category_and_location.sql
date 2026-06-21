-- ============================================
-- 为 logs 表添加分类（经历/现在/将来）和地理标签
-- 时间：2026-06-22
-- ============================================

ALTER TABLE public.logs
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS location  TEXT DEFAULT NULL;

-- 加注释说明
COMMENT ON COLUMN public.logs.category  IS '日志分类：experience(经历) / present(现在) / future(将来)';
COMMENT ON COLUMN public.logs.location  IS '用户标注的地理位置（城市/区域名称）';

-- 索引：按分类筛选加速
CREATE INDEX IF NOT EXISTS idx_logs_category ON public.logs(category);
-- 索引：按地理位置查询（如"上海"的人写了什么）
CREATE INDEX IF NOT EXISTS idx_logs_location ON public.logs(location);
