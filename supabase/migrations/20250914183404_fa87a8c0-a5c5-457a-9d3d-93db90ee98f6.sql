-- Create test package order
INSERT INTO package_orders (
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
  '77b8ffde-e987-4918-a4be-93af69fe2927',
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

-- Get the package order ID for meal selections
WITH latest_package_order AS (
  SELECT id FROM package_orders 
  WHERE user_id = '77b8ffde-e987-4918-a4be-93af69fe2927' 
  ORDER BY created_at DESC 
  LIMIT 1
)
-- Create package meal selections
INSERT INTO package_meal_selections (
  package_order_id,
  meal_id,
  quantity
)
SELECT 
  lpo.id,
  meal_data.meal_id,
  meal_data.quantity
FROM latest_package_order lpo,
(VALUES 
  ('ac938d9a-9902-4378-a71b-2e1b77aee540', 2),
  ('07708c1d-ae47-4d08-9fe7-f6a3e0109b58', 1),
  ('9016e9aa-f4d3-466c-b65d-4d095c438bbb', 2)
) AS meal_data(meal_id, quantity);

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

-- Get the regular order ID for order items
WITH latest_order AS (
  SELECT id FROM orders 
  WHERE user_id = '77b8ffde-e987-4918-a4be-93af69fe2927' 
  ORDER BY created_at DESC 
  LIMIT 1
)
-- Create order items for the test regular order
INSERT INTO order_items (
  order_id,
  meal_id,
  meal_name,
  quantity,
  unit_price,
  total_price
)
SELECT 
  lo.id,
  meal_data.meal_id,
  meal_data.meal_name,
  meal_data.quantity,
  meal_data.unit_price,
  meal_data.total_price
FROM latest_order lo,
(VALUES 
  ('35bebfd6-6439-488d-ae59-ed8b65bc5053', 'Bang Bang Chicken (LowCal)', 2, 8.00, 16.00),
  ('7beeb24e-075c-4d4d-8935-7e72f96aad2b', 'Buffalo Chicken Bowl (LowCal)', 1, 8.00, 8.00),
  ('07708c1d-ae47-4d08-9fe7-f6a3e0109b58', 'Korean Beef Bowl', 1, 8.00, 8.00)
) AS meal_data(meal_id, meal_name, quantity, unit_price, total_price);