-- Add order cutoffs and production settings to collection points
ALTER TABLE public.collection_points 
ADD COLUMN order_cutoffs jsonb DEFAULT '{}',
ADD COLUMN production_lead_days integer DEFAULT 2,
ADD COLUMN production_same_day boolean DEFAULT false,
ADD COLUMN production_notes text;

-- Create global fulfillment schedule table
CREATE TABLE public.global_fulfillment_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week text NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  default_cutoff_time time NOT NULL DEFAULT '23:59',
  default_production_lead_days integer NOT NULL DEFAULT 2,
  default_production_same_day boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(day_of_week)
);

-- Enable RLS on global_fulfillment_schedule
ALTER TABLE public.global_fulfillment_schedule ENABLE ROW LEVEL SECURITY;

-- Create policies for global_fulfillment_schedule
CREATE POLICY "Authenticated users can manage global schedule" 
ON public.global_fulfillment_schedule 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Insert default schedule (all days with 2-day lead time and 11:59 PM cutoff)
INSERT INTO public.global_fulfillment_schedule (day_of_week, default_cutoff_time, default_production_lead_days) VALUES
('monday', '23:59', 2),
('tuesday', '23:59', 2),
('wednesday', '23:59', 2),
('thursday', '23:59', 2),
('friday', '23:59', 2),
('saturday', '23:59', 2),
('sunday', '23:59', 2);

-- Add trigger for updated_at
CREATE TRIGGER update_global_fulfillment_schedule_updated_at
  BEFORE UPDATE ON public.global_fulfillment_schedule
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Remove redundant fulfillment settings that are now handled by the new system
DELETE FROM public.fulfillment_settings 
WHERE setting_key IN ('delivery_lead_hours', 'collection_lead_hours', 'order_timing');