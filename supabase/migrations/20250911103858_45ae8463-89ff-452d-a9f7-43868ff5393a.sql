-- Create storage bucket for meal images
INSERT INTO storage.buckets (id, name, public) VALUES ('meal-images', 'meal-images', true);

-- Create policies for meal image uploads
CREATE POLICY "Meal images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'meal-images');

CREATE POLICY "Authenticated users can upload meal images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'meal-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update meal images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'meal-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete meal images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'meal-images' AND auth.uid() IS NOT NULL);