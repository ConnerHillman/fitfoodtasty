-- Fix Security Definer View issue
-- Recreate the view with SECURITY INVOKER (default, but explicit is better)
DROP VIEW IF EXISTS public.collection_points_public;

CREATE VIEW public.collection_points_public 
WITH (security_invoker = true)
AS
SELECT 
    id,
    point_name,
    address,
    city,
    postcode,
    collection_days,
    collection_fee,
    opening_hours,
    special_instructions,
    is_active,
    maximum_capacity,
    order_cutoffs,
    created_at,
    updated_at
FROM public.collection_points
WHERE is_active = true;

-- Grant access to the public view
GRANT SELECT ON public.collection_points_public TO anon, authenticated;