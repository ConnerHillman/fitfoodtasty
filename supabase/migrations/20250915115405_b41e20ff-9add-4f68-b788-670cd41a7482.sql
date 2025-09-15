-- Phase 1: Intelligent data migration - combine storage and heating instructions
-- Handle different scenarios of existing data intelligently

UPDATE public.meals 
SET storage_heating_instructions = CASE
  -- If storage instructions already contain heating info, use as-is
  WHEN storage_instructions ILIKE '%heat%' OR storage_instructions ILIKE '%microwave%' 
    THEN storage_instructions
  
  -- If storage and heating are both non-default, combine them
  WHEN storage_instructions IS NOT NULL 
    AND heating_instructions IS NOT NULL
    AND storage_instructions != 'Store in a refrigerator below 5°c. Heat in a microwave for 3–4 minutes or until piping hot.'
    AND heating_instructions != 'Pierce film and heat for 3-4 minutes or until piping hot.'
    THEN storage_instructions || ' ' || heating_instructions
  
  -- If only storage is custom, use it
  WHEN storage_instructions IS NOT NULL 
    AND storage_instructions != 'Store in a refrigerator below 5°c. Heat in a microwave for 3–4 minutes or until piping hot.'
    THEN storage_instructions || ' Pierce film and heat for 3-4 minutes or until piping hot.'
  
  -- If only heating is custom, combine with default storage
  WHEN heating_instructions IS NOT NULL 
    AND heating_instructions != 'Pierce film and heat for 3-4 minutes or until piping hot.'
    THEN 'Store in a refrigerator below 5°c. ' || heating_instructions
  
  -- Default case - use the standard combined instruction
  ELSE 'Store in a refrigerator below 5°c. Heat in a microwave for 3–4 minutes or until piping hot.'
END;