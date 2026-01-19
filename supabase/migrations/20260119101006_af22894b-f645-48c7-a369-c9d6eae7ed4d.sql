-- Initialize unique sort_order values for all packages based on their current name order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY COALESCE(sort_order, 0), name) as rn
  FROM packages
)
UPDATE packages 
SET sort_order = numbered.rn
FROM numbered 
WHERE packages.id = numbered.id;