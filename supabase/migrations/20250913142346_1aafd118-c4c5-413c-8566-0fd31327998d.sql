-- Update meals without BIG or LowCal to "regular" category
UPDATE public.meals 
SET 
  category = 'regular',
  updated_at = now()
WHERE (
  category IS NULL 
  OR category = '' 
  OR category = 'uncategorized'
  OR category = 'all meals (regular size)'
  OR NOT EXISTS (SELECT 1 FROM categories c WHERE c.name = category AND c.is_active = true)
)
AND category != 'unassigned' 
AND category != '(Trojan)'
AND name NOT ILIKE '%BIG%'
AND name NOT ILIKE '%LowCal%'
AND name NOT ILIKE '%Low calories%';

-- Log the results for meals that were updated
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count 
  FROM public.meals 
  WHERE category = 'regular' AND updated_at >= now() - interval '5 seconds';
  
  RAISE NOTICE 'Updated % meals to "regular" category', updated_count;
END $$;