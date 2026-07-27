-- Add management_token column to bookings table for magic link booking management
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS management_token TEXT;

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_bookings_management_token ON bookings(management_token) WHERE management_token IS NOT NULL;
