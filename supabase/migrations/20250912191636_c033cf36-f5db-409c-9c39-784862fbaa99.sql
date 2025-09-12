-- Create test orders for September 13th, 2025 with ~50 meals total for label testing

-- Test Order 1: Large order (15 meals)
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
  '5df183ac-8d8a-4fb0-9e00-b370fd292ad2',
  'confirmed',
  450.00,
  'gbp',
  'Test Customer 1',
  'test1@fitfoodtasty.co.uk',
  '123 Test Street, Test City, TE1 2ST',
  '2025-09-13 09:30:00+00'
);

-- Get the order ID for order items
WITH new_order AS (
  SELECT id as order_id FROM public.orders 
  WHERE customer_name = 'Test Customer 1' 
  AND created_at = '2025-09-13 09:30:00+00'
)
INSERT INTO public.order_items (
  order_id, 
  meal_id, 
  meal_name, 
  quantity, 
  unit_price, 
  total_price
) 
SELECT 
  new_order.order_id,
  meals.id,
  meals.name,
  quantities.qty,
  30.00,
  30.00 * quantities.qty
FROM new_order
CROSS JOIN (
  VALUES 
    ('ac938d9a-9902-4378-a71b-2e1b77aee540', 4), -- Bang Bang Chicken (BIG) x4
    ('07708c1d-ae47-4d08-9fe7-f6a3e0109b58', 3), -- Korean Beef Bowl x3
    ('35bebfd6-6439-488d-ae59-ed8b65bc5053', 4), -- Bang Bang Chicken (LowCal) x4
    ('9016e9aa-f4d3-466c-b65d-4d095c438bbb', 4)  -- Buffalo Chicken Bowl x4
) AS quantities(meal_id, qty)
JOIN public.meals ON meals.id::text = quantities.meal_id;

-- Test Order 2: Medium order (12 meals)
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
  '5df183ac-8d8a-4fb0-9e00-b370fd292ad2',
  'confirmed',
  360.00,
  'gbp',
  'Test Customer 2',
  'test2@fitfoodtasty.co.uk',
  '456 Test Avenue, Test City, TE3 4ST',
  '2025-09-13 10:15:00+00'
);

WITH new_order AS (
  SELECT id as order_id FROM public.orders 
  WHERE customer_name = 'Test Customer 2' 
  AND created_at = '2025-09-13 10:15:00+00'
)
INSERT INTO public.order_items (
  order_id, 
  meal_id, 
  meal_name, 
  quantity, 
  unit_price, 
  total_price
) 
SELECT 
  new_order.order_id,
  meals.id,
  meals.name,
  quantities.qty,
  30.00,
  30.00 * quantities.qty
FROM new_order
CROSS JOIN (
  VALUES 
    ('aa412cb9-24cd-429a-8910-574477af1881', 3), -- Beef Jalfrezi and Pilau Rice x3
    ('7beeb24e-075c-4d4d-8935-7e72f96aad2b', 3), -- Buffalo Chicken Bowl (LowCal) x3
    ('9d1af718-14b2-4bf1-a3bd-f90abe8d9d00', 3), -- Buffalo Chicken Bowl (BIG) x3
    ('16b8eff7-80ee-4de3-be0d-7908bd5b450c', 3)  -- Chicken Jalfrezi and Pilau Rice (LowCal) x3
) AS quantities(meal_id, qty)
JOIN public.meals ON meals.id::text = quantities.meal_id;

-- Test Order 3: Small order (8 meals)
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
  '5df183ac-8d8a-4fb0-9e00-b370fd292ad2',
  'confirmed',
  240.00,
  'gbp',
  'Test Customer 3',
  'test3@fitfoodtasty.co.uk',
  '789 Test Road, Test City, TE5 6ST',
  '2025-09-13 11:00:00+00'
);

