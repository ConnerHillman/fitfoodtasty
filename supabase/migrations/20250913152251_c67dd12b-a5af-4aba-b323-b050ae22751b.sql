-- Create fulfillment settings table
CREATE TABLE public.fulfillment_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_type text NOT NULL, -- 'delivery_days', 'collection_days', 'delivery_zones', 'collection_points', 'fees', 'general'
  setting_key text NOT NULL,
  setting_value jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(setting_type, setting_key)
);

-- Enable RLS
ALTER TABLE public.fulfillment_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can manage fulfillment settings" 
ON public.fulfillment_settings 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create delivery zones table
CREATE TABLE public.delivery_zones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_name text NOT NULL,
  postcodes text[] NOT NULL,
  delivery_days text[] NOT NULL, -- ['monday', 'wednesday', 'friday']
  delivery_fee numeric NOT NULL DEFAULT 0,
  minimum_order numeric NOT NULL DEFAULT 0,
  maximum_distance_km numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for delivery zones
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- Create policies for delivery zones
CREATE POLICY "Authenticated users can manage delivery zones" 
ON public.delivery_zones 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create collection points table
CREATE TABLE public.collection_points (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  point_name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  postcode text NOT NULL,
  phone text,
  email text,
  collection_days text[] NOT NULL,
  opening_hours jsonb, -- {"monday": {"open": "09:00", "close": "17:00"}, ...}
  collection_fee numeric NOT NULL DEFAULT 0,
  maximum_capacity integer DEFAULT 50,
  special_instructions text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for collection points
ALTER TABLE public.collection_points ENABLE ROW LEVEL SECURITY;

-- Create policies for collection points
CREATE POLICY "Everyone can view active collection points" 
ON public.collection_points 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can manage collection points" 
ON public.collection_points 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Insert default settings
INSERT INTO public.fulfillment_settings (setting_type, setting_key, setting_value) VALUES
('general', 'default_delivery_fee', '{"value": 2.99, "currency": "gbp"}'),
('general', 'minimum_order_delivery', '{"value": 15.00, "currency": "gbp"}'),
('general', 'minimum_order_collection', '{"value": 10.00, "currency": "gbp"}'),
('general', 'delivery_slots', '{"morning": "09:00-12:00", "afternoon": "12:00-17:00", "evening": "17:00-20:00"}'),
('delivery_days', 'available_days', '["monday", "tuesday", "wednesday", "thursday", "friday"]'),
('collection_days', 'available_days', '["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]'),
('general', 'holiday_dates', '[]'),
('general', 'max_delivery_radius_km', '{"value": 25}');

-- Create updated_at trigger
CREATE TRIGGER update_fulfillment_settings_updated_at
BEFORE UPDATE ON public.fulfillment_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_zones_updated_at
BEFORE UPDATE ON public.delivery_zones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collection_points_updated_at
BEFORE UPDATE ON public.collection_points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();