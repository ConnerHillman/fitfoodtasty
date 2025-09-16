UPDATE fulfillment_settings 
SET setting_value = '{"value": 5.99, "currency": "gbp"}'::jsonb, 
    updated_at = now()
WHERE setting_type = 'general' 
AND setting_key = 'default_delivery_fee';