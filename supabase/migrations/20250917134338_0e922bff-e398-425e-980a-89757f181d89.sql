-- Update subscription plans with Stripe IDs
UPDATE public.subscription_plans 
SET stripe_product_id = 'prod_T4Ucjr7bSgyNbL', stripe_price_id = 'price_1S8LdFB9XVWvIR2Eu10BQlAQ'
WHERE name = 'Weekly Starter';

UPDATE public.subscription_plans 
SET stripe_product_id = 'prod_T4UciMxOmXaqUi', stripe_price_id = 'price_1S8LdRB9XVWvIR2EVyWUUh7U'
WHERE name = 'Weekly Standard';

UPDATE public.subscription_plans 
SET stripe_product_id = 'prod_T4Ucp7Ka3MxKQ7', stripe_price_id = 'price_1S8LddB9XVWvIR2EcbnRfC4h'
WHERE name = 'Weekly Family';

UPDATE public.subscription_plans 
SET stripe_product_id = 'prod_T4UdTJt7UxS9l5', stripe_price_id = 'price_1S8LdqPc19yGyC87vNat5iHw'
WHERE name = 'Monthly Meal Prep';