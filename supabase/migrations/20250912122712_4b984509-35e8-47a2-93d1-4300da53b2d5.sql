-- Deactivate the snack category
UPDATE categories 
SET is_active = false, updated_at = now() 
WHERE name = 'snack';

-- If there are any meals with snack category, move them to lunch category
UPDATE meals 
SET category = 'lunch', updated_at = now() 
WHERE category = 'snack' AND is_active = true;