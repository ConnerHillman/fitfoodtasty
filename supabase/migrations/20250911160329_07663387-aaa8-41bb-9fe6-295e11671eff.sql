-- Add sort_order column to packages table
ALTER TABLE public.packages 
ADD COLUMN sort_order integer DEFAULT 0;

-- Update existing packages with incremental sort order
UPDATE public.packages 
SET sort_order = (
  SELECT ROW_NUMBER() OVER (ORDER BY created_at) - 1
  FROM public.packages p2 
  WHERE p2.id = packages.id
);