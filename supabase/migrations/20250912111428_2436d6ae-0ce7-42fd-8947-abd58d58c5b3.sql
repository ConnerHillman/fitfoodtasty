-- Add county field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN county text;