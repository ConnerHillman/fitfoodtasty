-- Get the recently created regular order ID and add order items
WITH recent_order AS (
  SELECT id FROM orders 
  WHERE user_id = '77b8ffde-e987-4918-a4be-93af69fe2927' 
  ORDER BY created_at DESC 
  LIMIT 1
)
INSERT INTO order_items (
  order_id,
  meal_id,
  meal_name,
  quantity,
  unit_price,
  total_price
) 
SELECT 
  recent_order.id,
  meals.id,
  meals.name,
  meal_quantities.quantity,
  COALESCE(meals.price, 8.00),
  COALESCE(meals.price, 8.00) * meal_quantities.quantity
FROM recent_order
CROSS JOIN (
  VALUES 
    ('35bebfd6-6439-488d-ae59-ed8b65bc5053'::uuid, 2),
    ('7beeb24e-075c-4d4d-8935-7e72f96aad2b'::uuid, 1),
    ('07708c1d-ae47-4d08-9fe7-f6a3e0109b58'::uuid, 1)
) AS meal_quantities(meal_id, quantity)
JOIN meals ON meals.id = meal_quantities.meal_id;