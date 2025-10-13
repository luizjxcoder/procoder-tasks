-- Criar bucket para armazenar backups
INSERT INTO storage.buckets (id, name, public) VALUES ('backups', 'backups', false);

-- Criar políticas de storage para backups (apenas admins)
CREATE POLICY "Admin can view backups" ON storage.objects
FOR SELECT USING (bucket_id = 'backups' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admin can upload backups" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'backups' AND auth.uid() IS NOT NULL);

-- Criar tabela para log de backups
CREATE TABLE public.backup_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('scheduled', 'triggered', 'manual')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'in_progress')),
  file_path TEXT,
  file_size BIGINT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS na tabela de logs
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

-- Política para visualizar logs de backup
CREATE POLICY "Users can view backup logs" ON public.backup_logs
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Política para inserir logs de backup (sistema)
CREATE POLICY "System can insert backup logs" ON public.backup_logs
FOR INSERT WITH CHECK (true);

-- Criar tabela para configurações de backup
CREATE TABLE public.backup_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  auto_backup_enabled BOOLEAN NOT NULL DEFAULT true,
  backup_frequency TEXT NOT NULL DEFAULT 'daily' CHECK (backup_frequency IN ('daily', 'weekly', 'monthly')),
  backup_on_changes BOOLEAN NOT NULL DEFAULT true,
  last_backup_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS na tabela de configurações
ALTER TABLE public.backup_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para configurações de backup
CREATE POLICY "Users can view their backup settings" ON public.backup_settings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their backup settings" ON public.backup_settings
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their backup settings" ON public.backup_settings
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_backup_settings_updated_at
BEFORE UPDATE ON public.backup_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();