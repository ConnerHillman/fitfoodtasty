-- Add new columns to support multiple discount types
ALTER TABLE public.coupons 
ADD COLUMN discount_amount NUMERIC DEFAULT NULL,
ADD COLUMN free_delivery BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN free_item_id UUID DEFAULT NULL,
ADD COLUMN min_order_value NUMERIC DEFAULT NULL;

-- Add foreign key constraint for free_item_id referencing meals table
ALTER TABLE public.coupons 
ADD CONSTRAINT fk_coupons_free_item 
FOREIGN KEY (free_item_id) REFERENCES public.meals(id) ON DELETE SET NULL;

-- Update RLS policies to ensure admins have full access
DROP POLICY IF EXISTS "Admins can manage all coupons" ON public.coupons;
DROP POLICY IF EXISTS "Authenticated users can view active coupons" ON public.coupons;

-- Create comprehensive admin policies for all operations
CREATE POLICY "Admins can select all coupons" 
ON public.coupons 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert coupons" 
ON public.coupons 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all coupons" 
ON public.coupons 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all coupons" 
ON public.coupons 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow authenticated users to view active coupons for validation
CREATE POLICY "Authenticated users can view active coupons" 
ON public.coupons 
FOR SELECT 
USING ((auth.uid() IS NOT NULL) AND (active = true));