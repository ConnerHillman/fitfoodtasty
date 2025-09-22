-- Fix type mismatch in search_customers function
-- Cast all returned columns to match the RETURNS TABLE types
CREATE OR REPLACE FUNCTION public.search_customers(search_term text)
RETURNS TABLE(user_id uuid, full_name text, email text, phone text, delivery_address text, postal_code text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Return matching customers with proper type casting
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name::text,
    au.email::text,
    p.phone::text,
    p.delivery_address::text,
    p.postal_code::text
  FROM public.profiles p
  JOIN auth.users au ON p.user_id = au.id
  WHERE 
    search_term = '' OR
    LOWER(p.full_name) LIKE LOWER('%' || search_term || '%') OR
    LOWER(au.email::text) LIKE LOWER('%' || search_term || '%') OR
    LOWER(p.phone) LIKE LOWER('%' || search_term || '%') OR
    LOWER(p.postal_code) LIKE LOWER('%' || search_term || '%')
  ORDER BY p.full_name
  LIMIT 10;
END;
$$;