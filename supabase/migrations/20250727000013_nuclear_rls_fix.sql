-- Nuclear option: drop all policies, disable RLS, re-enable, recreate policy
DROP POLICY IF EXISTS "Allow public insert bookings" ON bookings;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert bookings" ON bookings
  FOR INSERT
  WITH CHECK (true);

-- Also create a SELECT policy for anon so queries don't fail
CREATE POLICY "Allow public select bookings" ON bookings
  FOR SELECT
  USING (true);

-- Notify PostgREST to reload
NOTIFY pgrst, 'reload schema';
