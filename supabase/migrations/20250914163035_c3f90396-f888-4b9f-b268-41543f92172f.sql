-- Check if columns exist and add only missing ones
DO $$
BEGIN
    -- Add discount_amount if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'coupons' 
        AND column_name = 'discount_amount'
    ) THEN
        ALTER TABLE public.coupons ADD COLUMN discount_amount NUMERIC DEFAULT NULL;
    END IF;

    -- Add free_delivery if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'coupons' 
        AND column_name = 'free_delivery'
    ) THEN
        ALTER TABLE public.coupons ADD COLUMN free_delivery BOOLEAN DEFAULT FALSE NOT NULL;
    END IF;

    -- Add free_item_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'coupons' 
        AND column_name = 'free_item_id'
    ) THEN
        ALTER TABLE public.coupons ADD COLUMN free_item_id UUID DEFAULT NULL;
    END IF;

    -- Add min_order_value if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'coupons' 
        AND column_name = 'min_order_value'
    ) THEN
        ALTER TABLE public.coupons ADD COLUMN min_order_value NUMERIC DEFAULT NULL;
    END IF;
END $$;

-- Add foreign key constraint for free_item_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'coupons' 
        AND constraint_name = 'fk_coupons_free_item'
    ) THEN
        ALTER TABLE public.coupons 
        ADD CONSTRAINT fk_coupons_free_item 
        FOREIGN KEY (free_item_id) REFERENCES public.meals(id) ON DELETE SET NULL;
    END IF;
END $$;

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