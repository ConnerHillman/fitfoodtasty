-- Delete existing test orders from September 13th, 2025
DELETE FROM public.order_items WHERE order_id IN (
  SELECT id FROM public.orders 
  WHERE created_at >= '2025-09-13 00:00:00' 
  AND created_at < '2025-09-14 00:00:00'
);

DELETE FROM public.orders 
WHERE created_at >= '2025-09-13 00:00:00' 
AND created_at < '2025-09-14 00:00:00';

-- Create diverse test orders for September 13th, 2025 with random meal combinations
-- We'll create ~150 total meals across multiple orders with variety

-- Order 1: Breakfast/Light meals focus
INSERT INTO public.orders (
  id,
  user_id, 
  status, 
  total_amount, 
  currency,
  customer_name,
  customer_email,
  delivery_address,
  created_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'confirmed',
  120.00,
  'gbp',
  'Sarah Johnson',
  'sarah.j@example.com',
  '15 Maple Street, Bristol BS1 3XY',
  '2025-09-13 08:30:00+00'
);

-- Add varied order items for Order 1 (targeting 20 meals)
INSERT INTO public.order_items (
  id,
  order_id,
  meal_id,
  meal_name,
  quantity,
  unit_price,
  total_price
)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM public.orders WHERE customer_email = 'sarah.j@example.com' ORDER BY created_at DESC LIMIT 1),
  meals.id,
  meals.name,
  CASE 
    WHEN random() < 0.3 THEN 1
    WHEN random() < 0.7 THEN 2
    ELSE 3
  END as quantity,
  COALESCE(meals.price, 9.00),
  COALESCE(meals.price, 9.00) * CASE 
    WHEN random() < 0.3 THEN 1
    WHEN random() < 0.7 THEN 2
    ELSE 3
  END
FROM (
  SELECT * FROM public.meals 
  WHERE is_active = true 
  ORDER BY random() 
  LIMIT 8
) meals;

-- Order 2: Protein-heavy selection
INSERT INTO public.orders (
  id,
  user_id, 
  status, 
  total_amount, 
  currency,
  customer_name,
  customer_email,
  delivery_address,
  created_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'confirmed',
  156.00,
  'gbp',
  'Michael Chen',
  'mike.chen@example.com',
  '42 Oak Avenue, Manchester M1 4PQ',
  '2025-09-13 10:15:00+00'
);

-- Add varied order items for Order 2 (targeting 25 meals)
INSERT INTO public.order_items (
  id,
  order_id,
  meal_id,
  meal_name,
  quantity,
  unit_price,
  total_price
)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM public.orders WHERE customer_email = 'mike.chen@example.com' ORDER BY created_at DESC LIMIT 1),
  meals.id,
  meals.name,
  CASE 
    WHEN random() < 0.2 THEN 2
    WHEN random() < 0.6 THEN 3
    ELSE 4
  END as quantity,
  COALESCE(meals.price, 9.00),
  COALESCE(meals.price, 9.00) * CASE 
    WHEN random() < 0.2 THEN 2
    WHEN random() < 0.6 THEN 3
    ELSE 4
  END
FROM (
  SELECT * FROM public.meals 
  WHERE is_active = true 
  AND (name ILIKE '%chicken%' OR name ILIKE '%beef%' OR name ILIKE '%BIG%')
  ORDER BY random() 
  LIMIT 7
) meals;

-- Order 3: Family order with variety
INSERT INTO public.orders (
  id,
  user_id, 
  status, 
  total_amount, 
  currency,
  customer_name,
  customer_email,
  delivery_address,
  created_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'confirmed',
  198.50,
  'gbp',
  'Emma Thompson',
  'emma.t@family.com',
  '88 Rose Gardens, Leeds LS2 9JT',
  '2025-09-13 12:45:00+00'
);

-- Add varied order items for Order 3 (targeting 30 meals)
INSERT INTO public.order_items (
  id,
  order_id,
  meal_id,
  meal_name,
  quantity,
  unit_price,
  total_price
)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM public.orders WHERE customer_email = 'emma.t@family.com' ORDER BY created_at DESC LIMIT 1),
  meals.id,
  meals.name,
  CASE 
    WHEN random() < 0.3 THEN 3
    WHEN random() < 0.7 THEN 4
    ELSE 5
  END as quantity,
  COALESCE(meals.price, 9.00),
  COALESCE(meals.price, 9.00) * CASE 
    WHEN random() < 0.3 THEN 3
    WHEN random() < 0.7 THEN 4
    ELSE 5
  END
