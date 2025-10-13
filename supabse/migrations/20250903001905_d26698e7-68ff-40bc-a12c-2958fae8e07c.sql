-- Create storage bucket for project images
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for project images bucket
-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload project images to own folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'project-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view all project images (public bucket)
CREATE POLICY "Project images are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'project-images');

-- Allow users to update their own project images
CREATE POLICY "Users can update their own project images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'project-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own project images
CREATE POLICY "Users can delete their own project images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'project-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);