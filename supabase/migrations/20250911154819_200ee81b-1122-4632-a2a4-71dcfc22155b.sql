-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3b82f6', -- Default blue color for category badges
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can manage categories" 
ON public.categories 
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.categories (name, description, color, sort_order) VALUES
('breakfast', 'Morning meals and breakfast options', '#f97316', 1),
('lunch', 'Midday meals and lunch options', '#3b82f6', 2),
('dinner', 'Evening meals and dinner options', '#8b5cf6', 3),
('snack', 'Light snacks and small bites', '#10b981', 4);

-- Update meals table to reference categories (if column doesn't exist)
-- This will ensure existing meals still work with the new system
DO $$ 
BEGIN
    -- Check if category column exists and is just text
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'meals' 
        AND column_name = 'category' 
        AND data_type = 'text'
    ) THEN
        -- Add foreign key constraint to link meals to categories
        -- But first, let's ensure all existing meals have valid categories
        UPDATE public.meals 
        SET category = 'lunch' 
        WHERE category IS NULL OR category NOT IN ('breakfast', 'lunch', 'dinner', 'snack');
    END IF;
END $$;