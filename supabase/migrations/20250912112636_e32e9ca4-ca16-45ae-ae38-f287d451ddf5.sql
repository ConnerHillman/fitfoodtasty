-- Create referral codes and user credits for existing users who don't have them yet
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Loop through all users who don't have referral codes
    FOR user_record IN 
        SELECT u.id, u.email 
        FROM auth.users u 
        LEFT JOIN public.referral_codes rc ON u.id = rc.user_id 
        WHERE rc.user_id IS NULL
    LOOP
        -- Create referral code for this user
        INSERT INTO public.referral_codes (user_id, code)
        VALUES (
            user_record.id,
            public.generate_referral_code(user_record.email)
        );
        
        -- Create user credits entry if it doesn't exist
        INSERT INTO public.user_credits (user_id, total_credits)
        VALUES (user_record.id, 0)
        ON CONFLICT (user_id) DO NOTHING;
        
    END LOOP;
END $$;