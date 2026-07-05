-- Add painting_count column to bookings table
-- Stores how many of the seated people will actually be painting (optional, informational)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS painting_count INTEGER;
