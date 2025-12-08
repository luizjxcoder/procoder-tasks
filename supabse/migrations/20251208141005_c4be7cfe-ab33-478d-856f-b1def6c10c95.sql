-- Fix get_storage_limit function to set search_path
CREATE OR REPLACE FUNCTION public.get_storage_limit(p_plan storage_plan)
RETURNS bigint
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_plan
    WHEN 'simples' THEN 104857600::BIGINT    -- 100 MB
    WHEN 'pro' THEN 524288000::BIGINT        -- 500 MB
    WHEN 'ultra' THEN 2147483648::BIGINT     -- 2 GB
    ELSE 104857600::BIGINT
  END;
$$;