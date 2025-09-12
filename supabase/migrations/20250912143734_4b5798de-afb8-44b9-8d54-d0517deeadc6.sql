-- Remove duplicate honey ingredient
-- Since "Honey (Rowse)" is not being used in any meals, we can safely delete it

DELETE FROM public.ingredients 
WHERE name = 'Honey (Rowse)' AND id = 'ebb85c2d-8cc5-4798-9ca6-dd81425cf1a7';