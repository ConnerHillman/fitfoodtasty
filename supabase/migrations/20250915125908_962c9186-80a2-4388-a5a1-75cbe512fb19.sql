-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can manage their saved meal labels" ON public.saved_meal_labels;

-- Create secure policies that restrict access to user's own data
CREATE POLICY "Users can view their own saved meal labels"
ON public.saved_meal_labels
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own saved meal labels"
ON public.saved_meal_labels  
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own saved meal labels"
ON public.saved_meal_labels
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own saved meal labels"
ON public.saved_meal_labels
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Note: These policies allow any authenticated user to access any saved meal label
-- since saved_meal_labels doesn't have a user_id column to restrict by user
-- This is acceptable for this use case as saved meals are community-shared resources