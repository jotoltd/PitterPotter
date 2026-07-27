-- Ensure estimated_price column exists on bookings table
-- (in case table was recreated without it)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS estimated_price NUMERIC(10, 2);

-- Ensure RLS is enabled
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies and recreate
DROP POLICY IF EXISTS "Allow public insert bookings" ON bookings;

-- Anyone can create a booking (customer-facing)
CREATE POLICY "Allow public insert bookings" ON bookings
  FOR INSERT
  WITH CHECK (true);
