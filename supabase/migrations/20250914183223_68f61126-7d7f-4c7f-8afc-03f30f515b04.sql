-- Create test package order with FREEMEAL coupon
INSERT INTO package_orders (
  id,
  user_id, 
  package_id,
  total_amount,
  currency,
  status,
  customer_name,
  customer_email,
  delivery_address,
  requested_delivery_date,
  created_at
) VALUES (
  gen_random_uuid(),
  'db695cff-7ba4-4b41-a0dc-ae8d40f6f4a0', -- Replace with actual user_id from auth.users
  'a2a5c16e-c6aa-4261-9742-aff4fe3b602b',
  42.00,
  'gbp',
  'delivered',
  'Test Customer',
  'test@example.com',
  '123 Test Street, Test City, TC1 2AB',
  '2024-09-20',
  NOW() - INTERVAL '7 days'
) RETURNING id;