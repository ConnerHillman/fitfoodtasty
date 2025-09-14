-- Create coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_percentage NUMERIC NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for authenticated users to read coupons
CREATE POLICY "Authenticated users can view active coupons" 
ON public.coupons 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND active = true);

-- Insert test coupon
INSERT INTO public.coupons (code, discount_percentage, active)
VALUES ('TEST100', 100, true);