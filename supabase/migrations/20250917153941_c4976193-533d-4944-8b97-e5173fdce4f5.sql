-- Phase 1: Database Schema Enhancement for Subscription System (Fixed)
-- This migration enhances existing subscription tables and adds proper security

-- First, let's add missing fields to subscription_plans (using IF NOT EXISTS)
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS max_pauses_per_period integer DEFAULT 2,
ADD COLUMN IF NOT EXISTS pause_duration_days integer DEFAULT 7,
ADD COLUMN IF NOT EXISTS cancellation_period_days integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS trial_period_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS minimum_commitment_deliveries integer DEFAULT 0;

-- Add constraint only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscription_plans_delivery_frequency_check') THEN
        ALTER TABLE public.subscription_plans 
        ADD CONSTRAINT subscription_plans_delivery_frequency_check 
        CHECK (delivery_frequency IN ('weekly', 'bi-weekly', 'monthly'));
    END IF;
END $$;

-- Enhance user_subscriptions table with additional fields
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS delivery_zone_id uuid,
ADD COLUMN IF NOT EXISTS collection_point_id uuid,
ADD COLUMN IF NOT EXISTS delivery_method text DEFAULT 'delivery',
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

-- Add constraints only if they don't exist
DO $$ 
BEGIN
    -- Add delivery_method check constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_subscriptions_delivery_method_check') THEN
        ALTER TABLE public.user_subscriptions 
        ADD CONSTRAINT user_subscriptions_delivery_method_check 
        CHECK (delivery_method IN ('delivery', 'collection'));
    END IF;
    
    -- Add status check constraint  
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_subscriptions_status_check') THEN
        ALTER TABLE public.user_subscriptions 
        ADD CONSTRAINT user_subscriptions_status_check 
        CHECK (status IN ('trialing', 'active', 'paused', 'cancelled', 'past_due', 'incomplete'));
    END IF;
    
    -- Add foreign key constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_subscriptions_subscription_plan_id_fkey') THEN
        ALTER TABLE public.user_subscriptions 
        ADD CONSTRAINT user_subscriptions_subscription_plan_id_fkey 
        FOREIGN KEY (subscription_plan_id) REFERENCES public.subscription_plans(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_subscriptions_user_id_fkey') THEN
        ALTER TABLE public.user_subscriptions 
        ADD CONSTRAINT user_subscriptions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_subscriptions_delivery_zone_id_fkey') THEN
        ALTER TABLE public.user_subscriptions 
        ADD CONSTRAINT user_subscriptions_delivery_zone_id_fkey 
        FOREIGN KEY (delivery_zone_id) REFERENCES public.delivery_zones(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_subscriptions_collection_point_id_fkey') THEN
        ALTER TABLE public.user_subscriptions 
        ADD CONSTRAINT user_subscriptions_collection_point_id_fkey 
        FOREIGN KEY (collection_point_id) REFERENCES public.collection_points(id);
    END IF;
END $$;

-- Enhance subscription_deliveries table
ALTER TABLE public.subscription_deliveries 
ADD COLUMN IF NOT EXISTS delivery_zone_id uuid,
ADD COLUMN IF NOT EXISTS collection_point_id uuid,
ADD COLUMN IF NOT EXISTS production_date date,
ADD COLUMN IF NOT EXISTS delivery_method text DEFAULT 'delivery',
ADD COLUMN IF NOT EXISTS delivery_address text,
ADD COLUMN IF NOT EXISTS delivery_instructions text,
ADD COLUMN IF NOT EXISTS total_amount numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_amount numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_invoice_id text,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS skipped_reason text,
ADD COLUMN IF NOT EXISTS delivery_attempt_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_delivery_attempt timestamp with time zone,
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS customer_rating integer,
ADD COLUMN IF NOT EXISTS customer_feedback text,
ADD COLUMN IF NOT EXISTS admin_notes text;

-- Add constraints for subscription_deliveries
DO $$ 
BEGIN
    -- Drop existing status constraint if it exists and recreate
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscription_deliveries_status_check') THEN
        ALTER TABLE public.subscription_deliveries DROP CONSTRAINT subscription_deliveries_status_check;
    END IF;
    
    ALTER TABLE public.subscription_deliveries 
    ADD CONSTRAINT subscription_deliveries_status_check 
    CHECK (status IN ('scheduled', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'failed', 'skipped', 'cancelled'));
    
    -- Add other constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscription_deliveries_delivery_method_check') THEN
        ALTER TABLE public.subscription_deliveries 
        ADD CONSTRAINT subscription_deliveries_delivery_method_check 
        CHECK (delivery_method IN ('delivery', 'collection'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscription_deliveries_payment_status_check') THEN
        ALTER TABLE public.subscription_deliveries 
        ADD CONSTRAINT subscription_deliveries_payment_status_check 
        CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscription_deliveries_customer_rating_check') THEN
        ALTER TABLE public.subscription_deliveries 
        ADD CONSTRAINT subscription_deliveries_customer_rating_check 
        CHECK (customer_rating >= 1 AND customer_rating <= 5);
    END IF;
    
    -- Add foreign key constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscription_deliveries_user_subscription_id_fkey') THEN
        ALTER TABLE public.subscription_deliveries 
        ADD CONSTRAINT subscription_deliveries_user_subscription_id_fkey 
        FOREIGN KEY (user_subscription_id) REFERENCES public.user_subscriptions(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscription_deliveries_delivery_zone_id_fkey') THEN
        ALTER TABLE public.subscription_deliveries 
        ADD CONSTRAINT subscription_deliveries_delivery_zone_id_fkey 
        FOREIGN KEY (delivery_zone_id) REFERENCES public.delivery_zones(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscription_deliveries_collection_point_id_fkey') THEN
        ALTER TABLE public.subscription_deliveries 
        ADD CONSTRAINT subscription_deliveries_collection_point_id_fkey 
        FOREIGN KEY (collection_point_id) REFERENCES public.collection_points(id);
    END IF;
END $$;