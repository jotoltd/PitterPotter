-- Add table_id column to bookings table
-- This column stores the assigned table for a booking (used by the floor plan view)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS table_id TEXT;
