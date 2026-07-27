-- Debug: check table owner and if it's actually a table
DO $$
DECLARE
  rec record;
BEGIN
  SELECT c.relname, c.relkind, c.relowner, pg_get_userbyid(c.relowner) as owner_name,
         c.relrowsecurity, c.relforcerowsecurity
  INTO rec
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE c.relname = 'bookings' AND n.nspname = 'public';
  
  RAISE NOTICE 'Table: %, Kind: %, Owner OID: %, Owner: %, RLS: %, Force: %', 
    rec.relname, rec.relkind, rec.relowner, rec.owner_name, rec.relrowsecurity, rec.relforcerowsecurity;
END $$;

-- Check if there are any triggers on bookings that might be causing issues
DO $$
DECLARE
  trg record;
BEGIN
  FOR trg IN 
    SELECT tgname, tgtype, tgenabled 
    FROM pg_trigger 
    WHERE tgrelid = 'bookings'::regclass 
    AND NOT tgisinternal
  LOOP
    RAISE NOTICE 'Trigger: %, Type: %, Enabled: %', trg.tgname, trg.tgtype, trg.tgenabled;
  END LOOP;
END $$;

-- Check if the anon role can actually be assumed
DO $$
BEGIN
  RAISE NOTICE 'Current user: %', current_user;
  RAISE NOTICE 'Session user: %', session_user;
END $$;
