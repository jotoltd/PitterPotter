-- Debug: check bookings table RLS status and policies
-- First, let's check if FORCE RLS is on
DO $$
DECLARE
  rls_enabled text;
  rls_forced text;
BEGIN
  SELECT relrowsecurity, relforcerowsecurity INTO rls_enabled, rls_forced
  FROM pg_class WHERE relname = 'bookings';
  RAISE NOTICE 'RLS enabled: %, RLS forced: %', rls_enabled, rls_forced;
END $$;

-- List all policies on bookings
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT polname, polcmd, polqual, polwithcheck FROM pg_policy WHERE polrelid = 'bookings'::regclass LOOP
    RAISE NOTICE 'Policy: %, Cmd: %, Qual: %, WithCheck: %', pol.polname, pol.polcmd, pol.polqual, pol.polwithcheck;
  END LOOP;
END $$;

-- Check grants
DO $$
DECLARE
  grant_record record;
BEGIN
  FOR grant_record IN 
    SELECT grantee, privilege_type 
    FROM information_schema.role_table_grants 
    WHERE table_name = 'bookings' 
    ORDER BY grantee, privilege_type 
  LOOP
    RAISE NOTICE 'Grant: % -> %', grant_record.grantee, grant_record.privilege_type;
  END LOOP;
END $$;
