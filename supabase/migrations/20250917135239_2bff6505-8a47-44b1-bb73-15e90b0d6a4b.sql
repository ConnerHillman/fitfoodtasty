-- Fix foreign key relationship between user_subscriptions and profiles
-- Add proper foreign key constraint for user_id
ALTER TABLE public.user_subscriptions 
ADD CONSTRAINT user_subscriptions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;