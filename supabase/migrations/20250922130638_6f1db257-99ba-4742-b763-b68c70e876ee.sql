-- Fix circular dependency in has_role function
-- The issue is that has_role queries user_roles, but user_roles RLS policy calls has_role
-- We need to create a version that can bypass RLS when called internally

DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use a direct query that bypasses RLS by using SECURITY DEFINER privileges
  -- This prevents the circular dependency issue
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$$;