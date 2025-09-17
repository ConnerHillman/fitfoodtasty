-- Create subscription settings table
CREATE TABLE IF NOT EXISTS public.subscription_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_name TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage subscription settings" 
ON public.subscription_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default subscription discount settings
INSERT INTO public.subscription_settings (setting_name, setting_value, description) VALUES
('subscription_discount_enabled', 'true', 'Enable subscription discount'),
('subscription_discount_percentage', '10', 'Subscription discount percentage (0-100)');

-- Create updated_at trigger
CREATE TRIGGER update_subscription_settings_updated_at
  BEFORE UPDATE ON public.subscription_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();