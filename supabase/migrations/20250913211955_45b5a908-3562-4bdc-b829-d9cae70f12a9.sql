-- Add business hour overrides to delivery zones
ALTER TABLE public.delivery_zones 
ADD COLUMN business_hours_override jsonb DEFAULT NULL;

-- Add sample override for nationwide zone (assuming it exists)
-- This shows Tuesday as open while global might be closed
UPDATE public.delivery_zones 
SET business_hours_override = '{
  "tuesday": {"is_open": true, "override_reason": "Delivery day for nationwide customers"}
}'
WHERE zone_name ILIKE '%national%' 
AND business_hours_override IS NULL;