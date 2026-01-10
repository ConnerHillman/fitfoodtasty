-- =====================================================
-- SECURITY HARDENING MIGRATION
-- Fixes: Collection points contact exposure, overly permissive RLS, function search path
-- =====================================================

-- =====================================================
-- PHASE 1: FIX COLLECTION POINTS CONTACT EXPOSURE
-- =====================================================

-- Drop existing overly permissive policies on collection_points
DROP POLICY IF EXISTS "Authenticated users can manage collection points" ON public.collection_points;
DROP POLICY IF EXISTS "Public can view collection point locations only" ON public.collection_points;
DROP POLICY IF EXISTS "Public can view active collection points" ON public.collection_points;
DROP POLICY IF EXISTS "Anyone can view collection points" ON public.collection_points;

-- Create admin-only management policy for collection_points
CREATE POLICY "Admins can manage collection points"
ON public.collection_points
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Create a view for public collection point data (excludes phone/email)
CREATE OR REPLACE VIEW public.collection_points_public AS
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

-- Create secure function for admins to get full collection point details
CREATE OR REPLACE FUNCTION public.get_collection_point_full_details(p_collection_point_id uuid)
RETURNS TABLE (
    id uuid,
    point_name text,
    address text,
    city text,
    postcode text,
    phone text,
    email text,
    collection_days text[],
    collection_fee numeric,
    opening_hours jsonb,
    order_cutoffs jsonb,
    special_instructions text,
    is_active boolean,
    maximum_capacity integer,
    production_lead_days integer,
    production_same_day boolean,
    production_notes text,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Check if user is admin
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;
    
    RETURN QUERY
    SELECT 
        cp.id,
        cp.point_name,
        cp.address,
        cp.city,
        cp.postcode,
        cp.phone,
        cp.email,
        cp.collection_days,
        cp.collection_fee,
        cp.opening_hours,
        cp.order_cutoffs,
        cp.special_instructions,
        cp.is_active,
        cp.maximum_capacity,
        cp.production_lead_days,
        cp.production_same_day,
        cp.production_notes,
        cp.created_at,
        cp.updated_at
    FROM public.collection_points cp
    WHERE cp.id = p_collection_point_id;
END;
$$;

-- =====================================================
-- PHASE 2: FIX ALLERGENS TABLE - ADMIN ONLY MANAGEMENT
-- =====================================================

-- Drop existing overly permissive policies on allergens
DROP POLICY IF EXISTS "Authenticated users can manage allergens" ON public.allergens;
DROP POLICY IF EXISTS "Anyone can view allergens" ON public.allergens;
DROP POLICY IF EXISTS "Public can view allergens" ON public.allergens;

-- Create public read policy for allergens (needed for menu display)
CREATE POLICY "Public can read allergens"
ON public.allergens
FOR SELECT
TO anon, authenticated
USING (true);

-- Create admin-only management policy for allergens
CREATE POLICY "Admins can manage allergens"
ON public.allergens
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- PHASE 3: FIX CATEGORIES TABLE - ADMIN ONLY MANAGEMENT
-- =====================================================

-- Drop existing overly permissive policies on categories
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;

-- Create public read policy for categories (needed for menu display)
CREATE POLICY "Public can read categories"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (true);

-- Create admin-only management policy for categories
CREATE POLICY "Admins can manage categories"
ON public.categories
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- PHASE 4: FIX FUNCTION SEARCH PATH
-- =====================================================

-- Recreate update_subscription_timestamps with proper search_path
CREATE OR REPLACE FUNCTION public.update_subscription_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    
    -- Auto-calculate next delivery date if delivery frequency changed
    IF TG_OP = 'UPDATE' AND (OLD.delivery_frequency IS DISTINCT FROM NEW.delivery_frequency OR OLD.next_delivery_date IS DISTINCT FROM NEW.next_delivery_date) THEN
        IF NEW.next_delivery_date IS NOT NULL AND NEW.status = 'active' THEN
            NEW.next_delivery_date := public.calculate_next_delivery_date(
                NEW.next_delivery_date,
                NEW.delivery_frequency,
                NEW.delivery_zone_id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;