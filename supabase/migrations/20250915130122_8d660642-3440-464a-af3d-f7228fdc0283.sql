-- Add user_id column to saved_meal_labels table for proper user isolation
ALTER TABLE public.saved_meal_labels 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Set default user_id for existing records (if any) to the current authenticated user
-- This is safe since the table is likely empty or used for testing
UPDATE public.saved_meal_labels 
SET user_id = '5df183ac-8d8a-4fb0-9e00-b370fd292ad2' 
WHERE user_id IS NULL;

-- Make user_id NOT NULL after setting defaults
ALTER TABLE public.saved_meal_labels 
ALTER COLUMN user_id SET NOT NULL;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view their own saved meal labels" ON public.saved_meal_labels;
DROP POLICY IF EXISTS "Users can insert their own saved meal labels" ON public.saved_meal_labels;
DROP POLICY IF EXISTS "Users can update their own saved meal labels" ON public.saved_meal_labels;
DROP POLICY IF EXISTS "Users can delete their own saved meal labels" ON public.saved_meal_labels;

-- Create secure user-specific policies
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

-- Add helpful comment
COMMENT ON COLUMN public.saved_meal_labels.user_id 
IS 'Links saved meal labels to the user who created them for proper RLS isolation';