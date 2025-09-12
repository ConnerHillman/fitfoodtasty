-- Create table for saved meal labels
CREATE TABLE public.saved_meal_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  calories NUMERIC NOT NULL DEFAULT 0,
  protein NUMERIC NOT NULL DEFAULT 0,
  fat NUMERIC NOT NULL DEFAULT 0,
  carbs NUMERIC NOT NULL DEFAULT 0,
  ingredients TEXT,
  allergens TEXT,
  storage_instructions TEXT DEFAULT 'Store in a refrigerator below 5°c. Heat in a microwave for 3-4 minutes or until piping hot.',
  heating_instructions TEXT DEFAULT 'Pierce film and heat for 3-4 minutes or until piping hot.',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_meal_labels ENABLE ROW LEVEL SECURITY;

-- Create policies for saved meal labels
CREATE POLICY "Authenticated users can manage their saved meal labels" 
ON public.saved_meal_labels 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_saved_meal_labels_updated_at
BEFORE UPDATE ON public.saved_meal_labels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();