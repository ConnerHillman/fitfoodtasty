
-- =====================================================
-- MIGRATION: Make profiles.full_name OAuth-safe
-- =====================================================
-- This migration:
-- 1. Makes full_name nullable for OAuth users who may not have names
-- 2. Adds a default empty string to avoid NOT NULL violations
-- 3. Updates sync_full_name trigger to handle null names properly
-- 4. Updates handle_new_user to extract names from OAuth providers
-- =====================================================

-- Step 1: Make full_name nullable with a default
ALTER TABLE public.profiles 
  ALTER COLUMN full_name DROP NOT NULL,
  ALTER COLUMN full_name SET DEFAULT '';

-- Step 2: Create or replace the sync_full_name trigger function
-- This syncs full_name from first_name + last_name on INSERT and UPDATE
CREATE OR REPLACE FUNCTION public.sync_full_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Build full_name from first_name and last_name
  -- Only update if we have at least one name component
  IF NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL THEN
    NEW.full_name := NULLIF(TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '')), '');
  END IF;
  
  -- If full_name is still null after sync, keep existing value or set empty string
  IF NEW.full_name IS NULL THEN
    NEW.full_name := COALESCE(OLD.full_name, '');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 3: Create the trigger on profiles if it doesn't exist
DROP TRIGGER IF EXISTS trigger_sync_full_name ON public.profiles;
CREATE TRIGGER trigger_sync_full_name
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_full_name();

-- Step 4: Update handle_new_user to properly extract OAuth provider names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_first_name text;
  v_last_name text;
  v_full_name text;
  v_phone text;
  v_existing_profile_id uuid;
BEGIN
  -- Check if profile already exists (idempotent)
  SELECT id INTO v_existing_profile_id 
  FROM public.profiles 
  WHERE user_id = NEW.id;
  
  IF v_existing_profile_id IS NOT NULL THEN
    -- Profile exists, skip creation
    RETURN NEW;
  END IF;

  -- Extract first name from various OAuth metadata structures
  -- Priority: explicit first_name > Google given_name > Apple name.firstName
  v_first_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'first_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'given_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data -> 'name' ->> 'firstName'), '')
  );
  
  -- Extract last name from various OAuth metadata structures
  -- Priority: explicit last_name > Google family_name > Apple name.lastName
  v_last_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'last_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'family_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data -> 'name' ->> 'lastName'), '')
  );
  
  -- Build full_name from components or use provided full_name
  -- Priority: first+last > explicit full_name > Google 'name' field > NULL
  IF v_first_name IS NOT NULL OR v_last_name IS NOT NULL THEN
    v_full_name := NULLIF(TRIM(COALESCE(v_first_name, '') || ' ' || COALESCE(v_last_name, '')), '');
  ELSE
    v_full_name := COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), '')
    );
    
    -- If we only have full_name, try to split it for first/last
    IF v_full_name IS NOT NULL AND v_first_name IS NULL AND v_last_name IS NULL THEN
      v_first_name := SPLIT_PART(v_full_name, ' ', 1);
      v_last_name := NULLIF(TRIM(SUBSTR(v_full_name, LENGTH(v_first_name) + 2)), '');
    END IF;
  END IF;
  
  -- Extract phone (may be provided by some OAuth flows or email signup)
  v_phone := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'phone'), '');

  -- Insert profile with extracted data
  -- Empty strings used for required fields to ensure backward compatibility
  INSERT INTO public.profiles (
    user_id, 
    first_name, 
    last_name, 
    full_name, 
    phone, 
    delivery_address, 
    city, 
    postal_code,
    county
  )
  VALUES (
    NEW.id,
    v_first_name,
    v_last_name,
    COALESCE(v_full_name, ''),
    COALESCE(v_phone, ''),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'delivery_address'), ''), ''),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'city'), ''), ''),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'postal_code'), ''), ''),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'county'), ''), '')
  );
  
  RETURN NEW;
END;
$$;

-- Step 5: Ensure the trigger exists on auth.users for new user creation
-- Note: This trigger should already exist, but we ensure it's properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
