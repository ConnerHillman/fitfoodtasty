-- Backfill existing meals with default storage and heating instructions
UPDATE public.meals 
SET 
  storage_instructions = 'Store in a refrigerator below 5°c. Heat in a microwave for 3–4 minutes or until piping hot.',
  heating_instructions = 'Pierce film and heat for 3-4 minutes or until piping hot.'
WHERE 
  storage_instructions IS NULL 
  OR heating_instructions IS NULL;