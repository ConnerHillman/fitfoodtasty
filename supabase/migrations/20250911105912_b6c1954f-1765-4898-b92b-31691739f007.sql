-- Update the 5 meal package with a temporary placeholder until we upload the actual image
UPDATE public.packages 
SET image_url = 'https://aicpnaomarzgborltdkt.supabase.co/storage/v1/object/public/meal-images/package-5-meals.png'
WHERE meal_count = 5;