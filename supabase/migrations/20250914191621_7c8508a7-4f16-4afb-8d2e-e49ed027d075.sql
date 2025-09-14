-- Create filters table for dynamic menu filtering
CREATE TABLE public.filters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('dietary', 'nutrition', 'calorie', 'sorting')),
  threshold JSONB NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.filters ENABLE ROW LEVEL SECURITY;

-- Create policies for filters table
CREATE POLICY "Admins can manage all filters" 
ON public.filters 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active filters" 
ON public.filters 
FOR SELECT 
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_filters_updated_at
BEFORE UPDATE ON public.filters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample filter data
INSERT INTO public.filters (name, type, threshold, is_active) VALUES
('Vegan', 'dietary', NULL, true),
('Gluten Free', 'dietary', NULL, true),
('High Protein', 'nutrition', '{"min_protein": 20}', true),
('Low Carb', 'nutrition', '{"max_carbs": 20}', true),
('Low Fat', 'nutrition', '{"max_fat": 10}', true),
('High Fiber', 'nutrition', '{"min_fiber": 5}', true),
('Low Calorie', 'calorie', '{"max_calories": 400}', true),
('High Calorie', 'calorie', '{"min_calories": 600}', true),
('Sort by Price (Low to High)', 'sorting', '{"field": "price", "order": "asc"}', true),
('Sort by Price (High to Low)', 'sorting', '{"field": "price", "order": "desc"}', true),
('Sort by Calories (Low to High)', 'sorting', '{"field": "total_calories", "order": "asc"}', true),
('Sort by Calories (High to Low)', 'sorting', '{"field": "total_calories", "order": "desc"}', true),
('Sort by Newest', 'sorting', '{"field": "created_at", "order": "desc"}', true);