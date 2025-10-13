-- Criar bucket para imagens de projetos
INSERT INTO storage.buckets (id, name, public) VALUES ('project-images', 'project-images', true);

-- Políticas para o bucket project-images
CREATE POLICY "Usuários podem visualizar imagens de projetos"
ON storage.objects FOR SELECT 
USING (bucket_id = 'project-images');

CREATE POLICY "Usuários podem fazer upload de suas imagens de projetos"
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'project-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem atualizar suas imagens de projetos"
ON storage.objects FOR UPDATE 
USING (bucket_id = 'project-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem deletar suas imagens de projetos"
ON storage.objects FOR DELETE 
USING (bucket_id = 'project-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Adicionar coluna image_url na tabela projects
ALTER TABLE projects ADD COLUMN image_url TEXT;