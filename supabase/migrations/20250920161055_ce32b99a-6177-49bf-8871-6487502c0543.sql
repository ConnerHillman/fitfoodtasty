-- Fix the get_delivery_zone_for_postcode_prioritized function column mismatch
CREATE OR REPLACE FUNCTION public.get_delivery_zone_for_postcode_prioritized(customer_postcode text)
 RETURNS TABLE(zone_id uuid, zone_name text, delivery_fee numeric, delivery_days text[], priority integer, match_type text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  zone_record record;
  cleaned_postcode text;
BEGIN
  -- Clean the postcode
  cleaned_postcode := UPPER(TRIM(customer_postcode));
  
  -- Return all matching zones with priority and match type
  RETURN QUERY
  WITH exact_matches AS (
    SELECT 
      dz.id as zone_id,
      dz.zone_name,
      dz.delivery_fee,
      dz.delivery_days,
      dz.priority,
      'exact'::text as match_type
    FROM delivery_zones dz
    WHERE dz.is_active = true 
    AND cleaned_postcode = ANY(dz.postcodes)
  ),
  prefix_matches AS (
    SELECT 
      dz.id as zone_id,
      dz.zone_name,
      dz.delivery_fee,
      dz.delivery_days,
      dz.priority,
      'prefix'::text as match_type
    FROM delivery_zones dz
    WHERE dz.is_active = true 
    AND dz.postcode_prefixes IS NOT NULL 
    AND array_length(dz.postcode_prefixes, 1) > 0
    AND EXISTS (
      SELECT 1 FROM unnest(dz.postcode_prefixes) AS prefix
      WHERE cleaned_postcode LIKE (prefix || '%')
    )
    -- Only include if no exact match exists
    AND NOT EXISTS (SELECT 1 FROM exact_matches)
  )
  SELECT * FROM exact_matches
  UNION ALL
  SELECT * FROM prefix_matches
  ORDER BY priority ASC, zone_name ASC;
END;
$function$