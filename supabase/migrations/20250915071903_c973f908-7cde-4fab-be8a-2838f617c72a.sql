-- Add meal_ingredients table for allergen support
CREATE TABLE public.meal_ingredients_allergens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  ingredient TEXT NOT NULL,
  is_allergen BOOLEAN NOT NULL DEFAULT false,
  allergen_type TEXT NULL, -- 'dairy', 'gluten', 'meat', 'fish', 'nuts', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add category column to filters table
ALTER TABLE public.filters ADD COLUMN category TEXT NULL;

-- Enable RLS on meal_ingredients_allergens
ALTER TABLE public.meal_ingredients_allergens ENABLE ROW LEVEL SECURITY;

-- Create policies for meal_ingredients_allergens
CREATE POLICY "Meal ingredients allergens are viewable by everyone" 
ON public.meal_ingredients_allergens 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage meal ingredients allergens" 
ON public.meal_ingredients_allergens 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Add sample allergen data for existing meals
INSERT INTO public.meal_ingredients_allergens (meal_id, ingredient, is_allergen, allergen_type)
SELECT 
  m.id,
  CASE 
    WHEN m.name ILIKE '%chicken%' THEN 'Chicken'
    WHEN m.name ILIKE '%beef%' THEN 'Beef'
    WHEN m.name ILIKE '%pork%' THEN 'Pork'
    WHEN m.name ILIKE '%fish%' OR m.name ILIKE '%salmon%' OR m.name ILIKE '%tuna%' THEN 'Fish'
    WHEN m.name ILIKE '%cheese%' OR m.name ILIKE '%milk%' OR m.name ILIKE '%cream%' THEN 'Dairy'
    WHEN m.name ILIKE '%bread%' OR m.name ILIKE '%pasta%' OR m.name ILIKE '%wheat%' THEN 'Wheat'
    ELSE 'Mixed Vegetables'
  END as ingredient,
  CASE 
    WHEN m.name ILIKE '%chicken%' OR m.name ILIKE '%beef%' OR m.name ILIKE '%pork%' OR m.name ILIKE '%fish%' OR m.name ILIKE '%salmon%' OR m.name ILIKE '%tuna%' THEN true
    WHEN m.name ILIKE '%cheese%' OR m.name ILIKE '%milk%' OR m.name ILIKE '%cream%' THEN true
    WHEN m.name ILIKE '%bread%' OR m.name ILIKE '%pasta%' OR m.name ILIKE '%wheat%' THEN true
    ELSE false
  END as is_allergen,
  CASE 
    WHEN m.name ILIKE '%chicken%' OR m.name ILIKE '%beef%' OR m.name ILIKE '%pork%' THEN 'meat'
    WHEN m.name ILIKE '%fish%' OR m.name ILIKE '%salmon%' OR m.name ILIKE '%tuna%' THEN 'fish'
    WHEN m.name ILIKE '%cheese%' OR m.name ILIKE '%milk%' OR m.name ILIKE '%cream%' THEN 'dairy'
    WHEN m.name ILIKE '%bread%' OR m.name ILIKE '%pasta%' OR m.name ILIKE '%wheat%' THEN 'gluten'
    ELSE NULL
  END as allergen_type
FROM public.meals m
WHERE m.is_active = true;

-- Update existing filters with categories
UPDATE public.filters SET category = 'Dietary' WHERE type = 'dietary';
UPDATE public.filters SET category = 'Nutrition' WHERE type = 'nutrition';
UPDATE public.filters SET category = 'Preferences' WHERE type = 'calorie';
UPDATE public.filters SET category = 'Display' WHERE type = 'sorting';