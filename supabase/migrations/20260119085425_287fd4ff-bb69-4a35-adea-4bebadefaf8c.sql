-- Add private_note column to orders table (admin-only notes)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS private_note text;

-- Add private_note column to package_orders table (admin-only notes)
ALTER TABLE public.package_orders 
ADD COLUMN IF NOT EXISTS private_note text;

-- Add comments for documentation
COMMENT ON COLUMN public.orders.order_notes IS 'Customer-facing notes entered at checkout, included in emails and visible to customer';
COMMENT ON COLUMN public.orders.private_note IS 'Admin-only internal notes, never exposed to customers or included in emails';
COMMENT ON COLUMN public.package_orders.order_notes IS 'Customer-facing notes entered at checkout, included in emails and visible to customer';
COMMENT ON COLUMN public.package_orders.private_note IS 'Admin-only internal notes, never exposed to customers or included in emails';