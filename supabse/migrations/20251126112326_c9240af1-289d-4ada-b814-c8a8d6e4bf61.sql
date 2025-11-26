-- Create design_briefings table
CREATE TABLE public.design_briefings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  project_type TEXT NOT NULL,
  target_audience TEXT,
  design_inspiration TEXT,
  main_objective TEXT,
  brand_personality TEXT,
  conversion_goals JSONB DEFAULT '[]'::jsonb,
  color_palette JSONB DEFAULT '{}'::jsonb,
  typography_primary TEXT,
  typography_secondary TEXT,
  brand_voice TEXT,
  logo_url TEXT,
  brand_assets JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.design_briefings ENABLE ROW LEVEL SECURITY;

-- Create policies for design_briefings
CREATE POLICY "Users can view their own briefings"
ON public.design_briefings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own briefings"
ON public.design_briefings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own briefings"
ON public.design_briefings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own briefings"
ON public.design_briefings
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all briefings"
ON public.design_briefings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_design_briefings_updated_at
BEFORE UPDATE ON public.design_briefings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for design assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('design-assets', 'design-assets', true);

-- Create storage policies
CREATE POLICY "Users can view their own design assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'design-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own design assets"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'design-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own design assets"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'design-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own design assets"
ON storage.objects
FOR DELETE
USING (bucket_id = 'design-assets' AND auth.uid()::text = (storage.foldername(name))[1]);