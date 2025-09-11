-- Create table for tracking page views
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_type TEXT NOT NULL, -- 'menu', 'meal', 'package', etc.
  page_id UUID, -- optional: specific meal/package ID
  user_id UUID, -- optional: logged in user
  session_id TEXT, -- anonymous session tracking
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can insert page views" 
ON public.page_views 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can view all page views" 
ON public.page_views 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Add index for better performance
CREATE INDEX idx_page_views_page_type_created_at ON public.page_views(page_type, created_at);
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at);
CREATE INDEX idx_page_views_session_id ON public.page_views(session_id);