-- Add coupon metadata columns to orders table
ALTER TABLE public.orders 
ADD COLUMN coupon_type text,
ADD COLUMN coupon_discount_percentage numeric,
ADD COLUMN coupon_discount_amount numeric,
ADD COLUMN coupon_free_delivery boolean DEFAULT false,
ADD COLUMN coupon_free_item_id uuid;