WITH new_order AS (
  SELECT id as order_id FROM public.orders 
  WHERE customer_name = 'Test Customer 3' 
  AND created_at = '2025-09-13 11:00:00+00'
)
INSERT INTO public.order_items (
  order_id, 
  meal_id, 
  meal_name, 
  quantity, 
  unit_price, 
  total_price
) 
SELECT 
  new_order.order_id,
  meals.id,
  meals.name,
  quantities.qty,
  30.00,
  30.00 * quantities.qty
FROM new_order
CROSS JOIN (
  VALUES 
    ('655eeff8-9b45-4853-8f8c-01675d92a851', 4), -- Cajun Chicken Breast w/ Roasted New Potatoes (BIG) x4
    ('fb3c265f-7e77-4d40-bdff-f563c5dd744e', 4)  -- Chicken Jalfrezi and Pilau Rice x4
) AS quantities(meal_id, qty)
JOIN public.meals ON meals.id::text = quantities.meal_id;

-- Test Order 4: Mixed order (10 meals)
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
  '5df183ac-8d8a-4fb0-9e00-b370fd292ad2',
  'confirmed',
  300.00,
  'gbp',
  'Test Customer 4',
  'test4@fitfoodtasty.co.uk',
  '321 Test Close, Test City, TE7 8ST',
  '2025-09-13 14:30:00+00'
);

WITH new_order AS (
  SELECT id as order_id FROM public.orders 
  WHERE customer_name = 'Test Customer 4' 
  AND created_at = '2025-09-13 14:30:00+00'
)
INSERT INTO public.order_items (
  order_id, 
  meal_id, 
  meal_name, 
  quantity, 
  unit_price, 
  total_price
) 
SELECT 
  new_order.order_id,
  meals.id,
  meals.name,
  quantities.qty,
  30.00,
  30.00 * quantities.qty
FROM new_order
CROSS JOIN (
  VALUES 
    ('ac938d9a-9902-4378-a71b-2e1b77aee540', 2), -- Bang Bang Chicken (BIG) x2
    ('07708c1d-ae47-4d08-9fe7-f6a3e0109b58', 2), -- Korean Beef Bowl x2
    ('35bebfd6-6439-488d-ae59-ed8b65bc5053', 2), -- Bang Bang Chicken (LowCal) x2
    ('9016e9aa-f4d3-466c-b65d-4d095c438bbb', 2), -- Buffalo Chicken Bowl x2
    ('aa412cb9-24cd-429a-8910-574477af1881', 2)  -- Beef Jalfrezi and Pilau Rice x2
) AS quantities(meal_id, qty)
JOIN public.meals ON meals.id::text = quantities.meal_id;

-- Test Order 5: Small order (5 meals)
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
  '5df183ac-8d8a-4fb0-9e00-b370fd292ad2',
  'confirmed',
  150.00,
  'gbp',
  'Test Customer 5',
  'test5@fitfoodtasty.co.uk',
  '654 Test Lane, Test City, TE9 0ST',
  '2025-09-13 16:00:00+00'
);

WITH new_order AS (
  SELECT id as order_id FROM public.orders 
  WHERE customer_name = 'Test Customer 5' 
  AND created_at = '2025-09-13 16:00:00+00'
)
INSERT INTO public.order_items (
  order_id, 
  meal_id, 
  meal_name, 
  quantity, 
  unit_price, 
  total_price
) 
SELECT 
  new_order.order_id,
  meals.id,
  meals.name,
  quantities.qty,
  30.00,
  30.00 * quantities.qty
FROM new_order
CROSS JOIN (
  VALUES 
    ('7beeb24e-075c-4d4d-8935-7e72f96aad2b', 3), -- Buffalo Chicken Bowl (LowCal) x3
    ('9d1af718-14b2-4bf1-a3bd-f90abe8d9d00', 2)  -- Buffalo Chicken Bowl (BIG) x2
) AS quantities(meal_id, qty)
JOIN public.meals ON meals.id::text = quantities.meal_id;