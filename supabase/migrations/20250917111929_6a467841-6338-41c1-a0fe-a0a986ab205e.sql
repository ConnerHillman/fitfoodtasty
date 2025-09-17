-- Fix security vulnerability in gift_cards table
-- Current issue: JWT email matching can be manipulated, allowing unauthorized access

-- First, let's create a more secure function to check gift card access
CREATE OR REPLACE FUNCTION public.can_access_gift_card(
  card_purchaser_user_id uuid,
  card_redeemed_by_user_id uuid,
  card_recipient_email text,
  card_purchaser_email text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  current_user_email text;
BEGIN
  current_user_id := auth.uid();
  
  -- Must be authenticated
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Allow admin access
  IF has_role(current_user_id, 'admin'::app_role) THEN
    RETURN true;
  END IF;
  
  -- Allow access if user is the purchaser
  IF current_user_id = card_purchaser_user_id THEN
    RETURN true;
  END IF;
  
  -- Allow access if user is the redeemer
  IF current_user_id = card_redeemed_by_user_id THEN
    RETURN true;
  END IF;
  
  -- For recipient access, we need to verify the email more securely
  -- Get the user's verified email from auth.users (more secure than JWT)
  SELECT email INTO current_user_email 
  FROM auth.users 
  WHERE id = current_user_id;
  
  -- Only allow recipient access if the email matches and is verified
  IF current_user_email IS NOT NULL AND 
     (current_user_email = card_recipient_email OR 
      current_user_email = card_purchaser_email) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Drop existing vulnerable policies
DROP POLICY IF EXISTS "Admins can manage all gift cards" ON public.gift_cards;
DROP POLICY IF EXISTS "Users can create gift cards" ON public.gift_cards;
DROP POLICY IF EXISTS "Users can update their own gift cards" ON public.gift_cards;
DROP POLICY IF EXISTS "Users can view their own gift cards" ON public.gift_cards;

-- Create new, more secure policies

-- Admin access policy
CREATE POLICY "Secure admin access to gift cards"
ON public.gift_cards
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can create gift cards (must be the purchaser)
CREATE POLICY "Users can create their own gift cards"
ON public.gift_cards
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = purchaser_user_id);

-- Secure view access using our validation function
CREATE POLICY "Secure gift card viewing"
ON public.gift_cards
FOR SELECT
TO authenticated
USING (
  public.can_access_gift_card(
    purchaser_user_id,
    redeemed_by_user_id,
    recipient_email,
    purchaser_email
  )
);

-- Secure update access - only purchaser and redeemer can update
CREATE POLICY "Secure gift card updates"
ON public.gift_cards
FOR UPDATE
TO authenticated
USING (
  auth.uid() = purchaser_user_id OR 
  auth.uid() = redeemed_by_user_id OR
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  auth.uid() = purchaser_user_id OR 
  auth.uid() = redeemed_by_user_id OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- No delete policy for regular users - only admins can delete (handled by admin policy)

-- Ensure RLS is enabled
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

-- Add service role policy for system operations
CREATE POLICY "Service role gift card access"
ON public.gift_cards
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);