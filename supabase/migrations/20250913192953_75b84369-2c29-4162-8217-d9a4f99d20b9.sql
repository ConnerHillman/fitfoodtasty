-- Add admin access to profiles table for business operations
-- while maintaining user privacy and security

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Note: We don't add admin INSERT policy since profiles should only be created by the user themselves
-- Note: We don't add admin DELETE policy since profiles should not be deleted, only deactivated