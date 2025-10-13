-- Criar bucket para imagens de projetos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-images', 'project-images', true);

-- Políticas RLS para o bucket de imagens
CREATE POLICY "Users can view project images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'project-images');

CREATE POLICY "Users can upload project images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'project-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own project images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'project-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own project images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'project-images' AND auth.uid() IS NOT NULL);