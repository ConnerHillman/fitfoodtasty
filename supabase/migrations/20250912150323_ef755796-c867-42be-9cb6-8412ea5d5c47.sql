-- Create function to update meal categories when category name changes
CREATE OR REPLACE FUNCTION update_meal_categories_on_category_rename()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if the name actually changed
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    -- Update all meals that reference the old category name
    UPDATE meals 
    SET category = NEW.name,
        updated_at = now()
    WHERE category = OLD.name;
    
    -- Log the number of meals updated
    RAISE NOTICE 'Updated % meals from category "%" to "%"', 
      (SELECT COUNT(*) FROM meals WHERE category = NEW.name),
      OLD.name, 
      NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run the function after category updates
DROP TRIGGER IF EXISTS trigger_update_meal_categories_on_rename ON categories;
CREATE TRIGGER trigger_update_meal_categories_on_rename
  AFTER UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_meal_categories_on_category_rename();