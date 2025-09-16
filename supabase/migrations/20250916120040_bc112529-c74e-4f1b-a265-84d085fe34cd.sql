-- Enable leaked password protection in Supabase Auth settings
-- This setting cannot be changed via SQL - it must be configured in the Supabase Dashboard
-- Navigate to Authentication > Settings > Password Protection and enable it
SELECT 'This migration serves as documentation that leaked password protection should be enabled in the Supabase Dashboard under Authentication > Settings' as note;