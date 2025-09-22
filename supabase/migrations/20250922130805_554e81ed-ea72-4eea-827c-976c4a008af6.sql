-- Replace the has_role function to fix circular dependency
-- We need to temporarily create a new version and update all references

CREATE OR REPLACE FUNCTION public.has_role_secure(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function bypasses RLS by using SECURITY DEFINER privileges
  -- and queries the user_roles table directly without triggering RLS policies
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$$;

-- Now update the original function to use the secure version
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role_secure(_user_id, _role)
$$;