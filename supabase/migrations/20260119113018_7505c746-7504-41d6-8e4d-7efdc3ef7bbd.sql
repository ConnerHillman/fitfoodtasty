-- Add first_name and last_name columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Migrate existing full_name data to first_name and last_name
-- Split on first space: everything before first space = first_name, rest = last_name
UPDATE public.profiles
SET 
  first_name = CASE 
    WHEN full_name IS NOT NULL AND full_name != '' THEN
      CASE 
        WHEN position(' ' in full_name) > 0 THEN trim(substring(full_name from 1 for position(' ' in full_name) - 1))
        ELSE full_name
      END
    ELSE NULL
  END,
  last_name = CASE 
    WHEN full_name IS NOT NULL AND full_name != '' AND position(' ' in full_name) > 0 THEN
      trim(substring(full_name from position(' ' in full_name) + 1))
    ELSE NULL
  END;

-- Create an index for name search performance
CREATE INDEX IF NOT EXISTS idx_profiles_first_name ON public.profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name ON public.profiles(last_name);

-- Add a generated column for full display name (for compatibility)
-- We'll keep full_name for backward compatibility and update it via trigger

-- Create trigger function to keep full_name in sync
CREATE OR REPLACE FUNCTION public.sync_full_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.full_name := COALESCE(
    NULLIF(TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '')), ''),
    NEW.full_name
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-update full_name when first_name or last_name changes
DROP TRIGGER IF EXISTS sync_profile_full_name ON public.profiles;
CREATE TRIGGER sync_profile_full_name
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_full_name();