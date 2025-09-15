-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view their own saved meal labels" ON public.saved_meal_labels;
DROP POLICY IF EXISTS "Users can insert their own saved meal labels" ON public.saved_meal_labels;  
DROP POLICY IF EXISTS "Users can update their own saved meal labels" ON public.saved_meal_labels;
DROP POLICY IF EXISTS "Users can delete their own saved meal labels" ON public.saved_meal_labels;

-- Create secure user-specific policies that properly isolate by user_id
CREATE POLICY "Users can view their own saved meal labels"
ON public.saved_meal_labels
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved meal labels"
ON public.saved_meal_labels
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved meal labels"
ON public.saved_meal_labels
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved meal labels"
ON public.saved_meal_labels
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);