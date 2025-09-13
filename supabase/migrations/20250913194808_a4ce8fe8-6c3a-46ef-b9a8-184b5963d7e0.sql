-- Allow public read access to active delivery zones so guests can check availability
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'delivery_zones' AND policyname = 'Everyone can view active delivery zones'
  ) THEN
    CREATE POLICY "Everyone can view active delivery zones"
    ON public.delivery_zones
    FOR SELECT
    USING (is_active = true);
  END IF;
END $$;