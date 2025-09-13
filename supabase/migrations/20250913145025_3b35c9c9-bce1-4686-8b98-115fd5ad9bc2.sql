-- Add shelf life tracking to meals (mandatory field, default 5 days)
ALTER TABLE public.meals 
ADD COLUMN shelf_life_days INTEGER NOT NULL DEFAULT 5;

-- Add delivery and production date tracking to orders
ALTER TABLE public.orders 
ADD COLUMN requested_delivery_date DATE,
ADD COLUMN production_date DATE;

-- Add delivery and production date tracking to package orders  
ALTER TABLE public.package_orders
ADD COLUMN requested_delivery_date DATE,
ADD COLUMN production_date DATE;

-- Add comment to document the shelf_life_days field
COMMENT ON COLUMN public.meals.shelf_life_days IS 'Number of days the meal stays fresh after production date';