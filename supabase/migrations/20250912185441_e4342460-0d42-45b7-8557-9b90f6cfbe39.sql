-- Fix the security warning by setting the search_path for the function
-- Update the trigger function to have a proper search_path

CREATE OR REPLACE FUNCTION public.trigger_ingredient_nutrition_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Handle UPDATE - recalculate all meals that use this ingredient
    IF TG_OP = 'UPDATE' THEN
        -- Only recalculate if nutritional values actually changed
        IF (OLD.calories_per_100g IS DISTINCT FROM NEW.calories_per_100g OR
            OLD.protein_per_100g IS DISTINCT FROM NEW.protein_per_100g OR
            OLD.carbs_per_100g IS DISTINCT FROM NEW.carbs_per_100g OR
            OLD.fat_per_100g IS DISTINCT FROM NEW.fat_per_100g OR
            OLD.saturated_fat_per_100g IS DISTINCT FROM NEW.saturated_fat_per_100g OR
            OLD.fiber_per_100g IS DISTINCT FROM NEW.fiber_per_100g OR
            OLD.sugar_per_100g IS DISTINCT FROM NEW.sugar_per_100g OR
            OLD.salt_per_100g IS DISTINCT FROM NEW.salt_per_100g) THEN
            
            -- Recalculate nutrition for all meals using this ingredient
            PERFORM public.calculate_meal_nutrition(mi.meal_id)
            FROM public.meal_ingredients mi 
            WHERE mi.ingredient_id = NEW.id;
            
            RAISE NOTICE 'Recalculated nutrition for meals using ingredient: %', NEW.name;
        END IF;
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Update the recalculate function to have proper search_path
CREATE OR REPLACE FUNCTION public.recalculate_all_meal_nutrition()
RETURNS TABLE(meal_id uuid, meal_name text, old_calories numeric, new_calories numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    meal_record RECORD;
    old_cal numeric;
    new_cal numeric;
BEGIN
    -- Loop through all active meals
    FOR meal_record IN 
        SELECT m.id, m.name, m.total_calories
        FROM public.meals m 
        WHERE m.is_active = true 
        AND EXISTS (SELECT 1 FROM public.meal_ingredients mi WHERE mi.meal_id = m.id)
        ORDER BY m.name
    LOOP
        old_cal := meal_record.total_calories;
        
        -- Recalculate nutrition
        PERFORM public.calculate_meal_nutrition(meal_record.id);
        
        -- Get the new value
        SELECT m.total_calories INTO new_cal 
        FROM public.meals m 
        WHERE m.id = meal_record.id;
        
        -- Return the changes
        meal_id := meal_record.id;
        meal_name := meal_record.name;
        old_calories := old_cal;
        new_calories := new_cal;
        
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$;