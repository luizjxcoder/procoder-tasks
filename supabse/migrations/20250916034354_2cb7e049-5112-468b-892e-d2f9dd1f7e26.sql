-- Create sales table
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_name TEXT NOT NULL,
  categories TEXT[] NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NULL,
  client_social_media TEXT NULL,
  business_name TEXT NULL,
  sale_value NUMERIC NOT NULL DEFAULT 0,
  sale_date DATE NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'partial', 'pending')),
  client_rating INTEGER NULL CHECK (client_rating >= 1 AND client_rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own sales"
ON public.sales FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sales"
ON public.sales FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales"
ON public.sales FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales"
ON public.sales FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all sales"
ON public.sales FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON public.sales(sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON public.sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_client_name ON public.sales(client_name);
-- GIN index for categories array search
CREATE INDEX IF NOT EXISTS idx_sales_categories ON public.sales USING GIN (categories);

-- Trigger for updated_at
DO $$ BEGIN
  CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;