-- ============================================
-- 授权 service_role 更新 reports 表
-- （批量审核需要）
-- ============================================

-- 给 service_role 授予 reports 表的 SELECT 和 UPDATE 权限
GRANT SELECT, UPDATE ON public.reports TO service_role;

-- 如果还需要对特定序列的权限（如果 reports 表使用了序列 ID）
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 验证
SELECT '✅ 授权完成' AS status;
