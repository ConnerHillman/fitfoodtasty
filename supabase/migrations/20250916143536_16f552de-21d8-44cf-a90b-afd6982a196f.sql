-- Remove global delivery fee setting since we're moving to zone-first approach
DELETE FROM fulfillment_settings 
WHERE setting_type = 'fees' AND setting_key = 'delivery_fee';

-- Optional: Add a comment explaining the new approach
INSERT INTO fulfillment_settings (setting_type, setting_key, setting_value, is_active)
VALUES ('system', 'delivery_fees_note', '"Delivery fees are now managed per delivery zone only"', true)
ON CONFLICT (setting_type, setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = now();