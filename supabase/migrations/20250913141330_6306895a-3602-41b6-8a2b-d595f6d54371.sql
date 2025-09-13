-- First, let's clean up the existing breakfast meals by setting them to 'unassigned'
UPDATE meals 
SET category = 'unassigned', updated_at = now() 
WHERE category = 'breakfast';

-- Create a function to handle category deletion cleanup
CREATE OR REPLACE FUNCTION public.handle_category_deletion()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When a category is deleted, update all meals with that category to 'unassigned'
  UPDATE public.meals 
  SET category = 'unassigned', 
      updated_at = now()
  WHERE category = OLD.name;
  
  -- Log how many meals were affected
  RAISE NOTICE 'Updated % meals from category "%" to "unassigned"', 
    (SELECT COUNT(*) FROM public.meals WHERE category = 'unassigned' AND updated_at >= now() - interval '1 second'),
    OLD.name;
  
  RETURN OLD;
END;
$$;

-- Create the trigger that fires before a category is deleted
CREATE TRIGGER category_deletion_cleanup
  BEFORE DELETE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_category_deletion();

-- Also create a function to ensure 'unassigned' is always a valid fallback
-- This will prevent any issues if someone tries to assign a meal to a non-existent category
CREATE OR REPLACE FUNCTION public.validate_meal_category()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If category is not null and doesn't exist in categories table, set to 'unassigned'
  IF NEW.category IS NOT NULL AND NEW.category != 'unassigned' THEN
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE name = NEW.category AND is_active = true) THEN
      NEW.category := 'unassigned';
      RAISE NOTICE 'Category "%" does not exist or is inactive, setting meal "%" to "unassigned"', 
        OLD.category, NEW.name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to validate category assignments on meal insert/update
CREATE TRIGGER meal_category_validation
  BEFORE INSERT OR UPDATE OF category ON public.meals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_meal_category();