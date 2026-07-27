-- Fix RLS on bookings table - ensure public insert policy works
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop and recreate insert policy
DROP POLICY IF EXISTS "Allow public insert bookings" ON bookings;
CREATE POLICY "Allow public insert bookings" ON bookings
  FOR INSERT
  WITH CHECK (true);
