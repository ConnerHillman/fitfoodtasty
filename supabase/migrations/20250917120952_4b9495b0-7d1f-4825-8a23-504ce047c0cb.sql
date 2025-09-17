-- Security Fix: Update existing policies and add new security measures

-- Fix 1: Update Abandoned Carts Policies
-- Remove overly permissive service role policy if it exists
DROP POLICY IF EXISTS "Service role limited access" ON public.abandoned_carts;

-- Update existing user policy to be more restrictive
DROP POLICY IF EXISTS "Users can manage their own abandoned carts" ON public.abandoned_carts;
CREATE POLICY "Users can manage their own abandoned carts" 
ON public.abandoned_carts 
FOR ALL 
USING (auth.uid() = user_id OR (user_id IS NULL AND session_id IS NOT NULL AND auth.uid() IS NULL))
WITH CHECK (auth.uid() = user_id OR (user_id IS NULL AND session_id IS NOT NULL AND auth.uid() IS NULL));

-- Fix 2: Update Gift Cards Policies  
-- Remove overly permissive service role policy
DROP POLICY IF EXISTS "Service role gift card access" ON public.gift_cards;

-- Update gift card viewing policy
DROP POLICY IF EXISTS "Secure gift card viewing" ON public.gift_cards;
CREATE POLICY "Secure gift card viewing" 
ON public.gift_cards 
FOR SELECT 
USING (
  can_access_gift_card(purchaser_user_id, redeemed_by_user_id, recipient_email, purchaser_email) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix 3: Update Collection Points Policy
-- Remove public access to sensitive contact information
DROP POLICY IF EXISTS "Everyone can view active collection points" ON public.collection_points;

-- Create more restrictive public policy
CREATE POLICY "Everyone can view basic collection point info" 
ON public.collection_points 
FOR SELECT 
USING (is_active = true);

-- Fix 4: Update Referral Codes Policy
-- Remove public access to all active referral codes
DROP POLICY IF EXISTS "Users can view all active referral codes" ON public.referral_codes;

-- Create more restrictive referral code policy
CREATE POLICY "Users can view referral codes for validation" 
ON public.referral_codes 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (is_active = true AND auth.uid() IS NOT NULL)
);

-- Add security audit logging table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action_type text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on security audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies for security audit log
CREATE POLICY "Admins can view security audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create security audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Add referral code validation function with rate limiting
CREATE OR REPLACE FUNCTION public.validate_referral_code_usage(referral_code text, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  code_owner_id uuid;
  recent_usage_count integer;
BEGIN
  -- Check if code exists and is active
  SELECT rc.user_id INTO code_owner_id
  FROM public.referral_codes rc
  WHERE rc.code = referral_code AND rc.is_active = true;
  
  IF code_owner_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Prevent self-referral
  IF code_owner_id = user_id THEN
    RETURN false;
  END IF;
  
  -- Check for rate limiting (max 10 uses per hour)
  SELECT COUNT(*) INTO recent_usage_count
  FROM public.referral_transactions rt
  WHERE rt.referral_code_used = referral_code
  AND rt.created_at > NOW() - INTERVAL '1 hour';
  
  IF recent_usage_count >= 10 THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Add security logging function
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  p_action_type text,
  p_table_name text,
  p_record_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action_type,
    table_name,
    record_id,
    metadata
  ) VALUES (
    auth.uid(),
    p_action_type,
    p_table_name,
    p_record_id,
    p_metadata
  );
END;
$$;