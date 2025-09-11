-- Create ingredients table
CREATE TABLE public.ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  -- Nutritional values per 100g
  calories_per_100g DECIMAL(8,2) NOT NULL DEFAULT 0,
  protein_per_100g DECIMAL(8,2) NOT NULL DEFAULT 0,
  carbs_per_100g DECIMAL(8,2) NOT NULL DEFAULT 0,
  fat_per_100g DECIMAL(8,2) NOT NULL DEFAULT 0,
  fiber_per_100g DECIMAL(8,2) DEFAULT 0,
  sugar_per_100g DECIMAL(8,2) DEFAULT 0,
  sodium_per_100g DECIMAL(8,2) DEFAULT 0,
  -- Common unit for this ingredient (e.g., 'g', 'ml', 'piece')
  default_unit TEXT DEFAULT 'g',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meals table
CREATE TABLE public.meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- e.g., 'breakfast', 'lunch', 'dinner', 'snack'
  price DECIMAL(10,2),
  image_url TEXT,
  -- Calculated nutritional totals (updated via trigger)
  total_calories DECIMAL(8,2) DEFAULT 0,
  total_protein DECIMAL(8,2) DEFAULT 0,
  total_carbs DECIMAL(8,2) DEFAULT 0,
  total_fat DECIMAL(8,2) DEFAULT 0,
  total_fiber DECIMAL(8,2) DEFAULT 0,
  total_sugar DECIMAL(8,2) DEFAULT 0,
  total_sodium DECIMAL(8,2) DEFAULT 0,
  total_weight DECIMAL(8,2) DEFAULT 0, -- Total weight in grams
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meal_ingredients junction table
CREATE TABLE public.meal_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(8,2) NOT NULL, -- Quantity in grams or specified unit
  unit TEXT DEFAULT 'g', -- Unit of measurement
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meal_id, ingredient_id)
);

-- Enable RLS
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_ingredients ENABLE ROW LEVEL SECURITY;

-- Create policies for ingredients (viewable by all, manageable by authenticated users)
CREATE POLICY "Ingredients are viewable by everyone" 
ON public.ingredients FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage ingredients" 
ON public.ingredients FOR ALL USING (auth.uid() IS NOT NULL);

-- Create policies for meals (viewable by all, manageable by authenticated users)
CREATE POLICY "Meals are viewable by everyone" 
ON public.meals FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage meals" 
ON public.meals FOR ALL USING (auth.uid() IS NOT NULL);

-- Create policies for meal_ingredients (viewable by all, manageable by authenticated users)
CREATE POLICY "Meal ingredients are viewable by everyone" 
ON public.meal_ingredients FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage meal ingredients" 
ON public.meal_ingredients FOR ALL USING (auth.uid() IS NOT NULL);

-- Create triggers for updated_at columns
CREATE TRIGGER update_ingredients_updated_at
BEFORE UPDATE ON public.ingredients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meals_updated_at
BEFORE UPDATE ON public.meals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate meal nutritional totals
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
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

CREATE TRIGGER meal_ingredients_nutrition_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.meal_ingredients
FOR EACH ROW
EXECUTE FUNCTION public.trigger_calculate_meal_nutrition();

-- Insert some sample ingredients
INSERT INTO public.ingredients (name, description, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g) VALUES
('Chicken Breast', 'Lean chicken breast, skinless', 165, 31, 0, 3.6, 0),
('Brown Rice', 'Cooked brown rice', 123, 2.6, 22.9, 0.9, 1.8),
('Broccoli', 'Fresh broccoli florets', 34, 2.8, 7, 0.4, 2.6),
('Sweet Potato', 'Baked sweet potato', 86, 1.6, 20.1, 0.1, 3),
('Salmon Fillet', 'Atlantic salmon fillet', 208, 25.4, 0, 12.4, 0),
('Quinoa', 'Cooked quinoa', 120, 4.4, 21.3, 1.9, 2.8),
('Spinach', 'Fresh spinach leaves', 23, 2.9, 3.6, 0.4, 2.2),
('Avocado', 'Fresh avocado', 160, 2, 8.5, 14.7, 6.7),
('Olive Oil', 'Extra virgin olive oil', 884, 0, 0, 100, 0),
('Eggs', 'Large chicken eggs', 155, 13, 1.1, 11, 0);