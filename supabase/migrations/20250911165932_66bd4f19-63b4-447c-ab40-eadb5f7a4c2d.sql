-- Assign all BIG meals to all MASSIVE packages
INSERT INTO public.package_meals (package_id, meal_id)
SELECT p.id as package_id, m.id as meal_id
FROM public.packages p
CROSS JOIN public.meals m
WHERE p.name ILIKE '%MASSIVE%' 
  AND m.name ILIKE '%BIG%'
  AND p.is_active = true
  AND m.is_active = true
  AND NOT EXISTS (
    -- Avoid duplicates
    SELECT 1 FROM public.package_meals pm 
    WHERE pm.package_id = p.id AND pm.meal_id = m.id
  );