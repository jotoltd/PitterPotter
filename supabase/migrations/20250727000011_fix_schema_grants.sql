-- Check and fix schema usage grants
DO $$
DECLARE
  has_usage boolean;
BEGIN
  SELECT has_schema_privilege('anon', 'public', 'USAGE') INTO has_usage;
  RAISE NOTICE 'anon has USAGE on public: %', has_usage;
END $$;

-- Grant usage on public schema to anon and authenticated
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Also ensure table privileges are correct
GRANT ALL ON bookings TO anon;
GRANT ALL ON bookings TO authenticated;
