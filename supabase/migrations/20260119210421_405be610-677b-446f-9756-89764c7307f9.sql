-- FIX: Reset all orders to delivery first, then ONLY mark collection for confident matches

-- Step 1: Reset ALL orders to delivery (clean slate)
UPDATE public.orders
SET fulfillment_method = 'delivery', collection_point_id = NULL;

UPDATE public.package_orders
SET fulfillment_method = 'delivery', collection_point_id = NULL;

-- Step 2: Now ONLY mark orders as collection where address CONFIDENTLY matches a collection point
-- Using a subquery to ensure proper matching

-- Backfill orders - exact address match only
UPDATE public.orders o
SET 
  fulfillment_method = 'collection',
  collection_point_id = matched.cp_id
FROM (
  SELECT o2.id as order_id, cp.id as cp_id
  FROM public.orders o2
  CROSS JOIN public.collection_points cp
  WHERE 
    -- Exact match on full address (case-insensitive, trimmed)
    LOWER(TRIM(o2.delivery_address)) = LOWER(TRIM(cp.address))
    OR LOWER(TRIM(o2.delivery_address)) = LOWER(TRIM(cp.address || ', ' || cp.city || ', ' || cp.postcode))
    -- Or exact match on point name
    OR LOWER(TRIM(o2.delivery_address)) = LOWER(TRIM(cp.point_name))
    -- Or starts with the collection point name AND contains the city
    OR (
      LOWER(o2.delivery_address) LIKE LOWER(cp.point_name) || '%'
      AND LOWER(o2.delivery_address) LIKE '%' || LOWER(cp.city) || '%'
    )
) matched
WHERE o.id = matched.order_id;

-- Backfill package_orders - exact address match only
UPDATE public.package_orders po
SET 
  fulfillment_method = 'collection',
  collection_point_id = matched.cp_id
FROM (
  SELECT po2.id as order_id, cp.id as cp_id
  FROM public.package_orders po2
  CROSS JOIN public.collection_points cp
  WHERE 
    LOWER(TRIM(po2.delivery_address)) = LOWER(TRIM(cp.address))
    OR LOWER(TRIM(po2.delivery_address)) = LOWER(TRIM(cp.address || ', ' || cp.city || ', ' || cp.postcode))
    OR LOWER(TRIM(po2.delivery_address)) = LOWER(TRIM(cp.point_name))
    OR (
      LOWER(po2.delivery_address) LIKE LOWER(cp.point_name) || '%'
      AND LOWER(po2.delivery_address) LIKE '%' || LOWER(cp.city) || '%'
    )
) matched
WHERE po.id = matched.order_id;