-- Add postcode prefix support to delivery zones
ALTER TABLE public.delivery_zones 
ADD COLUMN postcode_prefixes TEXT[] DEFAULT '{}';

-- Add comment to explain the feature
COMMENT ON COLUMN public.delivery_zones.postcode_prefixes IS 'Array of postcode prefixes (e.g., "TA", "SW1") that will match any postcode starting with these values';