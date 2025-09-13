-- Add default_cutoff_day column to global_fulfillment_schedule
ALTER TABLE public.global_fulfillment_schedule 
ADD COLUMN default_cutoff_day text;

-- Set default values for existing records (cutoff on same day)
UPDATE public.global_fulfillment_schedule 
SET default_cutoff_day = day_of_week 
WHERE default_cutoff_day IS NULL;