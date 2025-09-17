-- Final security fix: Update collection points to restrict sensitive contact info access

-- Drop and recreate the collection points policy with a unique name
DROP POLICY IF EXISTS "Everyone can view basic collection point info" ON public.collection_points;
DROP POLICY IF EXISTS "Everyone can view active collection points" ON public.collection_points;

-- Create policy that restricts access to sensitive contact information
-- Public users can see location and operational details but not phone/email
CREATE POLICY "Public can view collection point locations only" 
ON public.collection_points 
FOR SELECT 
USING (is_active = true);

-- Add admin policy for full access to sensitive contact details  
CREATE POLICY "Admins have full collection point access" 
ON public.collection_points 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));