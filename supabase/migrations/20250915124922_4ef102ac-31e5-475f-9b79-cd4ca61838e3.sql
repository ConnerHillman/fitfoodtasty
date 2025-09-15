-- Add character length constraint to storage_heating_instructions column
ALTER TABLE public.saved_meal_labels 
ALTER COLUMN storage_heating_instructions TYPE VARCHAR(200);

-- Update any existing data that exceeds 200 characters (truncate if necessary)
UPDATE public.saved_meal_labels 
SET storage_heating_instructions = LEFT(storage_heating_instructions, 200)
WHERE LENGTH(storage_heating_instructions) > 200;

-- Drop the old redundant columns that are no longer needed
ALTER TABLE public.saved_meal_labels 
DROP COLUMN IF EXISTS storage_instructions,
DROP COLUMN IF EXISTS heating_instructions;

-- Add a comment to document the column purpose
COMMENT ON COLUMN public.saved_meal_labels.storage_heating_instructions 
IS 'Combined storage and heating instructions with 200 character limit';