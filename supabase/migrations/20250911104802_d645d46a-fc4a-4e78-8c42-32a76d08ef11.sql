-- Create packages table
CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  meal_count INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Create policy for public access to view packages
CREATE POLICY "Packages are viewable by everyone" 
ON public.packages 
FOR SELECT 
USING (is_active = true);

-- Create policy for authenticated users to manage packages
CREATE POLICY "Authenticated users can manage packages" 
ON public.packages 
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Insert default packages
INSERT INTO public.packages (name, description, meal_count, price) VALUES 
('5 Meal Package', 'Perfect for trying our meals', 5, 42.00),
('10 Meal Package', 'Great for busy weeks', 10, 78.00),
('15 Meal Package', 'Popular choice for families', 15, 110.00),
('20 Meal Package', 'Best value for meal prep', 20, 140.00);

-- Create package orders table
CREATE TABLE public.package_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE,
  stripe_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  delivery_address TEXT,
  currency TEXT NOT NULL DEFAULT 'gbp',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for package orders
ALTER TABLE public.package_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for package orders
CREATE POLICY "Users can view their own package orders" 
ON public.package_orders 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own package orders" 
ON public.package_orders 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own package orders" 
ON public.package_orders 
FOR UPDATE 
USING (user_id = auth.uid());

-- Create package meal selections table
CREATE TABLE public.package_meal_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_order_id UUID REFERENCES public.package_orders(id) ON DELETE CASCADE,
  meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for package meal selections
ALTER TABLE public.package_meal_selections ENABLE ROW LEVEL SECURITY;

-- Create policies for package meal selections
CREATE POLICY "Users can view their own package meal selections" 
ON public.package_meal_selections 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.package_orders 
  WHERE id = package_order_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create their own package meal selections" 
ON public.package_meal_selections 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.package_orders 
  WHERE id = package_order_id AND user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_packages_updated_at
BEFORE UPDATE ON public.packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_package_orders_updated_at
BEFORE UPDATE ON public.package_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();