-- Add sort_order column to meals table
ALTER TABLE public.meals 
ADD COLUMN sort_order integer DEFAULT 0;

-- Update existing meals with incremental sort order (newest first)
UPDATE public.meals 
SET sort_order = (
  SELECT ROW_NUMBER() OVER (ORDER BY created_at DESC) - 1
  FROM public.meals m2 
  WHERE m2.id = meals.id
);

-- Create function to automatically set sort_order for new meals
CREATE OR REPLACE FUNCTION public.set_meal_sort_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the highest sort_order and add 1, or start at 0 if no meals exist
  SELECT COALESCE(MAX(sort_order), -1) + 1 INTO NEW.sort_order FROM public.meals;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set sort_order for new meals
CREATE TRIGGER trigger_set_meal_sort_order
  BEFORE INSERT ON public.meals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_meal_sort_order();