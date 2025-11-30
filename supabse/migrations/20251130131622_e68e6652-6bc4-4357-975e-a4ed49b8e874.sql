-- Criar cron job para backup automático diário (às 2:00 AM)
SELECT cron.schedule(
  'backup-automatic-daily',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://qgrwslhmamroajbeuyfq.supabase.co/functions/v1/auto-backup',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncndzbGhtYW1yb2FqYmV1eWZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDczNzAsImV4cCI6MjA3MzUyMzM3MH0.jlb8CqhBkYLBoeCe-CHmnBqdPS4PIKySVaHvMEpl5ZE"}'::jsonb,
        body:='{"backupType": "scheduled"}'::jsonb
    ) as request_id;
  $$
);

-- Criar cron job para processar backups pendentes (a cada hora)
SELECT cron.schedule(
  'backup-process-pending',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://qgrwslhmamroajbeuyfq.supabase.co/functions/v1/auto-backup',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncndzbGhtYW1yb2FqYmV1eWZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDczNzAsImV4cCI6MjA3MzUyMzM3MH0.jlb8CqhBkYLBoeCe-CHmnBqdPS4PIKySVaHvMEpl5ZE"}'::jsonb,
        body:='{"backupType": "triggered"}'::jsonb
    ) as request_id;
  $$
);