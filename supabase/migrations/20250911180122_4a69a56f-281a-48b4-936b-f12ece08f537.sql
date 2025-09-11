-- Fix search path for allergen-related functions
CREATE OR REPLACE FUNCTION public.update_meal_allergens()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT and UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Delete existing allergens for this meal and re-add them based on current ingredients
    DELETE FROM public.meal_allergens WHERE meal_id = NEW.meal_id;
    
    -- Insert allergens from all ingredients in this meal
    INSERT INTO public.meal_allergens (meal_id, allergen_id)
    SELECT DISTINCT NEW.meal_id, ia.allergen_id
    FROM public.meal_ingredients mi
    JOIN public.ingredient_allergens ia ON mi.ingredient_id = ia.ingredient_id
    WHERE mi.meal_id = NEW.meal_id
    ON CONFLICT (meal_id, allergen_id) DO NOTHING;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    -- Delete existing allergens for this meal and re-add them based on remaining ingredients
    DELETE FROM public.meal_allergens WHERE meal_id = OLD.meal_id;
    
    -- Insert allergens from remaining ingredients in this meal
    INSERT INTO public.meal_allergens (meal_id, allergen_id)
    SELECT DISTINCT OLD.meal_id, ia.allergen_id
    FROM public.meal_ingredients mi
    JOIN public.ingredient_allergens ia ON mi.ingredient_id = ia.ingredient_id
    WHERE mi.meal_id = OLD.meal_id
    ON CONFLICT (meal_id, allergen_id) DO NOTHING;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix search path for ingredient allergen update function
CREATE OR REPLACE FUNCTION public.update_meals_from_ingredient_allergens()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT and UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Update all meals that contain this ingredient
    INSERT INTO public.meal_allergens (meal_id, allergen_id)
    SELECT DISTINCT mi.meal_id, NEW.allergen_id
    FROM public.meal_ingredients mi
    WHERE mi.ingredient_id = NEW.ingredient_id
    ON CONFLICT (meal_id, allergen_id) DO NOTHING;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    -- Remove this allergen from meals that only had it through this ingredient
    DELETE FROM public.meal_allergens ma
    WHERE ma.allergen_id = OLD.allergen_id
    AND ma.meal_id IN (
      SELECT mi.meal_id 
      FROM public.meal_ingredients mi 
      WHERE mi.ingredient_id = OLD.ingredient_id
    )
    AND NOT EXISTS (
      -- Check if any other ingredient in the meal has this allergen
      SELECT 1 
      FROM public.meal_ingredients mi2
      JOIN public.ingredient_allergens ia2 ON mi2.ingredient_id = ia2.ingredient_id
      WHERE mi2.meal_id = ma.meal_id 
      AND ia2.allergen_id = OLD.allergen_id
      AND mi2.ingredient_id != OLD.ingredient_id
    );
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;