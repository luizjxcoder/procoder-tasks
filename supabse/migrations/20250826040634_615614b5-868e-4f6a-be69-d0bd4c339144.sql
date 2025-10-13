-- Corrigir função trigger_auto_backup com search_path seguro
CREATE OR REPLACE FUNCTION public.trigger_auto_backup()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
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
$$;