-- Fix RLS on bookings table - ensure public insert policy works
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Allow public insert bookings" ON bookings;
DROP POLICY IF EXISTS "Allow public select bookings" ON bookings;
DROP POLICY IF EXISTS "Allow public update bookings" ON bookings;
DROP POLICY IF EXISTS "Allow anon insert bookings" ON bookings;
DROP POLICY IF EXISTS "Allow anon select bookings" ON bookings;

-- Recreate: Anyone can create a booking (customer-facing)
CREATE POLICY "Allow public insert bookings" ON bookings
  FOR INSERT
  WITH CHECK (true);
