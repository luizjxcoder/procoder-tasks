
-- Criar cota de armazenamento para o administrador com plano ultra
INSERT INTO public.storage_quotas (user_id, plan, storage_used)
VALUES ('874497b2-c137-4f3c-a99e-e7c0d0786f8e', 'ultra', 0)
ON CONFLICT (user_id) DO NOTHING;
