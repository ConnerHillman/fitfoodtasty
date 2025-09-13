-- Allow public read access to active delivery zones so guests can check availability
CREATE POLICY IF NOT EXISTS "Everyone can view active delivery zones"
ON public.delivery_zones
FOR SELECT
USING (is_active = true);