-- First create a favorites table for the new functionality
CREATE TABLE IF NOT EXISTS user_order_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  order_id UUID NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('package', 'regular')),
  favorited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, order_id, order_type)
);

-- Enable RLS on favorites table
ALTER TABLE user_order_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for favorites
CREATE POLICY "Users can manage their own favorites" 
ON user_order_favorites 
FOR ALL 
USING (auth.uid() = user_id);

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