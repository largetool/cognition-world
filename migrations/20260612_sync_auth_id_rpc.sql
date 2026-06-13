-- 修复版：用 PL/pgSQL 代替纯 SQL
CREATE OR REPLACE FUNCTION public.sync_my_auth_id()
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.profiles
  SET auth_user_id = auth.uid()
  WHERE auth_user_id IS NULL
    AND auth.uid() IS NOT NULL;
  RETURN FOUND;
END;
$$;
