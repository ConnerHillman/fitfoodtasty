-- Fix all remaining functions with missing search_path

-- Fix generate_referral_code function
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_email text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
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
$$;

-- Fix create_user_referral_code function
CREATE OR REPLACE FUNCTION public.create_user_referral_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
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
$$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, delivery_address, city, postal_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'delivery_address', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'city', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'postal_code', '')
  );
  RETURN NEW;
END;
$$;

-- Fix set_meal_sort_order function
CREATE OR REPLACE FUNCTION public.set_meal_sort_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $$
BEGIN
  -- Get the highest sort_order and add 1, or start at 0 if no meals exist
  SELECT COALESCE(MAX(sort_order), -1) + 1 INTO NEW.sort_order FROM public.meals;
  RETURN NEW;
END;
$$;