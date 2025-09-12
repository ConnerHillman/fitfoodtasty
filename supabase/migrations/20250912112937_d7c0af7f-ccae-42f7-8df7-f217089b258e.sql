-- Create referral settings table for admin configuration
CREATE TABLE public.referral_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_name text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can manage settings
CREATE POLICY "Authenticated users can manage referral settings" 
ON public.referral_settings 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Insert default referral settings
INSERT INTO public.referral_settings (setting_name, setting_value, description) VALUES
('referee_discount_percentage', '15', 'Discount percentage for new customers using referral codes'),
('referrer_credit_percentage', '15', 'Store credit percentage referrers earn from successful referrals'),
('max_uses_per_code', '1', 'Maximum times a single customer can use referral benefits (1 = first order only, -1 = unlimited)'),
('max_credit_per_referrer', '500', 'Maximum total store credit a single referrer can earn (in currency units)'),
('minimum_order_amount', '25', 'Minimum order amount required for referral benefits to apply'),
('referral_system_active', 'true', 'Whether the referral system is currently active'),
('referral_expiry_days', '30', 'Days after which unused referral codes expire (0 = never expire)');

-- Add updated_at trigger
CREATE TRIGGER update_referral_settings_updated_at
  BEFORE UPDATE ON public.referral_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();