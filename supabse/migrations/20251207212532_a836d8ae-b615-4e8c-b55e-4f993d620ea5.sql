-- Create storage plan enum
CREATE TYPE public.storage_plan AS ENUM ('simples', 'pro', 'ultra');

-- Create storage quotas table
CREATE TABLE public.storage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  plan storage_plan NOT NULL DEFAULT 'simples',
  storage_used BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.storage_quotas ENABLE ROW LEVEL SECURITY;

-- Function to get storage limit based on plan (in bytes)
CREATE OR REPLACE FUNCTION public.get_storage_limit(p_plan storage_plan)
RETURNS BIGINT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE p_plan
    WHEN 'simples' THEN 104857600::BIGINT    -- 100 MB
    WHEN 'pro' THEN 524288000::BIGINT        -- 500 MB
    WHEN 'ultra' THEN 2147483648::BIGINT     -- 2 GB
    ELSE 104857600::BIGINT
  END;
$$;

-- Function to check if user can upload a file
CREATE OR REPLACE FUNCTION public.can_upload(p_user_id UUID, p_file_size BIGINT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT (sq.storage_used + p_file_size) <= public.get_storage_limit(sq.plan)
     FROM public.storage_quotas sq
     WHERE sq.user_id = p_user_id),
    true
  );
$$;

-- Function to update storage usage when files are added/removed
CREATE OR REPLACE FUNCTION public.update_storage_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.storage_quotas
    SET storage_used = storage_used + COALESCE((NEW.metadata->>'size')::bigint, 0),
        updated_at = now()
    WHERE user_id = NEW.owner;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.storage_quotas
    SET storage_used = GREATEST(0, storage_used - COALESCE((OLD.metadata->>'size')::bigint, 0)),
        updated_at = now()
    WHERE user_id = OLD.owner;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger on storage.objects
CREATE TRIGGER on_storage_object_change
  AFTER INSERT OR DELETE ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_storage_usage();

-- Update handle_new_user to create storage quota
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  -- Set default role as user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Create storage quota with default plan
  INSERT INTO public.storage_quotas (user_id, plan)
  VALUES (NEW.id, 'simples');
  
  RETURN NEW;
END;
$$;

-- RLS Policies for storage_quotas
CREATE POLICY "Admins can view all quotas"
ON public.storage_quotas
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all quotas"
ON public.storage_quotas
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own quota"
ON public.storage_quotas
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_storage_quotas_user_id ON public.storage_quotas(user_id);