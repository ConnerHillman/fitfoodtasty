-- Phase 1: Add new consolidated storage_heating_instructions field
ALTER TABLE public.meals 
ADD COLUMN storage_heating_instructions text DEFAULT 'Store in a refrigerator below 5°c. Heat in a microwave for 3–4 minutes or until piping hot.';

-- Add character length constraint for the new combined field
ALTER TABLE public.meals 
ADD CONSTRAINT storage_heating_instructions_length CHECK (char_length(storage_heating_instructions) <= 200);