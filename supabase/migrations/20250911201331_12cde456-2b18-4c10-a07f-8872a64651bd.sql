-- Remove all meals from the lunch category
UPDATE public.meals SET category = NULL WHERE category = 'lunch';