-- Fix remaining functions that need proper search_path

-- Update the existing calculate_meal_nutrition function to include SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.calculate_meal_nutrition(meal_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  total_cals DECIMAL(8,2) := 0;
  total_prot DECIMAL(8,2) := 0;
  total_carb DECIMAL(8,2) := 0;
  total_f DECIMAL(8,2) := 0;
  total_sat_f DECIMAL(8,2) := 0;
  total_fib DECIMAL(8,2) := 0;
  total_sug DECIMAL(8,2) := 0;
  total_salt_calc DECIMAL(8,2) := 0;
  total_wt DECIMAL(8,2) := 0;
BEGIN
  -- Calculate totals based on ingredients and quantities
  SELECT 
    COALESCE(SUM((i.calories_per_100g * mi.quantity) / 100), 0),
    COALESCE(SUM((i.protein_per_100g * mi.quantity) / 100), 0),
    COALESCE(SUM((i.carbs_per_100g * mi.quantity) / 100), 0),
    COALESCE(SUM((i.fat_per_100g * mi.quantity) / 100), 0),
    COALESCE(SUM((COALESCE(i.saturated_fat_per_100g, 0) * mi.quantity) / 100), 0),
    COALESCE(SUM((i.fiber_per_100g * mi.quantity) / 100), 0),
    COALESCE(SUM((COALESCE(i.sugar_per_100g, 0) * mi.quantity) / 100), 0),
    COALESCE(SUM((COALESCE(i.salt_per_100g, 0) * mi.quantity) / 100), 0),
    COALESCE(SUM(mi.quantity), 0)
  INTO total_cals, total_prot, total_carb, total_f, total_sat_f, total_fib, total_sug, total_salt_calc, total_wt
  FROM public.meal_ingredients mi
  JOIN public.ingredients i ON mi.ingredient_id = i.id
  WHERE mi.meal_id = meal_id_param;

  -- Update the meal with calculated totals (keeping sodium for backward compatibility but not calculating it)
  UPDATE public.meals SET
    total_calories = total_cals,
    total_protein = total_prot,
    total_carbs = total_carb,
    total_fat = total_f,
    total_saturated_fat = total_sat_f,
    total_fiber = total_fib,
    total_sugar = total_sug,
    total_salt = total_salt_calc,
    total_sodium = 0,
    total_weight = total_wt,
    updated_at = now()
  WHERE id = meal_id_param;
END;
$$;

-- Update the trigger_calculate_meal_nutrition function
CREATE OR REPLACE FUNCTION public.trigger_calculate_meal_nutrition()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
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
$$;