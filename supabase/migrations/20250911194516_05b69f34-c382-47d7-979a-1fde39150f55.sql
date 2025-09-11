-- Ensure meal nutrition is kept in sync when meal_ingredients change
-- Create triggers to automatically recalculate nutrition and update allergens

-- Trigger to recalculate meal nutrition on meal_ingredients changes
DROP TRIGGER IF EXISTS meal_ingredients_calculate_nutrition ON public.meal_ingredients;
CREATE TRIGGER meal_ingredients_calculate_nutrition
AFTER INSERT OR UPDATE OR DELETE ON public.meal_ingredients
FOR EACH ROW EXECUTE FUNCTION public.trigger_calculate_meal_nutrition();

-- Trigger to update meal allergens based on current ingredients
DROP TRIGGER IF EXISTS meal_ingredients_update_allergens ON public.meal_ingredients;
CREATE TRIGGER meal_ingredients_update_allergens
AFTER INSERT OR UPDATE OR DELETE ON public.meal_ingredients
FOR EACH ROW EXECUTE FUNCTION public.update_meal_allergens();

-- Trigger to propagate ingredient allergen changes to meals
DROP TRIGGER IF EXISTS ingredient_allergens_propagate_to_meals ON public.ingredient_allergens;
CREATE TRIGGER ingredient_allergens_propagate_to_meals
AFTER INSERT OR UPDATE OR DELETE ON public.ingredient_allergens
FOR EACH ROW EXECUTE FUNCTION public.update_meals_from_ingredient_allergens();

-- Backfill: recalculate nutrition for all existing meals
SELECT public.calculate_meal_nutrition(id) FROM public.meals;