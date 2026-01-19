-- Step 1: Backfill existing orders with CONFIDENT matching only
-- Match orders where delivery_address exactly matches a collection point address or name

-- Backfill orders table
UPDATE public.orders o
SET 
  fulfillment_method = 'collection',
  collection_point_id = cp.id
FROM public.collection_points cp
WHERE o.fulfillment_method IS NULL OR o.fulfillment_method = 'delivery'
AND o.collection_point_id IS NULL
AND o.delivery_address IS NOT NULL
AND (
  -- Exact match on address (case-insensitive, trimmed)
  LOWER(TRIM(o.delivery_address)) = LOWER(TRIM(cp.address))
  OR LOWER(TRIM(o.delivery_address)) = LOWER(TRIM(cp.point_name))
  -- Or address contains both the point name AND city (high confidence)
  OR (
    LOWER(o.delivery_address) LIKE '%' || LOWER(cp.point_name) || '%'
    AND LOWER(o.delivery_address) LIKE '%' || LOWER(cp.city) || '%'
  )
);

-- Backfill package_orders table
UPDATE public.package_orders po
SET 
  fulfillment_method = 'collection',
  collection_point_id = cp.id
FROM public.collection_points cp
WHERE po.fulfillment_method IS NULL OR po.fulfillment_method = 'delivery'
AND po.collection_point_id IS NULL
AND po.delivery_address IS NOT NULL
AND (
  LOWER(TRIM(po.delivery_address)) = LOWER(TRIM(cp.address))
  OR LOWER(TRIM(po.delivery_address)) = LOWER(TRIM(cp.point_name))
  OR (
    LOWER(po.delivery_address) LIKE '%' || LOWER(cp.point_name) || '%'
    AND LOWER(po.delivery_address) LIKE '%' || LOWER(cp.city) || '%'
  )
);

-- Step 2: Create normalization function for fulfillment_method
CREATE OR REPLACE FUNCTION public.normalize_fulfillment_method()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize "pickup" -> "collection"
  IF NEW.fulfillment_method IS NOT NULL THEN
    NEW.fulfillment_method := LOWER(TRIM(NEW.fulfillment_method));
    IF NEW.fulfillment_method = 'pickup' THEN
      NEW.fulfillment_method := 'collection';
    END IF;
  END IF;
  
  -- Default to 'delivery' if null
  IF NEW.fulfillment_method IS NULL THEN
    NEW.fulfillment_method := 'delivery';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 3: Create validation function
CREATE OR REPLACE FUNCTION public.validate_fulfillment_method()
RETURNS TRIGGER AS $$
BEGIN
  -- If collection, collection_point_id must be present
  IF NEW.fulfillment_method = 'collection' AND NEW.collection_point_id IS NULL THEN
    RAISE EXCEPTION 'collection_point_id is required when fulfillment_method is collection';
  END IF;
  
  -- If delivery, collection_point_id should be null (clean up if set incorrectly)
  IF NEW.fulfillment_method = 'delivery' AND NEW.collection_point_id IS NOT NULL THEN
    NEW.collection_point_id := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 4: Apply triggers to orders table
DROP TRIGGER IF EXISTS normalize_orders_fulfillment ON public.orders;
CREATE TRIGGER normalize_orders_fulfillment
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_fulfillment_method();

DROP TRIGGER IF EXISTS validate_orders_fulfillment ON public.orders;
CREATE TRIGGER validate_orders_fulfillment
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_fulfillment_method();

-- Step 5: Apply triggers to package_orders table
DROP TRIGGER IF EXISTS normalize_package_orders_fulfillment ON public.package_orders;
CREATE TRIGGER normalize_package_orders_fulfillment
  BEFORE INSERT OR UPDATE ON public.package_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_fulfillment_method();

DROP TRIGGER IF EXISTS validate_package_orders_fulfillment ON public.package_orders;
CREATE TRIGGER validate_package_orders_fulfillment
  BEFORE INSERT OR UPDATE ON public.package_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_fulfillment_method();