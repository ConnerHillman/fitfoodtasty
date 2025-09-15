-- Consolidate storage and heating instructions in saved_meal_labels table
-- Add the new consolidated field
ALTER TABLE public.saved_meal_labels 
ADD COLUMN storage_heating_instructions TEXT;

-- Update existing data to consolidate the instructions
UPDATE public.saved_meal_labels 
SET storage_heating_instructions = CASE 
  WHEN storage_instructions IS NOT NULL AND heating_instructions IS NOT NULL THEN 
    storage_instructions || ' ' || heating_instructions
  WHEN storage_instructions IS NOT NULL THEN 
    storage_instructions
  WHEN heating_instructions IS NOT NULL THEN 
    heating_instructions
  ELSE 
    'Store in a refrigerator below 5°c. Heat in a microwave for 3–4 minutes or until piping hot.'
END;

-- Make the new field NOT NULL with a default
ALTER TABLE public.saved_meal_labels 
ALTER COLUMN storage_heating_instructions SET NOT NULL;

ALTER TABLE public.saved_meal_labels 
ALTER COLUMN storage_heating_instructions SET DEFAULT 'Store in a refrigerator below 5°c. Heat in a microwave for 3–4 minutes or until piping hot.';

-- Add character length constraint
ALTER TABLE public.saved_meal_labels 
ADD CONSTRAINT storage_heating_instructions_length CHECK (char_length(storage_heating_instructions) <= 200);

-- Remove the old columns (keeping them for now for backwards compatibility)
-- We'll remove these in a future migration after confirming everything works
-- ALTER TABLE public.saved_meal_labels DROP COLUMN storage_instructions;
-- ALTER TABLE public.saved_meal_labels DROP COLUMN heating_instructions;