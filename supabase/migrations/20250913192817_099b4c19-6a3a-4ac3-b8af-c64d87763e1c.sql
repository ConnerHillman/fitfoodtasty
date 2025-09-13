-- Secure abandoned cart email tables - restrict to admin-only access

-- Fix abandoned_cart_emails table
DROP POLICY IF EXISTS "Authenticated users can view email logs" ON public.abandoned_cart_emails;
DROP POLICY IF EXISTS "System can manage email logs" ON public.abandoned_cart_emails;

CREATE POLICY "Admins can view email logs" 
ON public.abandoned_cart_emails 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage email logs" 
ON public.abandoned_cart_emails 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix abandoned_cart_email_templates table
DROP POLICY IF EXISTS "Authenticated users can manage email templates" ON public.abandoned_cart_email_templates;

CREATE POLICY "Admins can manage email templates" 
ON public.abandoned_cart_email_templates 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix abandoned_cart_settings table
DROP POLICY IF EXISTS "Authenticated users can manage abandoned cart settings" ON public.abandoned_cart_settings;

CREATE POLICY "Admins can manage abandoned cart settings" 
ON public.abandoned_cart_settings 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));