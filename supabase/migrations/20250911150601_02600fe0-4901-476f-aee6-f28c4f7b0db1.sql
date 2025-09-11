-- Create package_meals table to define which meals are available for each package
CREATE TABLE public.package_meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL,
  meal_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(package_id, meal_id)
);

-- Enable Row Level Security
ALTER TABLE public.package_meals ENABLE ROW LEVEL SECURITY;

-- Create policies for package_meals
CREATE POLICY "Package meals are viewable by everyone" 
ON public.package_meals 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage package meals" 
ON public.package_meals 
FOR ALL 
USING (auth.uid() IS NOT NULL);