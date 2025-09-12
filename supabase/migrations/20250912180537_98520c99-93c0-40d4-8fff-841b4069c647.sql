-- Fix duplicate turmeric ingredients
-- First, update all meal_ingredients that use the misspelled "Tumeric" to use the correct "Turmeric"
UPDATE public.meal_ingredients 
SET ingredient_id = '85852b36-17f5-4d2d-9f69-6f3f76049fa9'  -- Correct "Turmeric" ID
WHERE ingredient_id = '894a847a-5380-4aa6-bd54-9fd1b61b7b33';  -- Misspelled "Tumeric" ID

-- Also update any ingredient_allergens that might reference the misspelled version
UPDATE public.ingredient_allergens 
SET ingredient_id = '85852b36-17f5-4d2d-9f69-6f3f76049fa9'  -- Correct "Turmeric" ID
WHERE ingredient_id = '894a847a-5380-4aa6-bd54-9fd1b61b7b33';  -- Misspelled "Tumeric" ID

-- Now delete the misspelled ingredient
DELETE FROM public.ingredients 
WHERE id = '894a847a-5380-4aa6-bd54-9fd1b61b7b33';  -- Misspelled "Tumeric" ID