FROM (
  SELECT * FROM public.meals 
  WHERE is_active = true 
  ORDER BY random() 
  LIMIT 9
) meals;

-- Order 4: Health-conscious customer
INSERT INTO public.orders (
  id,
  user_id, 
  status, 
  total_amount, 
  currency,
  customer_name,
  customer_email,
  delivery_address,
  created_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'confirmed',
  127.50,
  'gbp',
  'David Wilson',
  'david.w@healthy.com',
  '23 Elm Close, Birmingham B1 2TU',
  '2025-09-13 14:20:00+00'
);

-- Add varied order items for Order 4 (targeting 20 meals, focus on LowCal)
INSERT INTO public.order_items (
  id,
  order_id,
  meal_id,
  meal_name,
  quantity,
  unit_price,
  total_price
)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM public.orders WHERE customer_email = 'david.w@healthy.com' ORDER BY created_at DESC LIMIT 1),
  meals.id,
  meals.name,
  CASE 
    WHEN random() < 0.4 THEN 2
    WHEN random() < 0.8 THEN 3
    ELSE 4
  END as quantity,
  COALESCE(meals.price, 7.50),
  COALESCE(meals.price, 7.50) * CASE 
    WHEN random() < 0.4 THEN 2
    WHEN random() < 0.8 THEN 3
    ELSE 4
  END
FROM (
  SELECT * FROM public.meals 
  WHERE is_active = true 
  AND (name ILIKE '%LowCal%' OR name ILIKE '%salad%')
  ORDER BY random() 
  LIMIT 7
) meals;

-- Order 5: Spice lover
INSERT INTO public.orders (
  id,
  user_id, 
  status, 
  total_amount, 
  currency,
  customer_name,
  customer_email,
  delivery_address,
  created_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'confirmed',
  143.25,
  'gbp',
  'Priya Patel',
  'priya.p@spice.com',
  '67 Curry Lane, London SW1A 1AA',
  '2025-09-13 16:10:00+00'
);

-- Add varied order items for Order 5 (targeting 22 meals, focus on curries/spiced dishes)
INSERT INTO public.order_items (
  id,
  order_id,
  meal_id,
  meal_name,
  quantity,
  unit_price,
  total_price
)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM public.orders WHERE customer_email = 'priya.p@spice.com' ORDER BY created_at DESC LIMIT 1),
  meals.id,
  meals.name,
  CASE 
    WHEN random() < 0.3 THEN 2
    WHEN random() < 0.7 THEN 3
    ELSE 4
  END as quantity,
  COALESCE(meals.price, 9.00),
  COALESCE(meals.price, 9.00) * CASE 
    WHEN random() < 0.3 THEN 2
    WHEN random() < 0.7 THEN 3
    ELSE 4
  END
FROM (
  SELECT * FROM public.meals 
  WHERE is_active = true 
  AND (name ILIKE '%curry%' OR name ILIKE '%jalfrezi%' OR name ILIKE '%korean%' OR name ILIKE '%cajun%')
  ORDER BY random() 
  LIMIT 8
) meals;

-- Order 6: International cuisine fan
INSERT INTO public.orders (
  id,
  user_id, 
  status, 
  total_amount, 
  currency,
  customer_name,
  customer_email,
  delivery_address,
  created_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'confirmed',
  167.75,
  'gbp',
  'Antonio Rodriguez',
  'antonio.r@global.com',
  '91 International Street, Glasgow G1 3ER',
  '2025-09-13 18:30:00+00'
);

-- Add varied order items for Order 6 (targeting 23 meals, mix of international)
INSERT INTO public.order_items (
  id,
  order_id,
  meal_id,
  meal_name,
  quantity,
  unit_price,
  total_price
)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM public.orders WHERE customer_email = 'antonio.r@global.com' ORDER BY created_at DESC LIMIT 1),
  meals.id,
  meals.name,
  CASE 
    WHEN random() < 0.4 THEN 2
    WHEN random() < 0.7 THEN 3
    ELSE 4
  END as quantity,
  COALESCE(meals.price, 9.00),
  COALESCE(meals.price, 9.00) * CASE 
    WHEN random() < 0.4 THEN 2
    WHEN random() < 0.7 THEN 3
    ELSE 4
  END
FROM (
  SELECT * FROM public.meals 
  WHERE is_active = true 
  ORDER BY random() 
  LIMIT 10
) meals;