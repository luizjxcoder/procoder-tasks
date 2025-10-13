-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('paid', 'partial', 'pending');

-- Create sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_name TEXT NOT NULL,
  categories TEXT[] DEFAULT '{}',
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_social_media TEXT,
  business_name TEXT,
  sale_value DECIMAL(10,2) NOT NULL,
  sale_date DATE NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own sales" 
ON public.sales 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sales" 
ON public.sales 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales" 
ON public.sales 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales" 
ON public.sales 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sales_updated_at
BEFORE UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();