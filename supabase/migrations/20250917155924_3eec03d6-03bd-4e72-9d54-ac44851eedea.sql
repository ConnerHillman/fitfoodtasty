-- Fix user_subscriptions table structure and relationships
-- First, drop the existing table if it has incorrect structure
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;

-- Create user_subscriptions table with proper structure for dynamic subscriptions
CREATE TABLE public.user_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    stripe_subscription_id text UNIQUE,
    stripe_customer_id text,
    status text NOT NULL DEFAULT 'active',
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    next_delivery_date date,
    delivery_address text,
    delivery_instructions text,
    delivery_method text DEFAULT 'delivery',
    delivery_frequency text DEFAULT 'weekly',
    meal_preferences jsonb DEFAULT '{}',
    subscription_items jsonb DEFAULT '[]', -- Store the actual meal items for dynamic subscriptions
    pause_reason text,
    paused_until date,
    cancellation_reason text,
    cancelled_at timestamp with time zone,
    last_charge_date timestamp with time zone,
    next_charge_date timestamp with time zone,
    trial_ends_at timestamp with time zone,
    total_deliveries_count integer DEFAULT 0,
    paused_deliveries_count integer DEFAULT 0,
    skip_next_delivery boolean DEFAULT false,
    delivery_zone_id uuid REFERENCES public.delivery_zones(id),
    collection_point_id uuid REFERENCES public.collection_points(id),
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions"
    ON public.user_subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions"
    ON public.user_subscriptions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
    ON public.user_subscriptions
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions"
    ON public.user_subscriptions
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_subscription_id ON public.user_subscriptions(stripe_subscription_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_next_delivery_date ON public.user_subscriptions(next_delivery_date);

-- Create subscription_deliveries table to track individual deliveries
CREATE TABLE IF NOT EXISTS public.subscription_deliveries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_subscription_id uuid REFERENCES public.user_subscriptions(id) ON DELETE CASCADE NOT NULL,
    delivery_date date NOT NULL,
    production_date date,
    status text DEFAULT 'scheduled', -- scheduled, produced, delivered, skipped, cancelled
    order_id uuid REFERENCES public.orders(id), -- Link to actual order when created
    package_order_id uuid REFERENCES public.package_orders(id), -- Link to package order when created
    delivery_notes text,
    tracking_info text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS for subscription_deliveries
ALTER TABLE public.subscription_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_deliveries
CREATE POLICY "Users can view their own subscription deliveries"
    ON public.subscription_deliveries
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.user_subscriptions 
        WHERE id = user_subscription_id AND user_id = auth.uid()
    ));

CREATE POLICY "Admins can manage all subscription deliveries"
    ON public.subscription_deliveries
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger for subscription_deliveries
CREATE TRIGGER update_subscription_deliveries_updated_at
    BEFORE UPDATE ON public.subscription_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for subscription_deliveries
CREATE INDEX idx_subscription_deliveries_user_subscription_id ON public.subscription_deliveries(user_subscription_id);
CREATE INDEX idx_subscription_deliveries_delivery_date ON public.subscription_deliveries(delivery_date);
CREATE INDEX idx_subscription_deliveries_status ON public.subscription_deliveries(status);