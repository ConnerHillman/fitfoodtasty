-- Fix category name mismatch for regular meals
UPDATE meals 
SET category = 'regular' 
WHERE category = 'all meals (regular size)' AND is_active = true;