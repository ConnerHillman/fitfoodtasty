-- Add character length constraint back for the new consolidated field
ALTER TABLE public.meals 
ADD CONSTRAINT storage_heating_instructions_length CHECK (char_length(storage_heating_instructions) <= 200);