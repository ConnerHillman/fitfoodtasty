-- Add delivery_instructions column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN delivery_instructions text;