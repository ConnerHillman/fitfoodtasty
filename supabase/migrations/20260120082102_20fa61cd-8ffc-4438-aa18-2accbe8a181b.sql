-- Drop production_date columns from orders table
ALTER TABLE public.orders DROP COLUMN IF EXISTS production_date;
ALTER TABLE public.orders DROP COLUMN IF EXISTS actual_production_date;

-- Drop production_date columns from package_orders table
ALTER TABLE public.package_orders DROP COLUMN IF EXISTS production_date;
ALTER TABLE public.package_orders DROP COLUMN IF EXISTS actual_production_date;

-- Drop production_date column from subscription_deliveries table
ALTER TABLE public.subscription_deliveries DROP COLUMN IF EXISTS production_date;

-- Drop the calculate_production_date function since it's no longer needed
DROP FUNCTION IF EXISTS public.calculate_production_date(date, uuid);