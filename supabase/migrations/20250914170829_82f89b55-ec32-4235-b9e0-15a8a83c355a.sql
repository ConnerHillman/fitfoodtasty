-- Add optional expiration date column to coupons table
ALTER TABLE public.coupons 
ADD COLUMN expires_at timestamp with time zone;

-- Update RLS policies for admin access to include expires_at column
-- Note: The existing policies already use has_role(auth.uid(), 'admin'::app_role) 
-- so they will automatically cover the new column.

-- Verify the authenticated user policy for active coupons still works
-- (This policy should already exist and filter by active = true)