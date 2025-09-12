-- Create referral system tables

-- Table for user referral codes
CREATE TABLE public.referral_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id) -- One code per user
);

-- Table for user store credits
CREATE TABLE public.user_credits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_credits numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Table for referral transactions
CREATE TABLE public.referral_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  referral_code_used text NOT NULL,
  referrer_credit_earned numeric NOT NULL DEFAULT 0,
  referee_discount_given numeric NOT NULL DEFAULT 0,
  order_total numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add referral tracking to orders
ALTER TABLE public.orders 
ADD COLUMN referral_code_used text,
ADD COLUMN discount_amount numeric DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_codes
CREATE POLICY "Users can view all active referral codes" 
ON public.referral_codes 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Users can manage their own referral code" 
ON public.referral_codes 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for user_credits
CREATE POLICY "Users can view their own credits" 
ON public.user_credits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits" 
ON public.user_credits 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage user credits" 
ON public.user_credits 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- RLS Policies for referral_transactions
CREATE POLICY "Users can view their referral transactions" 
ON public.referral_transactions 
FOR SELECT 
USING (auth.uid() = referrer_user_id OR auth.uid() = referee_user_id);

CREATE POLICY "System can create referral transactions" 
ON public.referral_transactions 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_email text)
RETURNS text AS $$
DECLARE
  base_code text;
  final_code text;
  counter integer := 0;
BEGIN
  -- Extract first name from email and add random number
  base_code := UPPER(SUBSTRING(user_email FROM 1 FOR POSITION('@' IN user_email) - 1));
  base_code := REGEXP_REPLACE(base_code, '[^A-Z]', '', 'g');
  base_code := SUBSTRING(base_code FROM 1 FOR 6) || FLOOR(RANDOM() * 100)::text;
  
  final_code := base_code;
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.referral_codes WHERE code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || counter::text;
  END LOOP;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to create referral code for new users
CREATE OR REPLACE FUNCTION public.create_user_referral_code()
RETURNS trigger AS $$
BEGIN
  -- Create referral code
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (
    NEW.id,
    public.generate_referral_code(NEW.email)
  );
  
  -- Initialize user credits
  INSERT INTO public.user_credits (user_id, total_credits)
  VALUES (NEW.id, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create referral code for new users
CREATE TRIGGER create_referral_code_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_referral_code();

-- Function to update timestamps
CREATE TRIGGER update_referral_codes_updated_at
  BEFORE UPDATE ON public.referral_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();