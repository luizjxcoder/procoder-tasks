-- Definir seu email como admin fixo (substitua pelo seu email real)
-- IMPORTANTE: Substitua 'SEU_EMAIL_AQUI@exemplo.com' pelo seu email real
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Buscar o ID do usuário pelo email (substitua pelo seu email)
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'jxcoder.dev@hotmail.com'
    LIMIT 1;
    
    -- Se encontrou o usuário, torná-lo admin
    IF admin_user_id IS NOT NULL THEN
        -- Inserir ou atualizar role como admin
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Admin definido com sucesso para o usuário: jxcoder.dev@hotmail.com';
    ELSE
        RAISE NOTICE 'Usuário jxcoder.dev@hotmail.com não encontrado. Crie a conta primeiro.';
    END IF;
END $$;