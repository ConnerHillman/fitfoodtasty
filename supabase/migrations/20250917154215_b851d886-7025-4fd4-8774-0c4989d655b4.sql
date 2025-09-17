-- Phase 1 Final: Add helper functions and triggers

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
    
    -- If delivery zone is specified, try to adjust for delivery days
    IF p_delivery_zone_id IS NOT NULL THEN
        -- Use existing get_next_delivery_date function if available
        BEGIN
            next_date := public.get_next_delivery_date(p_delivery_zone_id, NULL);
        EXCEPTION WHEN others THEN
            -- If function doesn't work, just use calculated date
            NULL;
        END;
    END IF;
    
    RETURN next_date;
END;
$$;

-- Create trigger function to automatically update subscription timestamps
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

-- Create triggers (drop first if they exist)
DROP TRIGGER IF EXISTS update_user_subscriptions_timestamps ON public.user_subscriptions;
CREATE TRIGGER update_user_subscriptions_timestamps
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_subscription_timestamps();

DROP TRIGGER IF EXISTS update_subscription_deliveries_timestamps ON public.subscription_deliveries;
CREATE TRIGGER update_subscription_deliveries_timestamps
    BEFORE UPDATE ON public.subscription_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_plans_timestamps ON public.subscription_plans;
CREATE TRIGGER update_subscription_plans_timestamps
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create a function to get subscription summary for admin
CREATE OR REPLACE FUNCTION public.get_subscription_summary()
RETURNS TABLE(
    total_subscriptions bigint,
    active_subscriptions bigint,
    paused_subscriptions bigint,
    cancelled_subscriptions bigint,
    trial_subscriptions bigint,
    monthly_revenue numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::bigint as total_subscriptions,
        COUNT(*) FILTER (WHERE status = 'active')::bigint as active_subscriptions,
        COUNT(*) FILTER (WHERE status = 'paused')::bigint as paused_subscriptions,
        COUNT(*) FILTER (WHERE status = 'cancelled')::bigint as cancelled_subscriptions,
        COUNT(*) FILTER (WHERE status = 'trialing')::bigint as trial_subscriptions,
        COALESCE(SUM(
            CASE 
                WHEN us.status = 'active' AND sp.delivery_frequency = 'weekly' THEN sp.price_per_delivery * 4.33
                WHEN us.status = 'active' AND sp.delivery_frequency = 'bi-weekly' THEN sp.price_per_delivery * 2.17
                WHEN us.status = 'active' AND sp.delivery_frequency = 'monthly' THEN sp.price_per_delivery
                ELSE 0
            END
        ), 0) as monthly_revenue
    FROM public.user_subscriptions us
    LEFT JOIN public.subscription_plans sp ON us.subscription_plan_id = sp.id
    WHERE us.status IN ('active', 'paused', 'cancelled', 'trialing');
END;
$$;