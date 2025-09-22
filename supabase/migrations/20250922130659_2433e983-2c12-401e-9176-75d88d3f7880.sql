-- Fix circular dependency in has_role function by replacing it
-- This replaces the existing function to avoid dependency issues
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use a direct query that bypasses RLS by using SECURITY DEFINER privileges
  -- This prevents the circular dependency issue since SECURITY DEFINER allows
  -- the function to execute with elevated privileges
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error, return false for safety
    RETURN false;
END;
$$;