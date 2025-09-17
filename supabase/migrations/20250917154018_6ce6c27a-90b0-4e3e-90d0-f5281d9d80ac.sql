-- Phase 1 Continued: Create audit table, indexes, RLS policies, and helper functions

-- Create audit table for subscription changes
CREATE TABLE IF NOT EXISTS public.subscription_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_subscription_id uuid NOT NULL,
    action_type text NOT NULL CHECK (action_type IN ('created', 'activated', 'paused', 'resumed', 'cancelled', 'plan_changed', 'address_updated', 'meal_preferences_updated', 'payment_updated')),
    old_values jsonb,
    new_values jsonb,
    performed_by uuid,
    reason text,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now()
);

-- Add foreign key constraints for audit table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscription_audit_log_user_subscription_id_fkey') THEN
        ALTER TABLE public.subscription_audit_log 
        ADD CONSTRAINT subscription_audit_log_user_subscription_id_fkey 
        FOREIGN KEY (user_subscription_id) REFERENCES public.user_subscriptions(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscription_audit_log_performed_by_fkey') THEN
        ALTER TABLE public.subscription_audit_log 
        ADD CONSTRAINT subscription_audit_log_performed_by_fkey 
        FOREIGN KEY (performed_by) REFERENCES auth.users(id);
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_next_delivery_date ON public.user_subscriptions(next_delivery_date);
CREATE INDEX IF NOT EXISTS idx_subscription_deliveries_user_subscription_id ON public.subscription_deliveries(user_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_deliveries_planned_delivery_date ON public.subscription_deliveries(planned_delivery_date);
CREATE INDEX IF NOT EXISTS idx_subscription_deliveries_status ON public.subscription_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_subscription_audit_log_user_subscription_id ON public.subscription_audit_log(user_subscription_id);

-- Enable RLS on all subscription tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (publicly viewable active plans)
DROP POLICY IF EXISTS "Public can view active subscription plans" ON public.subscription_plans;
CREATE POLICY "Public can view active subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can manage subscription plans" ON public.subscription_plans;
CREATE POLICY "Authenticated users can manage subscription plans" 
ON public.subscription_plans 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view their own subscriptions" 
ON public.user_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can create their own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can create their own subscriptions" 
ON public.user_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can update their own subscriptions" 
ON public.user_subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can manage all subscriptions" 
ON public.user_subscriptions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for subscription_deliveries
DROP POLICY IF EXISTS "Users can view their own delivery history" ON public.subscription_deliveries;
CREATE POLICY "Users can view their own delivery history" 
ON public.subscription_deliveries 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.user_subscriptions 
        WHERE id = subscription_deliveries.user_subscription_id 
        AND user_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "System can create delivery records" ON public.subscription_deliveries;
CREATE POLICY "System can create delivery records" 
ON public.subscription_deliveries 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_subscriptions 
        WHERE id = subscription_deliveries.user_subscription_id 
        AND (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
);

DROP POLICY IF EXISTS "Admins can manage all deliveries" ON public.subscription_deliveries;
CREATE POLICY "Admins can manage all deliveries" 
ON public.subscription_deliveries 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for subscription_audit_log
DROP POLICY IF EXISTS "Users can view their own subscription audit log" ON public.subscription_audit_log;
CREATE POLICY "Users can view their own subscription audit log" 
ON public.subscription_audit_log 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.user_subscriptions 
        WHERE id = subscription_audit_log.user_subscription_id 
        AND user_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "System can create audit log entries" ON public.subscription_audit_log;
CREATE POLICY "System can create audit log entries" 
ON public.subscription_audit_log 
FOR INSERT 
WITH CHECK (true); -- Audit logs should always be insertable for tracking

DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.subscription_audit_log;
CREATE POLICY "Admins can view all audit logs" 
ON public.subscription_audit_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));