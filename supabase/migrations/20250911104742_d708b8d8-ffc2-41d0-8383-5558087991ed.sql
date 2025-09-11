-- Update packages with correct prices and meal counts
UPDATE public.packages SET 
  price = 42.00,
  updated_at = now()
WHERE meal_count = 5;

UPDATE public.packages SET 
  price = 78.00,
  updated_at = now()
WHERE meal_count = 10;

UPDATE public.packages SET 
  price = 110.00,
  updated_at = now()
WHERE meal_count = 15;

UPDATE public.packages SET 
  price = 140.00,
  updated_at = now()
WHERE meal_count = 20;