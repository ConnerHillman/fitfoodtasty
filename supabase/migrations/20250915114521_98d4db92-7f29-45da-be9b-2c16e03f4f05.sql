-- Add storage and heating instruction fields to meals table
ALTER TABLE public.meals 
ADD COLUMN storage_instructions text DEFAULT 'Store in a refrigerator below 5°c. Heat in a microwave for 3–4 minutes or until piping hot.',
ADD COLUMN heating_instructions text DEFAULT 'Pierce film and heat for 3-4 minutes or until piping hot.';

-- Add character length constraints to prevent label overflow
ALTER TABLE public.meals 
ADD CONSTRAINT storage_instructions_length CHECK (char_length(storage_instructions) <= 150),
ADD CONSTRAINT heating_instructions_length CHECK (char_length(heating_instructions) <= 100);