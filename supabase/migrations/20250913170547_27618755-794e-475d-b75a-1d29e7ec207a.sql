-- Add production and delivery date offset settings to delivery zones
ALTER TABLE public.delivery_zones 
ADD COLUMN production_day_offset integer DEFAULT -2,
ADD COLUMN allow_custom_dates boolean DEFAULT false,
ADD COLUMN production_notes text;

-- Add production and delivery dates to orders
ALTER TABLE public.orders 
ADD COLUMN actual_production_date date,
ADD COLUMN actual_delivery_date date;

-- Add production and delivery dates to package orders as well
ALTER TABLE public.package_orders 
ADD COLUMN actual_production_date date,
ADD COLUMN actual_delivery_date date;

-- Add a function to calculate production date based on delivery date and zone settings
CREATE OR REPLACE FUNCTION public.calculate_production_date(
  delivery_date date,
  zone_id uuid DEFAULT NULL
) RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  offset_days integer := -2; -- Default 2 days before
  zone_offset integer;
BEGIN
  -- Get the specific zone's offset if zone_id is provided
  IF zone_id IS NOT NULL THEN
    SELECT production_day_offset INTO zone_offset 
    FROM delivery_zones 
    WHERE id = zone_id;
    
    IF zone_offset IS NOT NULL THEN
      offset_days := zone_offset;
    END IF;
  END IF;
  
  -- Calculate production date
  RETURN delivery_date + (offset_days || ' days')::interval;
END;
$$;

-- Add a function to get the delivery zone for a postcode
CREATE OR REPLACE FUNCTION public.get_delivery_zone_for_postcode(
  customer_postcode text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  zone_id uuid;
  zone_record record;
BEGIN
  -- Clean the postcode
  customer_postcode := UPPER(TRIM(customer_postcode));
  
  -- First check exact postcode matches
  SELECT id INTO zone_id
  FROM delivery_zones 
  WHERE is_active = true 
  AND customer_postcode = ANY(postcodes)
  ORDER BY zone_name
  LIMIT 1;
  
  IF zone_id IS NOT NULL THEN
    RETURN zone_id;
  END IF;
  
  -- Then check prefix matches (longest first)
  FOR zone_record IN 
    SELECT id, postcode_prefixes
    FROM delivery_zones 
    WHERE is_active = true 
    AND postcode_prefixes IS NOT NULL 
    AND array_length(postcode_prefixes, 1) > 0
    ORDER BY array_length(postcode_prefixes, 1) DESC
  LOOP
    -- Check if any prefix matches
    IF EXISTS (
      SELECT 1 FROM unnest(zone_record.postcode_prefixes) AS prefix
      WHERE customer_postcode LIKE (prefix || '%')
    ) THEN
      RETURN zone_record.id;
    END IF;
  END LOOP;
  
  RETURN NULL;
END;
$$;

-- Add comments for documentation
COMMENT ON COLUMN delivery_zones.production_day_offset IS 'Number of days before delivery date to set production date (negative number means before)';
COMMENT ON COLUMN delivery_zones.allow_custom_dates IS 'Whether this zone allows manual override of production/delivery dates';
COMMENT ON COLUMN delivery_zones.production_notes IS 'Special notes for production planning for this zone';
COMMENT ON COLUMN orders.actual_production_date IS 'The actual date this order was/will be produced';
COMMENT ON COLUMN orders.actual_delivery_date IS 'The actual date this order was/will be delivered';
COMMENT ON COLUMN package_orders.actual_production_date IS 'The actual date this package order was/will be produced';
COMMENT ON COLUMN package_orders.actual_delivery_date IS 'The actual date this package order was/will be delivered';