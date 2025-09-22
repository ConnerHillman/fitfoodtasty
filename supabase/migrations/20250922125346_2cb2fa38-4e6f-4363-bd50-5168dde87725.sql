-- Create RPC function for customer search (admin only)
CREATE OR REPLACE FUNCTION public.search_customers(search_term text)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  email text,
  phone text,
  delivery_address text,
  postal_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Return matching customers
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    au.email,
    p.phone,
    p.delivery_address,
    p.postal_code
  FROM public.profiles p
  JOIN auth.users au ON p.user_id = au.id
  WHERE 
    search_term = '' OR
    LOWER(p.full_name) LIKE LOWER('%' || search_term || '%') OR
    LOWER(au.email) LIKE LOWER('%' || search_term || '%') OR
    LOWER(p.phone) LIKE LOWER('%' || search_term || '%') OR
    LOWER(p.postal_code) LIKE LOWER('%' || search_term || '%')
  ORDER BY p.full_name
  LIMIT 10;
END;
$$;