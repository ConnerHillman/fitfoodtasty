-- Fix search path security warnings for functions
CREATE OR REPLACE FUNCTION public.calculate_meal_nutrition(meal_id_param UUID)
RETURNS VOID AS $$
DECLARE
  total_cals DECIMAL(8,2) := 0;
  total_prot DECIMAL(8,2) := 0;
  total_carb DECIMAL(8,2) := 0;
  total_f DECIMAL(8,2) := 0;
  total_fib DECIMAL(8,2) := 0;
  total_sug DECIMAL(8,2) := 0;
  total_sod DECIMAL(8,2) := 0;
  total_wt DECIMAL(8,2) := 0;
BEGIN
  -- Calculate totals based on ingredients and quantities
  SELECT 
    COALESCE(SUM((i.calories_per_100g * mi.quantity) / 100), 0),
    COALESCE(SUM((i.protein_per_100g * mi.quantity) / 100), 0),
    COALESCE(SUM((i.carbs_per_100g * mi.quantity) / 100), 0),
    COALESCE(SUM((i.fat_per_100g * mi.quantity) / 100), 0),
    COALESCE(SUM((i.fiber_per_100g * mi.quantity) / 100), 0),
    COALESCE(SUM((i.sugar_per_100g * mi.quantity) / 100), 0),
    COALESCE(SUM((i.sodium_per_100g * mi.quantity) / 100), 0),
    COALESCE(SUM(mi.quantity), 0)
  INTO total_cals, total_prot, total_carb, total_f, total_fib, total_sug, total_sod, total_wt
  FROM public.meal_ingredients mi
  JOIN public.ingredients i ON mi.ingredient_id = i.id
  WHERE mi.meal_id = meal_id_param;

  -- Update the meal with calculated totals
  UPDATE public.meals SET
    total_calories = total_cals,
    total_protein = total_prot,
    total_carbs = total_carb,
    total_fat = total_f,
    total_fiber = total_fib,
    total_sugar = total_sug,
    total_sodium = total_sod,
    total_weight = total_wt,
    updated_at = now()
  WHERE id = meal_id_param;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-calculate nutrition when meal ingredients change
CREATE OR REPLACE FUNCTION public.trigger_calculate_meal_nutrition()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT and UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.calculate_meal_nutrition(NEW.meal_id);
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    PERFORM public.calculate_meal_nutrition(OLD.meal_id);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;