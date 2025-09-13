-- Add is_business_open column to global_fulfillment_schedule
ALTER TABLE public.global_fulfillment_schedule 
ADD COLUMN is_business_open boolean NOT NULL DEFAULT true;

-- Update the schedule to reflect typical business hours (closed Sundays by default)
UPDATE public.global_fulfillment_schedule 
SET is_business_open = false 
WHERE day_of_week = 'sunday';