-- Update the 5 meal package with the promotional image
UPDATE public.packages 
SET image_url = '/lovable-uploads/0fba7da5-8e66-44f0-80ad-56422e4d2b09.png'
WHERE meal_count = 5;