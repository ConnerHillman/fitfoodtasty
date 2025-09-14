-- Insert test coupons for testing
INSERT INTO coupons (code, discount_percentage, discount_amount, free_delivery, free_item_id, min_order_value, expires_at, active) VALUES 
-- TEST20: 20% off, expires 30/09/2025
('TEST20', 20, NULL, false, NULL, NULL, '2025-09-30 23:59:59+00', true),
-- SAVE10: £10 off, min order £50
('SAVE10', 0, 10, false, NULL, 50, NULL, true),
-- FREESHIP: Free delivery
('FREESHIP', 0, NULL, true, NULL, NULL, NULL, true),
-- FREEMEAL: Free item (Bang Bang Chicken)
('FREEMEAL', 0, NULL, false, 'ac938d9a-9902-4378-a71b-2e1b77aee540', NULL, NULL, true)
ON CONFLICT (code) DO NOTHING;