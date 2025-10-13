-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Configurar cron job para backup diário às 2:00 AM
SELECT cron.schedule(
  'daily-auto-backup',
  '0 2 * * *', -- Todos os dias às 2:00 AM
  $$
  SELECT
    net.http_post(
        url:='https://zkawkkvlorphbdsoxoku.supabase.co/functions/v1/auto-backup',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprYXdra3Zsb3JwaGJkc294b2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNzM1ODEsImV4cCI6MjA3MTc0OTU4MX0.WyXyn7HlArYJ39Lg8l1dFQXtNPcPp8Rhy6pyUay11Zo"}'::jsonb,
        body:='{"backupType": "scheduled"}'::jsonb
    ) as request_id;
  $$
);

-- Criar função para trigger de backup automático
CREATE OR REPLACE FUNCTION public.trigger_auto_backup()
RETURNS TRIGGER AS $$
DECLARE
  backup_enabled BOOLEAN := false;
BEGIN
  -- Verificar se backup automático está habilitado
  SELECT backup_on_changes INTO backup_enabled
  FROM public.backup_settings
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
  LIMIT 1;

  -- Se backup está habilitado, enviar request para edge function
  IF backup_enabled THEN
    PERFORM net.http_post(
      url := 'https://zkawkkvlorphbdsoxoku.supabase.co/functions/v1/auto-backup',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprYXdra3Zsb3JwaGJkc294b2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNzM1ODEsImV4cCI6MjA3MTc0OTU4MX0.WyXyn7HlArYJ39Lg8l1dFQXtNPcPp8Rhy6pyUay11Zo"}'::jsonb,
      body := ('{"backupType": "triggered", "userId": "' || COALESCE(NEW.user_id, OLD.user_id) || '"}')::jsonb
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger na tabela backup_settings quando houver mudanças
CREATE TRIGGER backup_settings_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.backup_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_backup();