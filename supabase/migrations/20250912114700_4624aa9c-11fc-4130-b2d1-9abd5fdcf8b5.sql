-- Insert admin role for conner@fitfoodtasty.co.uk
INSERT INTO public.user_roles (user_id, role) 
VALUES ('5df183ac-8d8a-4fb0-9e00-b370fd292ad2', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;