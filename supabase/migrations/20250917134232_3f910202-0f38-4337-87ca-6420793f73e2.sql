-- Phase 1: Create subscription-related tables

-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  meal_count integer NOT NULL,
  price_per_delivery numeric NOT NULL,
  delivery_frequency text NOT NULL CHECK (delivery_frequency IN ('weekly', 'bi-weekly', 'monthly')),
  stripe_price_id text UNIQUE,
  stripe_product_id text,
  discount_percentage numeric DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  subscription_plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'past_due', 'unpaid')),
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  next_delivery_date date,
  delivery_address text,
  delivery_instructions text,
  meal_preferences jsonb DEFAULT '{}',
  paused_until date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create subscription deliveries table for tracking individual deliveries
CREATE TABLE public.subscription_deliveries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_subscription_id uuid NOT NULL REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  planned_delivery_date date NOT NULL,
  actual_delivery_date date,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'preparing', 'out_for_delivery', 'delivered', 'skipped', 'failed')),
  meal_selections jsonb,
  delivery_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
CREATE POLICY "Everyone can view active subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans" 
ON public.subscription_plans 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

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
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all subscriptions" 
ON public.user_subscriptions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for subscription_deliveries
CREATE POLICY "Users can view their own subscription deliveries" 
ON public.subscription_deliveries 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_subscriptions 
    WHERE id = user_subscription_id 
    AND user_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can update their own subscription deliveries" 
ON public.subscription_deliveries 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_subscriptions 
    WHERE id = user_subscription_id 
    AND user_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "System can manage subscription deliveries" 
ON public.subscription_deliveries 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_deliveries_updated_at
  BEFORE UPDATE ON public.subscription_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, meal_count, price_per_delivery, delivery_frequency, discount_percentage, sort_order) VALUES
('Weekly Starter', 'Perfect for trying our subscription service', 5, 42.00, 'weekly', 5, 1),
('Weekly Standard', 'Great for busy individuals', 10, 78.00, 'weekly', 10, 2),
('Weekly Family', 'Perfect for families', 15, 110.00, 'weekly', 15, 3),
('Bi-Weekly Starter', 'Flexible bi-weekly delivery', 5, 45.00, 'bi-weekly', 0, 4),
('Bi-Weekly Standard', 'Bi-weekly convenience', 10, 82.00, 'bi-weekly', 5, 5),
('Monthly Meal Prep', 'Monthly bulk delivery', 20, 160.00, 'monthly', 20, 6);