-- Enable required extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Update abandoned cart settings to enable email recovery
UPDATE public.abandoned_cart_settings 
SET setting_value = 'true', updated_at = now()
WHERE setting_name = 'email_enabled';

-- Insert the setting if it doesn't exist
INSERT INTO public.abandoned_cart_settings (setting_name, setting_value, description)
VALUES ('email_enabled', 'true', 'Enable abandoned cart recovery emails')
ON CONFLICT (setting_name) DO UPDATE 
SET setting_value = 'true', updated_at = now();