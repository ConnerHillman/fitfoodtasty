-- Step 1: Add fulfillment columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS fulfillment_method text DEFAULT 'delivery' CHECK (fulfillment_method IN ('delivery', 'collection')),
ADD COLUMN IF NOT EXISTS collection_point_id uuid REFERENCES public.collection_points(id),
ADD COLUMN IF NOT EXISTS delivery_zone_id uuid REFERENCES public.delivery_zones(id);

-- Step 2: Add fulfillment columns to package_orders table
ALTER TABLE public.package_orders 
ADD COLUMN IF NOT EXISTS fulfillment_method text DEFAULT 'delivery' CHECK (fulfillment_method IN ('delivery', 'collection')),
ADD COLUMN IF NOT EXISTS collection_point_id uuid REFERENCES public.collection_points(id),
ADD COLUMN IF NOT EXISTS delivery_zone_id uuid REFERENCES public.delivery_zones(id);

-- Step 3: Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_method ON public.orders(fulfillment_method);
CREATE INDEX IF NOT EXISTS idx_orders_collection_point_id ON public.orders(collection_point_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_zone_id ON public.orders(delivery_zone_id);

CREATE INDEX IF NOT EXISTS idx_package_orders_fulfillment_method ON public.package_orders(fulfillment_method);
CREATE INDEX IF NOT EXISTS idx_package_orders_collection_point_id ON public.package_orders(collection_point_id);
CREATE INDEX IF NOT EXISTS idx_package_orders_delivery_zone_id ON public.package_orders(delivery_zone_id);

-- Step 4: Add comments for documentation
COMMENT ON COLUMN public.orders.fulfillment_method IS 'Explicit fulfillment method: delivery or collection';
COMMENT ON COLUMN public.orders.collection_point_id IS 'Reference to collection point if fulfillment_method is collection';
COMMENT ON COLUMN public.orders.delivery_zone_id IS 'Reference to delivery zone if fulfillment_method is delivery';

COMMENT ON COLUMN public.package_orders.fulfillment_method IS 'Explicit fulfillment method: delivery or collection';
COMMENT ON COLUMN public.package_orders.collection_point_id IS 'Reference to collection point if fulfillment_method is collection';
COMMENT ON COLUMN public.package_orders.delivery_zone_id IS 'Reference to delivery zone if fulfillment_method is delivery';