-- Fix abandoned_carts table security vulnerability
-- Drop existing problematic policies and create secure ones

-- Drop existing policies that might allow public access
DROP POLICY IF EXISTS "Users can manage their own abandoned carts" ON public.abandoned_carts;
DROP POLICY IF EXISTS "System can create abandoned carts" ON public.abandoned_carts;

-- Create secure policies that restrict access properly
CREATE POLICY "Users can access their own abandoned carts" 
ON public.abandoned_carts 
FOR ALL 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) 
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Allow system to create abandoned carts for authenticated users only
CREATE POLICY "Authenticated users can create abandoned carts" 
ON public.abandoned_carts 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role))
);

-- Allow anonymous session tracking for cart abandonment (but restrict to system use)
CREATE POLICY "System can track anonymous carts" 
ON public.abandoned_carts 
FOR INSERT 
WITH CHECK (
  -- Only allow creation with session_id if no sensitive customer data is included
  user_id IS NULL AND 
  session_id IS NOT NULL AND
  customer_email IS NULL AND 
  customer_name IS NULL
);