# Sistema de Administração - CODERTASKS

Este documento explica como configurar e usar o sistema de administração do CODERTASKS.

## Configuração Inicial

### 1. Definir Admin Principal

O sistema está configurado para definir automaticamente `jxcoder.dev@hotmail.com` como administrador principal. 

**Para alterar o admin principal:**

1. Acesse o [SQL Editor do Supabase](https://supabase.com/dashboard/project/qgrwslhmamroajbeuyfq/sql/new)
2. Execute o seguinte comando SQL (substitua pelo seu email):

```sql
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Buscar o ID do usuário pelo email (substitua pelo seu email)
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'SEU_EMAIL_AQUI@exemplo.com'
    LIMIT 1;
    
    -- Se encontrou o usuário, torná-lo admin
    IF admin_user_id IS NOT NULL THEN
        -- Inserir ou atualizar role como admin
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Admin definido com sucesso para o usuário: SEU_EMAIL_AQUI@exemplo.com';
    ELSE
        RAISE NOTICE 'Usuário SEU_EMAIL_AQUI@exemplo.com não encontrado. Crie a conta primeiro.';
    END IF;
END $$;
```

### 2. Configurar Proteção de Senha

Para maior segurança, habilite a proteção contra senhas vazadas:

1. Acesse [Authentication > Password Security](https://supabase.com/dashboard/project/qgrwslhmamroajbeuyfq/auth/password-security)
2. Ative "Leaked Password Protection"

### 3. Configurar URLs de Redirecionamento

Configure as URLs no Supabase:

1. Acesse [Authentication > URL Configuration](https://supabase.com/dashboard/project/qgrwslhmamroajbeuyfq/auth/url-configuration)
2. Defina:
   - **Site URL**: URL da sua aplicação (preview ou produção)
   - **Redirect URLs**: Adicione todas as URLs onde o app será acessado

## Como Funciona

### Autenticação Restrita

- ✅ **Apenas login**: Usuários só podem fazer login, não podem se cadastrar
- ✅ **Admin cria contas**: Somente administradores podem criar novas contas
- ✅ **Roles automáticas**: Novos usuários recebem role "user" por padrão
- ✅ **Admin fixo**: O email configurado sempre será admin

### Permissões

**Usuários Comuns:**
- Acesso a todas as funcionalidades do sistema
- Podem ver apenas seus próprios dados
- Não podem criar outras contas

**Administradores:**
- Todos os privilégios de usuário comum
- Acesso à página "Usuários" na sidebar
- Podem criar contas para outros usuários
- Podem definir novos administradores
- Podem ver dados de todos os usuários

## Gerenciamento de Usuários

### Criando Usuários

1. Faça login como administrador
2. Acesse "Usuários" na sidebar
3. Clique em "Criar Usuário"
4. Preencha os dados:
   - Email (será o login)
   - Senha (mínimo 6 caracteres)
   - Nome completo
   - Papel (Usuário ou Administrador)

### Primeiro Acesso

Quando você criar uma conta para alguém:

1. Informe ao usuário o email e senha definidos
2. O usuário deve acessar `/auth` para fazer login
3. Recomende que alterem a senha no primeiro acesso

## Segurança

### RLS (Row Level Security)

- ✅ Todas as tabelas têm RLS habilitada
- ✅ Usuários só veem seus próprios dados
- ✅ Admins têm acesso elevado quando necessário
- ✅ Políticas impedem acesso não autorizado

### Validações

- ✅ Apenas admins podem criar usuários
- ✅ Tokens JWT validados em todas as operações
- ✅ Funções de segurança com SECURITY DEFINER
- ✅ Search path protegido contra ataques

## Monitoramento

### Logs de Autenticação

Monitore a atividade do sistema:

1. [Authentication Logs](https://supabase.com/dashboard/project/qgrwslhmamroajbeuyfq/auth/users)
2. [Edge Function Logs](https://supabase.com/dashboard/project/qgrwslhmamroajbeuyfq/functions/create-user/logs)

### Usuários Ativos

Verifique usuários na página de administração ou diretamente no:
[Supabase Users](https://supabase.com/dashboard/project/qgrwslhmamroajbeuyfq/auth/users)

## Troubleshooting

### Erro "Insufficient permissions"
- Verifique se você está logado como admin
- Confirme se seu email foi configurado como admin no banco

### Erro "Invalid credentials"
- Verifique email e senha
- Confirme se a conta foi criada corretamente

### Problema de redirecionamento
- Verifique as URLs configuradas no Supabase
- Confirme se está usando HTTPS em produção

### Não aparece menu "Usuários"
- Faça logout e login novamente
- Verifique se você tem role "admin" no banco de dados

## Contato

Para dúvidas técnicas sobre o sistema, entre em contato com o desenvolvedor.

## FLUXO PUBLICAR GITHUB PAGES:

npm run build        # gera o dist atualizado**
git add .
git commit -m "ajuste fonte modo claro"
git push origin master   # envia o código-fonte atualizado
npm run deploy           # publica o dist no branch gh-pages


