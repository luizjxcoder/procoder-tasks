-- Add 'cancelled' to project_status enum
ALTER TYPE project_status ADD VALUE 'cancelled' AFTER 'on-hold';

-- Create backup_settings table referenced in Settings.tsx
CREATE TABLE IF NOT EXISTS public.backup_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_backup_enabled boolean DEFAULT false,
  backup_on_changes boolean DEFAULT true,
  backup_frequency text DEFAULT 'daily',
  last_backup_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT unique_user_backup_settings UNIQUE(user_id)
);

-- Create backup_logs table  
CREATE TABLE IF NOT EXISTS public.backup_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  backup_type text NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  file_size bigint,
  created_at timestamp with time zone DEFAULT now(),
  error_message text
);

-- Enable RLS on new tables
ALTER TABLE public.backup_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for backup_settings
CREATE POLICY "Users can view their own backup settings" 
ON public.backup_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own backup settings" 
ON public.backup_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backup settings" 
ON public.backup_settings FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for backup_logs
CREATE POLICY "Users can view their own backup logs" 
ON public.backup_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own backup logs" 
ON public.backup_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_backup_settings_user_id ON public.backup_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_logs_user_id ON public.backup_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_logs_created_at ON public.backup_logs(created_at);

-- Add triggers for timestamp updates
CREATE TRIGGER update_backup_settings_updated_at
BEFORE UPDATE ON public.backup_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();