-- Add priority column to delivery_zones table
ALTER TABLE public.delivery_zones 
ADD COLUMN priority integer DEFAULT 100;

-- Add index for better performance on priority queries
CREATE INDEX idx_delivery_zones_priority ON public.delivery_zones(priority, is_active);

-- Update priority for existing zones (lower number = higher priority)
-- Local/specific zones should have higher priority than broad coverage zones
UPDATE public.delivery_zones 
SET priority = 10 
WHERE zone_name ILIKE '%weston%' OR zone_name ILIKE '%bridgwater%' OR zone_name ILIKE '%burnham%';

UPDATE public.delivery_zones 
SET priority = 50 
WHERE zone_name ILIKE '%bristol%' AND zone_name NOT ILIKE '%sunday%';

UPDATE public.delivery_zones 
SET priority = 90 
WHERE zone_name ILIKE '%sunday%' OR zone_name ILIKE '%weekend%';

-- Create function to get delivery zone with priority-based matching
CREATE OR REPLACE FUNCTION public.get_delivery_zone_for_postcode_prioritized(customer_postcode text)
RETURNS TABLE(
  zone_id uuid,
  zone_name text,
  delivery_fee numeric,
  delivery_days text[],
  priority integer,
  match_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
      'exact'::text as match_type,
      1 as specificity_score
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
      'prefix'::text as match_type,
      2 as specificity_score
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
  ORDER BY specificity_score ASC, priority ASC, zone_name ASC;
END;
$$;

-- Create function to detect zone conflicts
CREATE OR REPLACE FUNCTION public.detect_zone_conflicts()
RETURNS TABLE(
  postcode text,
  zone_count bigint,
  zones text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH postcode_zones AS (
    SELECT 
      unnest(postcodes) as pc,
      zone_name,
      priority
    FROM delivery_zones 
    WHERE is_active = true
  ),
  postcode_conflicts AS (
    SELECT 
      pc as postcode,
      COUNT(*) as zone_count,
      string_agg(zone_name || ' (priority: ' || priority || ')', ', ' ORDER BY priority ASC) as zones
    FROM postcode_zones
    GROUP BY pc
    HAVING COUNT(*) > 1
  )
  SELECT * FROM postcode_conflicts
  ORDER BY zone_count DESC, postcode ASC;
END;
$$;