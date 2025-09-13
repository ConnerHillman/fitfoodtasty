-- Add order cut-off configuration to delivery zones
ALTER TABLE public.delivery_zones 
ADD COLUMN order_cutoffs JSONB DEFAULT '{}'::jsonb;

-- Add a comment to explain the structure
COMMENT ON COLUMN public.delivery_zones.order_cutoffs IS 'JSON object mapping delivery days to their cut-off times. Example: {"monday": {"cutoff_day": "friday", "cutoff_time": "23:59"}, "wednesday": {"cutoff_day": "sunday", "cutoff_time": "23:59"}}';

-- Create a function to get the next available delivery date based on cut-offs
CREATE OR REPLACE FUNCTION public.get_next_delivery_date(zone_id uuid, target_day text DEFAULT NULL)
RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  zone_record record;
  cutoff_config jsonb;
  cutoff_day text;
  cutoff_time time;
  current_datetime timestamp with time zone;
  target_delivery_date date;
  days_to_add integer;
  day_names text[] := ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  current_day_index integer;
  target_day_index integer;
BEGIN
  -- Get zone information
  SELECT * INTO zone_record FROM delivery_zones WHERE id = zone_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  current_datetime := now();
  
  -- If no target day specified, find the next available delivery day
  IF target_day IS NULL THEN
    -- Find the next delivery day from today
    FOR i IN 0..6 LOOP
      target_delivery_date := CURRENT_DATE + i;
      target_day := lower(to_char(target_delivery_date, 'day'));
      target_day := trim(target_day);
      
      -- Check if this day is in delivery_days
      IF target_day = ANY(zone_record.delivery_days) THEN
        -- Check if we can still order for this day
        cutoff_config := zone_record.order_cutoffs->target_day;
        
        IF cutoff_config IS NOT NULL THEN
          cutoff_day := cutoff_config->>'cutoff_day';
          cutoff_time := (cutoff_config->>'cutoff_time')::time;
          
          -- Calculate if we've passed the cutoff
          -- This is a simplified version - you might need more complex logic
          IF current_datetime::time <= cutoff_time THEN
            RETURN target_delivery_date;
          END IF;
        ELSE
          -- Fallback to old production_day_offset logic
          IF target_delivery_date >= CURRENT_DATE + COALESCE(ABS(zone_record.production_day_offset), 2) THEN
            RETURN target_delivery_date;
          END IF;
        END IF;
      END IF;
    END LOOP;
  ELSE
    -- Calculate next occurrence of target_day
    current_day_index := EXTRACT(dow FROM CURRENT_DATE);
    target_day_index := array_position(day_names, lower(target_day)) - 1;
    
    IF target_day_index IS NULL THEN
      RETURN NULL;
    END IF;
    
    days_to_add := target_day_index - current_day_index;
    IF days_to_add <= 0 THEN
      days_to_add := days_to_add + 7;
    END IF;
    
    target_delivery_date := CURRENT_DATE + days_to_add;
    
    -- Check cutoff
    cutoff_config := zone_record.order_cutoffs->lower(target_day);
    
    IF cutoff_config IS NOT NULL THEN
      cutoff_day := cutoff_config->>'cutoff_day';
      cutoff_time := (cutoff_config->>'cutoff_time')::time;
      
      -- Simple check - enhance this logic as needed
      RETURN target_delivery_date;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$function$;