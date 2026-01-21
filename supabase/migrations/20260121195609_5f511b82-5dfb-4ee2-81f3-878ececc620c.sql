-- Add public read access policy for collection_points
-- The collection_points_public view already filters out sensitive columns (phone, email)
-- This policy allows anyone to SELECT from the base table, which enables the view to work
CREATE POLICY "Public can view active collection points"
ON public.collection_points
FOR SELECT
TO public
USING (is_active = true);