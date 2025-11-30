-- Criar bucket para logos dos usuários
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user-logos', 'user-logos', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']);

-- Adicionar coluna logo_url na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Políticas RLS para o bucket user-logos
CREATE POLICY "Usuários podem ver logos públicos"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-logos');

CREATE POLICY "Usuários podem fazer upload de seu próprio logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem atualizar seu próprio logo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem deletar seu próprio logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);