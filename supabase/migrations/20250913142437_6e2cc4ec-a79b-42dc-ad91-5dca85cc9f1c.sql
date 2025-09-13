-- Assign Veggie Omelette (BIG) to massive meals category
UPDATE public.meals 
SET 
  category = 'massive meals',
  updated_at = now()
WHERE name = 'Veggie Omelette (BIG)';

-- Delete the shawarma meal
DELETE FROM public.meals 
WHERE name = 'Chicken Shawarma with Quinoa & Roasted Vegetables  (Low calories)';

-- Log the results
DO $$
DECLARE
  updated_count INTEGER;
  deleted_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count 
  FROM public.meals 
  WHERE name = 'Veggie Omelette (BIG)' AND category = 'massive meals';
  
  -- Check if shawarma was deleted (should be 0 if successfully deleted)
  SELECT COUNT(*) INTO deleted_count 
  FROM public.meals 
  WHERE name ILIKE '%Chicken Shawarma%' AND name ILIKE '%Low calories%';
  
  RAISE NOTICE 'Updated % Veggie Omelette to massive meals, remaining shawarma meals: %', updated_count, deleted_count;
END $$;