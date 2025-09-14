-- Create package meal selections for the test order
INSERT INTO package_meal_selections (
  package_order_id,
  meal_id,
  quantity
) VALUES 
  ('342d5a38-d8c6-40fe-9ea5-6287952d2b30', 'ac938d9a-9902-4378-a71b-2e1b77aee540'::uuid, 2),
  ('342d5a38-d8c6-40fe-9ea5-6287952d2b30', '07708c1d-ae47-4d08-9fe7-f6a3e0109b58'::uuid, 1),
  ('342d5a38-d8c6-40fe-9ea5-6287952d2b30', '9016e9aa-f4d3-466c-b65d-4d095c438bbb'::uuid, 2);

-- Create test regular meal order with TEST20 coupon
INSERT INTO orders (
  user_id,
  total_amount,
  currency,
  status,
  customer_name,
  customer_email,
  delivery_address,
  requested_delivery_date,
  coupon_type,
  coupon_discount_percentage,
  created_at
) VALUES (
  '77b8ffde-e987-4918-a4be-93af69fe2927',
  32.00,
  'gbp',
  'delivered', 
  'Test Customer',
  'test@example.com',
  '123 Test Street, Test City, TC1 2AB',
  '2024-09-22',
  'TEST20',
  20,
  NOW() - INTERVAL '5 days'
);