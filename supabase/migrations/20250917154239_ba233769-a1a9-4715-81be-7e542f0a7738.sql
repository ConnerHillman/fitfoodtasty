-- Phase 1 Final: Create helper functions and triggers

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
        -- Use existing delivery zone function if available
        BEGIN
            next_date := public.get_next_delivery_date(p_delivery_zone_id, NULL);
        EXCEPTION WHEN OTHERS THEN
            -- If function doesn't exist or fails, just use calculated date
            NULL;
        END;
    END IF;
    
    RETURN next_date;
END;
$$;

-- Create trigger function to automatically update timestamps and delivery dates
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

-- Create function to validate subscription cutoff times
CREATE OR REPLACE FUNCTION public.can_modify_subscription_delivery(
    p_user_subscription_id uuid,
    p_target_delivery_date date
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_delivery_zone_id uuid;
    v_cutoff_passed boolean := false;
BEGIN
    -- Get the delivery zone for this subscription
    SELECT delivery_zone_id INTO v_delivery_zone_id
    FROM public.user_subscriptions
    WHERE id = p_user_subscription_id;
    
    -- If no delivery zone, allow modification (fallback)
    IF v_delivery_zone_id IS NULL THEN
        RETURN true;
    END IF;
    
    -- Check if we're past the cutoff time for the target delivery date
    -- This would integrate with your existing delivery zone cutoff logic
    -- For now, return true (allow modifications)
    RETURN true;
END;
$$;

-- Create a function to check subscription plan eligibility
CREATE OR REPLACE FUNCTION public.check_subscription_plan_eligibility(
    p_user_id uuid,
    p_subscription_plan_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_plan record;
    v_existing_subscriptions integer;
    v_result jsonb;
BEGIN
    -- Get plan details
    SELECT * INTO v_plan
    FROM public.subscription_plans
    WHERE id = p_subscription_plan_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'eligible', false,
            'reason', 'Plan not found or inactive'
        );
    END IF;
    
    -- Check for existing active subscriptions
    SELECT COUNT(*) INTO v_existing_subscriptions
    FROM public.user_subscriptions
    WHERE user_id = p_user_id 
    AND status IN ('active', 'trialing', 'past_due');
    
    -- For now, allow multiple subscriptions
    -- You can add business rules here later
    
    RETURN jsonb_build_object(
        'eligible', true,
        'plan', row_to_json(v_plan),
        'existing_subscriptions', v_existing_subscriptions
    );
END;
$$;