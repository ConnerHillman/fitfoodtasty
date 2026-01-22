-- Create RPC function to securely retrieve customer emails from auth.users for admin use
CREATE OR REPLACE FUNCTION public.get_customer_emails(user_ids uuid[])
RETURNS TABLE(user_id uuid, email text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller has admin role
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Return user_id and email pairs from auth.users
  RETURN QUERY
  SELECT au.id, au.email::text
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;

-- Grant execute permission to authenticated users (RPC handles its own authorization)
GRANT EXECUTE ON FUNCTION public.get_customer_emails(uuid[]) TO authenticated;