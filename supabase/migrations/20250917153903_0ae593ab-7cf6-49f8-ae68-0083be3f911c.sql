-- Phase 1: Database Schema Enhancement for Subscription System
-- This migration enhances existing subscription tables and adds proper security

-- First, let's add missing fields and constraints to subscription_plans
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS max_pauses_per_period integer DEFAULT 2,
ADD COLUMN IF NOT EXISTS pause_duration_days integer DEFAULT 7,
ADD COLUMN IF NOT EXISTS cancellation_period_days integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS trial_period_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS minimum_commitment_deliveries integer DEFAULT 0;

-- Add proper constraints to subscription_plans
ALTER TABLE public.subscription_plans 
ADD CONSTRAINT subscription_plans_delivery_frequency_check 
CHECK (delivery_frequency IN ('weekly', 'bi-weekly', 'monthly'));

-- Enhance user_subscriptions table with additional fields
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS delivery_zone_id uuid REFERENCES public.delivery_zones(id),
ADD COLUMN IF NOT EXISTS collection_point_id uuid REFERENCES public.collection_points(id),
ADD COLUMN IF NOT EXISTS delivery_method text DEFAULT 'delivery' CHECK (delivery_method IN ('delivery', 'collection')),
ADD COLUMN IF NOT EXISTS pause_reason text,
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_charge_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS next_charge_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS total_deliveries_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS paused_deliveries_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS skip_next_delivery boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Add proper constraints to user_subscriptions
ALTER TABLE public.user_subscriptions 
ADD CONSTRAINT user_subscriptions_status_check 
CHECK (status IN ('trialing', 'active', 'paused', 'cancelled', 'past_due', 'incomplete'));

-- Add foreign key constraints that were missing
ALTER TABLE public.user_subscriptions 
ADD CONSTRAINT user_subscriptions_subscription_plan_id_fkey 
FOREIGN KEY (subscription_plan_id) REFERENCES public.subscription_plans(id),
ADD CONSTRAINT user_subscriptions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enhance subscription_deliveries table
ALTER TABLE public.subscription_deliveries 
ADD COLUMN IF NOT EXISTS delivery_zone_id uuid REFERENCES public.delivery_zones(id),
ADD COLUMN IF NOT EXISTS collection_point_id uuid REFERENCES public.collection_points(id),
ADD COLUMN IF NOT EXISTS production_date date,
ADD COLUMN IF NOT EXISTS delivery_method text DEFAULT 'delivery' CHECK (delivery_method IN ('delivery', 'collection')),
ADD COLUMN IF NOT EXISTS delivery_address text,
ADD COLUMN IF NOT EXISTS delivery_instructions text,
ADD COLUMN IF NOT EXISTS total_amount numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_amount numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_invoice_id text,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS skipped_reason text,
ADD COLUMN IF NOT EXISTS delivery_attempt_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_delivery_attempt timestamp with time zone,
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS customer_rating integer CHECK (customer_rating >= 1 AND customer_rating <= 5),
ADD COLUMN IF NOT EXISTS customer_feedback text,
ADD COLUMN IF NOT EXISTS admin_notes text;

-- Update subscription_deliveries status constraint
ALTER TABLE public.subscription_deliveries 
DROP CONSTRAINT IF EXISTS subscription_deliveries_status_check,
ADD CONSTRAINT subscription_deliveries_status_check 
CHECK (status IN ('scheduled', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'failed', 'skipped', 'cancelled'));

-- Add foreign key for subscription_deliveries
ALTER TABLE public.subscription_deliveries 
ADD CONSTRAINT subscription_deliveries_user_subscription_id_fkey 
FOREIGN KEY (user_subscription_id) REFERENCES public.user_subscriptions(id) ON DELETE CASCADE;

-- Create audit table for subscription changes
CREATE TABLE IF NOT EXISTS public.subscription_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_subscription_id uuid NOT NULL REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
    action_type text NOT NULL CHECK (action_type IN ('created', 'activated', 'paused', 'resumed', 'cancelled', 'plan_changed', 'address_updated', 'meal_preferences_updated', 'payment_updated')),
    old_values jsonb,
    new_values jsonb,
    performed_by uuid REFERENCES auth.users(id),
    reason text,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now()
);

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
CREATE POLICY "Public can view active subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can manage subscription plans" 
ON public.subscription_plans 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.user_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create their own subscriptions" 
ON public.user_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" 
ON public.user_subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all subscriptions" 
ON public.user_subscriptions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for subscription_deliveries
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

CREATE POLICY "Admins can manage all deliveries" 
ON public.subscription_deliveries 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for subscription_audit_log
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

CREATE POLICY "System can create audit log entries" 
ON public.subscription_audit_log 
FOR INSERT 
WITH CHECK (true); -- Audit logs should always be insertable for tracking

CREATE POLICY "Admins can view all audit logs" 
ON public.subscription_audit_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create helper function to log subscription changes
CREATE OR REPLACE FUNCTION public.log_subscription_change(
    p_user_subscription_id uuid,
    p_action_type text,
    p_old_values jsonb DEFAULT NULL,
    p_new_values jsonb DEFAULT NULL,
    p_reason text DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    log_id uuid;
BEGIN
    INSERT INTO public.subscription_audit_log (
        user_subscription_id,
        action_type,
        old_values,
        new_values,
        performed_by,
        reason,
        metadata
    ) VALUES (
        p_user_subscription_id,
        p_action_type,
        p_old_values,
        p_new_values,
        auth.uid(),
        p_reason,
        p_metadata
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- Create function to calculate next delivery date
CREATE OR REPLACE FUNCTION public.calculate_next_delivery_date(
    p_current_date date,
    p_delivery_frequency text,
    p_delivery_zone_id uuid DEFAULT NULL
)
RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_date date;
    days_to_add integer;
BEGIN
    -- Calculate base interval
    CASE p_delivery_frequency
        WHEN 'weekly' THEN days_to_add := 7;
        WHEN 'bi-weekly' THEN days_to_add := 14;
        WHEN 'monthly' THEN days_to_add := 30;
        ELSE days_to_add := 7; -- Default to weekly
    END CASE;
    
    next_date := p_current_date + days_to_add;
    
    -- If delivery zone is specified, adjust for delivery days
    IF p_delivery_zone_id IS NOT NULL THEN
        next_date := public.get_next_delivery_date(p_delivery_zone_id, extract(dow from next_date)::text);
    END IF;
    
    RETURN next_date;
END;
$$;

-- Create trigger to automatically update timestamps
CREATE OR REPLACE FUNCTION public.update_subscription_timestamps()
RETURNS trigger
LANGUAGE plpgsql
AS $$
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
$$;

-- Create triggers
CREATE TRIGGER update_user_subscriptions_timestamps
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_subscription_timestamps();

CREATE TRIGGER update_subscription_deliveries_timestamps
    BEFORE UPDATE ON public.subscription_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_timestamps
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();