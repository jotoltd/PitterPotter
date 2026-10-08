-- Add a staff-only notes field to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS staff_notes TEXT;

-- Allow anon/authenticated inserts to include staff_notes
GRANT INSERT (staff_notes) ON bookings TO anon;
GRANT INSERT (staff_notes) ON bookings TO authenticated;
GRANT UPDATE (staff_notes) ON bookings TO authenticated;
