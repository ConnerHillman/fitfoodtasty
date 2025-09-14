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
  '12345678-test-package-order-abcd-123456789012',
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
);

-- Create package meal selections for the test order
INSERT INTO package_meal_selections (
  package_order_id,
  meal_id,
  quantity
) VALUES 
  ('12345678-test-package-order-abcd-123456789012', 'ac938d9a-9902-4378-a71b-2e1b77aee540', 2), -- Bang Bang Chicken (BIG)
  ('12345678-test-package-order-abcd-123456789012', '07708c1d-ae47-4d08-9fe7-f6a3e0109b58', 1), -- Korean Beef Bowl
  ('12345678-test-package-order-abcd-123456789012', '9016e9aa-f4d3-466c-b65d-4d095c438bbb', 2); -- Buffalo Chicken Bowl

-- Create test regular meal order with TEST20 coupon
INSERT INTO orders (
  id,
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
  '87654321-test-regular-order-dcba-210987654321',
  'db695cff-7ba4-4b41-a0dc-ae8d40f6f4a0', -- Replace with actual user_id
  32.00, -- 40.00 - 20% discount
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

-- Create order items for the test regular order
INSERT INTO order_items (
  order_id,
  meal_id,
  meal_name,
  quantity,
  unit_price,
  total_price
) VALUES
  ('87654321-test-regular-order-dcba-210987654321', '35bebfd6-6439-488d-ae59-ed8b65bc5053', 'Bang Bang Chicken (LowCal)', 2, 8.00, 16.00),
  ('87654321-test-regular-order-dcba-210987654321', '7beeb24e-075c-4d4d-8935-7e72f96aad2b', 'Buffalo Chicken Bowl (LowCal)', 1, 8.00, 8.00),
  ('87654321-test-regular-order-dcba-210987654321', '07708c1d-ae47-4d08-9fe7-f6a3e0109b58', 'Korean Beef Bowl', 1, 8.00, 8.00);