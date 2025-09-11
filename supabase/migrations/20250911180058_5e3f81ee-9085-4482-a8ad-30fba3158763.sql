-- Create allergens table
CREATE TABLE public.allergens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on allergens
ALTER TABLE public.allergens ENABLE ROW LEVEL SECURITY;

-- Create policies for allergens
CREATE POLICY "Allergens are viewable by everyone" 
ON public.allergens 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage allergens" 
ON public.allergens 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create ingredient_allergens junction table
CREATE TABLE public.ingredient_allergens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  allergen_id UUID NOT NULL REFERENCES public.allergens(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ingredient_id, allergen_id)
);

-- Enable RLS on ingredient_allergens
ALTER TABLE public.ingredient_allergens ENABLE ROW LEVEL SECURITY;

-- Create policies for ingredient_allergens
CREATE POLICY "Ingredient allergens are viewable by everyone" 
ON public.ingredient_allergens 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage ingredient allergens" 
ON public.ingredient_allergens 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create meal_allergens junction table
CREATE TABLE public.meal_allergens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  allergen_id UUID NOT NULL REFERENCES public.allergens(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meal_id, allergen_id)
);

-- Enable RLS on meal_allergens
ALTER TABLE public.meal_allergens ENABLE ROW LEVEL SECURITY;

-- Create policies for meal_allergens
CREATE POLICY "Meal allergens are viewable by everyone" 
ON public.meal_allergens 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage meal allergens" 
ON public.meal_allergens 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Insert common allergens
INSERT INTO public.allergens (name, description) VALUES
('Eggs', 'Contains eggs or egg-based products'),
('Milk', 'Contains milk or dairy products'),
('Nuts', 'Contains tree nuts'),
('Peanuts', 'Contains peanuts'),
('Soy', 'Contains soy or soy-based products'),
('Wheat', 'Contains wheat or wheat-based products'),
('Fish', 'Contains fish or fish-based products'),
('Shellfish', 'Contains shellfish or shellfish-based products'),
('Sesame', 'Contains sesame seeds or sesame-based products'),
('Sulphites', 'Contains sulphites or sulphur dioxide'),
('Celery', 'Contains celery or celery-based products'),
('Mustard', 'Contains mustard or mustard-based products'),
('Lupin', 'Contains lupin or lupin-based products'),
('Molluscs', 'Contains molluscs or mollusc-based products');

-- Create function to automatically update meal allergens when ingredients are added/removed
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update meal allergens when meal ingredients change
CREATE TRIGGER trigger_update_meal_allergens
  AFTER INSERT OR UPDATE OR DELETE ON public.meal_ingredients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_meal_allergens();

-- Create function to update meal allergens when ingredient allergens change
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
$$ LANGUAGE plpgsql;

-- Create trigger to update meal allergens when ingredient allergens change
CREATE TRIGGER trigger_update_meals_from_ingredient_allergens
  AFTER INSERT OR UPDATE OR DELETE ON public.ingredient_allergens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_meals_from_ingredient_allergens();

-- Add timestamp trigger to allergens table
CREATE TRIGGER update_allergens_updated_at
  BEFORE UPDATE ON public.allergens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();