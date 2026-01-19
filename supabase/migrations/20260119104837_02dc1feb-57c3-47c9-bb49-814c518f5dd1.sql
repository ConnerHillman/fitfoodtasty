-- Phase 1: Rename stripe_session_id to stripe_payment_intent_id for clarity
-- Orders table
ALTER TABLE public.orders 
RENAME COLUMN stripe_session_id TO stripe_payment_intent_id;

-- Package orders table
ALTER TABLE public.package_orders 
RENAME COLUMN stripe_session_id TO stripe_payment_intent_id;

-- Phase 2: Add unique partial indexes (allow NULL for admin/manual orders)
-- Unique constraint on orders - only for non-null payment intent IDs
CREATE UNIQUE INDEX idx_orders_stripe_payment_intent_id_unique 
ON public.orders (stripe_payment_intent_id) 
WHERE stripe_payment_intent_id IS NOT NULL;

-- Unique constraint on package_orders - only for non-null payment intent IDs
CREATE UNIQUE INDEX idx_package_orders_stripe_payment_intent_id_unique 
ON public.package_orders (stripe_payment_intent_id) 
WHERE stripe_payment_intent_id IS NOT NULL;

-- Unique constraint on gift_cards - only for non-null payment intent IDs
CREATE UNIQUE INDEX idx_gift_cards_stripe_payment_intent_id_unique 
ON public.gift_cards (stripe_payment_intent_id) 
WHERE stripe_payment_intent_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.stripe_payment_intent_id IS 'Stripe PaymentIntent ID - used for idempotent order creation';
COMMENT ON COLUMN public.package_orders.stripe_payment_intent_id IS 'Stripe PaymentIntent ID - used for idempotent order creation';