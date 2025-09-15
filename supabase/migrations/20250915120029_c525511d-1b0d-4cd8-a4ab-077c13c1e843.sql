-- Phase 4: Remove old storage_instructions and heating_instructions columns
-- All data has been migrated to storage_heating_instructions

-- First remove the constraints on the old fields
ALTER TABLE public.meals 
DROP CONSTRAINT IF EXISTS storage_instructions_length,
DROP CONSTRAINT IF EXISTS heating_instructions_length;

-- Drop the old columns
ALTER TABLE public.meals 
DROP COLUMN IF EXISTS storage_instructions,
DROP COLUMN IF EXISTS heating_instructions;