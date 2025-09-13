-- Separate order cutoffs from production scheduling
-- Add dedicated production scheduling settings
ALTER TABLE delivery_zones 
ADD COLUMN IF NOT EXISTS production_lead_days integer DEFAULT 2,
ADD COLUMN IF NOT EXISTS production_same_day boolean DEFAULT false;

-- Update comments to clarify the distinction
COMMENT ON COLUMN delivery_zones.order_cutoffs IS 'Customer-facing order deadlines per delivery day';
COMMENT ON COLUMN delivery_zones.production_lead_days IS 'Days before delivery that production must start (kitchen scheduling)';
COMMENT ON COLUMN delivery_zones.production_same_day IS 'Whether this zone allows same-day production';
COMMENT ON COLUMN delivery_zones.production_day_offset IS 'DEPRECATED: Use production_lead_days instead';

-- Update the production date calculation function to use the new fields
CREATE OR REPLACE FUNCTION public.calculate_production_date(delivery_date date, zone_id uuid DEFAULT NULL::uuid)
RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  lead_days integer := 2; -- Default 2 days before
  same_day_allowed boolean := false;
  zone_record record;
BEGIN
  -- Get the specific zone's production settings if zone_id is provided
  IF zone_id IS NOT NULL THEN
    SELECT production_lead_days, production_same_day 
    INTO lead_days, same_day_allowed
    FROM delivery_zones 
    WHERE id = zone_id;
    
    -- Fall back to legacy production_day_offset if new fields not set
    IF lead_days IS NULL THEN
      SELECT ABS(COALESCE(production_day_offset, 2)) INTO lead_days
      FROM delivery_zones 
      WHERE id = zone_id;
    END IF;
  END IF;
  
  -- For same-day production zones, production date equals delivery date
  IF same_day_allowed THEN
    RETURN delivery_date;
  END IF;
  
  -- Calculate production date by subtracting lead days
  RETURN delivery_date - (lead_days || ' days')::interval;
END;
$function$;