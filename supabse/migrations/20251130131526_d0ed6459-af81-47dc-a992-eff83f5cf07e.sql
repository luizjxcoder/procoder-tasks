-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Função para verificar se backup em mudanças está habilitado
CREATE OR REPLACE FUNCTION public.should_trigger_backup()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  backup_enabled BOOLEAN;
BEGIN
  SELECT backup_on_changes INTO backup_enabled
  FROM public.backup_settings
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(backup_enabled, false);
END;
$$;

-- Função para acionar backup após mudanças
CREATE OR REPLACE FUNCTION public.trigger_backup_on_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verifica se o backup em mudanças está habilitado para o usuário
  IF public.should_trigger_backup() THEN
    -- Registra que uma mudança ocorreu (o cron job verá isso)
    INSERT INTO public.backup_logs (user_id, backup_type, status)
    VALUES (
      COALESCE(NEW.user_id, OLD.user_id),
      'triggered',
      'pending'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Criar triggers para todas as tabelas principais
DROP TRIGGER IF EXISTS trigger_backup_tasks ON public.tasks;
CREATE TRIGGER trigger_backup_tasks
AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.trigger_backup_on_change();

DROP TRIGGER IF EXISTS trigger_backup_projects ON public.projects;
CREATE TRIGGER trigger_backup_projects
AFTER INSERT OR UPDATE OR DELETE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.trigger_backup_on_change();

DROP TRIGGER IF EXISTS trigger_backup_customers ON public.customers;
CREATE TRIGGER trigger_backup_customers
AFTER INSERT OR UPDATE OR DELETE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.trigger_backup_on_change();

DROP TRIGGER IF EXISTS trigger_backup_sales ON public.sales;
CREATE TRIGGER trigger_backup_sales
AFTER INSERT OR UPDATE OR DELETE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.trigger_backup_on_change();

DROP TRIGGER IF EXISTS trigger_backup_briefings ON public.design_briefings;
CREATE TRIGGER trigger_backup_briefings
AFTER INSERT OR UPDATE OR DELETE ON public.design_briefings
FOR EACH ROW
EXECUTE FUNCTION public.trigger_backup_on_change();

DROP TRIGGER IF EXISTS trigger_backup_notes ON public.notes;
CREATE TRIGGER trigger_backup_notes
AFTER INSERT OR UPDATE OR DELETE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.trigger_backup_on_change();