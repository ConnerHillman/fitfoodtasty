-- Copy meal selections from 5-meal package to other packages
-- First, get the meal IDs from the 5-meal package and insert them for other packages

-- For 10-meal package
INSERT INTO package_meals (package_id, meal_id)
SELECT '64f85f08-fa46-4920-b4bf-e73bc0145926', meal_id 
FROM package_meals 
WHERE package_id = 'a2a5c16e-c6aa-4261-9742-aff4fe3b602b'
ON CONFLICT DO NOTHING;

-- For 15-meal package  
INSERT INTO package_meals (package_id, meal_id)
SELECT '7bccba65-2cfb-4b69-a801-52b8fc01b2db', meal_id 
FROM package_meals 
WHERE package_id = 'a2a5c16e-c6aa-4261-9742-aff4fe3b602b'
ON CONFLICT DO NOTHING;

-- For 20-meal package
INSERT INTO package_meals (package_id, meal_id)
SELECT 'b89b4170-2738-4ccd-95c9-0b8fb03199da', meal_id 
FROM package_meals 
WHERE package_id = 'a2a5c16e-c6aa-4261-9742-aff4fe3b602b'
ON CONFLICT DO NOTHING;