-- Add missing columns to notes table
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Add missing columns to projects table  
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS budget DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_tags ON public.notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_notes_is_favorite ON public.notes(is_favorite);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON public.projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_budget ON public.projects(budget);