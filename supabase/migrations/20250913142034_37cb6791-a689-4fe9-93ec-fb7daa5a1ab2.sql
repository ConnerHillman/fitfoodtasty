-- Create the (Trojan) category
INSERT INTO public.categories (name, description, is_active, sort_order, color)
VALUES (
  '(Trojan)', 
  'Legacy Trojan meal variants', 
  true, 
  999, 
  '#6b7280'
) ON CONFLICT (name) DO NOTHING;

-- Update all meals with "(Trojan)" in the name
UPDATE public.meals 
SET 
  category = '(Trojan)',
  is_active = false,
  updated_at = now()
WHERE name ILIKE '%(Trojan)%';

-- Log the results
DO $$
DECLARE
  meal_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO meal_count 
  FROM public.meals 
  WHERE category = '(Trojan)';
  
  RAISE NOTICE 'Created (Trojan) category and updated % meals', meal_count;
END $$;