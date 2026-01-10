-- Test Data Cleanup Migration
-- This cleans up development/test data before going live

-- Step 1: Delete order_items for fake test orders
DELETE FROM public.order_items 
WHERE order_id IN (
  SELECT id FROM public.orders 
  WHERE customer_email IN (
    'sarah.j@example.com',
    'mike.chen@example.com', 
    'emma.wilson@example.com',
    'james.brown@example.com',
    'olivia.taylor@example.com',
    'david.garcia@example.com',
    'sophia.martinez@example.com',
    'william.anderson@example.com',
    'test@example.com'
  )
);

-- Step 2: Delete fake test orders
DELETE FROM public.orders 
WHERE customer_email IN (
  'sarah.j@example.com',
  'mike.chen@example.com', 
  'emma.wilson@example.com',
  'james.brown@example.com',
  'olivia.taylor@example.com',
  'david.garcia@example.com',
  'sophia.martinez@example.com',
  'william.anderson@example.com',
  'test@example.com'
);

-- Step 3: Delete package_meal_selections for test package orders
DELETE FROM public.package_meal_selections 
WHERE package_order_id IN (
  SELECT id FROM public.package_orders 
  WHERE customer_email = 'test@example.com'
);

-- Step 4: Delete fake test package orders
DELETE FROM public.package_orders 
WHERE customer_email = 'test@example.com';

-- Step 5: Clean up all abandoned carts (development data)
DELETE FROM public.abandoned_cart_emails;
DELETE FROM public.abandoned_carts;

-- Step 6: Clean up order audit logs (fresh start for production)
DELETE FROM public.order_audit_log;

-- Step 7: Remove dangerous test coupons
DELETE FROM public.coupons 
WHERE code IN ('TEST100', 'TEST20');

-- Step 8: Remove test profiles (auth.users must be deleted manually in Supabase Dashboard)
DELETE FROM public.profiles 
WHERE user_id IN (
  '77b8ffde-e987-4918-a4be-93af69fe2927',  -- connerhillman20@gmail.com
  'ea8b72e4-6d2f-406a-ac96-6f44e02f61c4',  -- Testing TheWebsite
  '5b95b497-d5d6-4fa8-9ad9-251e5fef97f1'   -- Laura Greenland
);