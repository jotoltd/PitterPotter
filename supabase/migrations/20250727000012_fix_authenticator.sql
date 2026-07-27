-- Check if authenticator can switch to anon
DO $$
BEGIN
  RAISE NOTICE 'authenticator can switch to anon: %', has_table_privilege('anon', 'bookings', 'INSERT');
END $$;

-- Grant authenticator the ability to switch to anon
GRANT anon TO authenticator;
