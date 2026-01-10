-- Fix remaining permissive RLS policies while maintaining functionality

-- =====================================================
-- FIX 1: PAGE_VIEWS - Make insert more targeted
-- =====================================================
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;

-- Create a more secure insert policy that still allows tracking
-- Users can insert their own page views (authenticated or anonymous via session)
CREATE POLICY "Users can insert page views"
ON public.page_views
FOR INSERT
TO anon, authenticated
WITH CHECK (
    -- Authenticated users must set their own user_id or null
    (auth.uid() IS NULL OR user_id IS NULL OR user_id = auth.uid())
);

-- =====================================================
-- FIX 2: SUBSCRIPTION_AUDIT_LOG - Restrict to authenticated users
-- =====================================================
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can create audit log entries" ON public.subscription_audit_log;

-- Create policy that only allows authenticated users to create audit entries
-- The audit log should only be written by logged-in users or backend functions
CREATE POLICY "Authenticated users can create audit entries"
ON public.subscription_audit_log
FOR INSERT
TO authenticated
WITH CHECK (
    -- User must be authenticated and performed_by matches their ID or is null (for system)
    auth.uid() IS NOT NULL 
    AND (performed_by IS NULL OR performed_by = auth.uid())
);

-- Also ensure admins can read all audit logs
DROP POLICY IF EXISTS "Users can view their subscription audit logs" ON public.subscription_audit_log;

CREATE POLICY "Users can view their subscription audit logs"
ON public.subscription_audit_log
FOR SELECT
TO authenticated
USING (
    -- Admins can see all, users can see their own subscription's logs
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
        SELECT 1 FROM public.user_subscriptions us 
        WHERE us.id = subscription_audit_log.user_subscription_id 
        AND us.user_id = auth.uid()
    )
);