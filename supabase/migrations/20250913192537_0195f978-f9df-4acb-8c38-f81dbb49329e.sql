-- Fix security vulnerability in abandoned_carts table
-- Remove the overly permissive policy that allows any authenticated user to view all abandoned carts
DROP POLICY IF EXISTS "Users can view their own abandoned carts" ON public.abandoned_carts;

-- Create a secure policy that only allows users to view their own abandoned carts
CREATE POLICY "Users can view their own abandoned carts" 
ON public.abandoned_carts 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a separate policy for admins to view all abandoned carts for management purposes
CREATE POLICY "Admins can view all abandoned carts" 
ON public.abandoned_carts 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Update the system management policy to be more specific - only admins should manage all carts
DROP POLICY IF EXISTS "System can manage abandoned carts" ON public.abandoned_carts;

CREATE POLICY "Admins can manage all abandoned carts" 
ON public.abandoned_carts 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow users to insert their own abandoned carts (for the system to track them)
CREATE POLICY "Users can create their own abandoned carts" 
ON public.abandoned_carts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own abandoned carts (for recovery tracking)
CREATE POLICY "Users can update their own abandoned carts" 
ON public.abandoned_carts 
FOR UPDATE 
USING (auth.uid() = user_id);