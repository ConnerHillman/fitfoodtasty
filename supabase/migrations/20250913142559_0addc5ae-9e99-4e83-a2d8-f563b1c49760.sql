-- Update all meals with NULL categories to appropriate categories
UPDATE public.meals 
SET 
  category = CASE 
    WHEN name ILIKE '%LowCal%' OR name ILIKE '%Low Cal%' OR name ILIKE '%(Low%' THEN '(lowcal)'
    WHEN name ILIKE '%Big %' OR name ILIKE '%BIG%' OR name ILIKE '% - 250g Carbs%' OR name ILIKE '%Extra Protein%' THEN 'massive meals'
    ELSE 'regular'
  END,
  updated_at = now()
WHERE category IS NULL;

-- Also fix any remaining empty string categories
UPDATE public.meals 
SET 
  category = CASE 
    WHEN name ILIKE '%LowCal%' OR name ILIKE '%Low Cal%' OR name ILIKE '%(Low%' THEN '(lowcal)'
    WHEN name ILIKE '%Big %' OR name ILIKE '%BIG%' OR name ILIKE '% - 250g Carbs%' OR name ILIKE '%Extra Protein%' THEN 'massive meals'
    ELSE 'regular'
  END,
  updated_at = now()
WHERE category = '';

-- Log the results
DO $$
DECLARE
  null_count INTEGER;
  empty_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM public.meals WHERE category IS NULL;
  SELECT COUNT(*) INTO empty_count FROM public.meals WHERE category = '';
  
  RAISE NOTICE 'Remaining NULL categories: %, empty categories: %', null_count, empty_count;
END $$;