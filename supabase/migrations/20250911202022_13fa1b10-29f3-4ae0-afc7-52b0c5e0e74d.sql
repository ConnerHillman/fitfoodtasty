-- Remove all meals from the dinner category
UPDATE public.meals SET category = NULL WHERE category = 'dinner';