-- Add photo_tags column to bookings for per-photo status tags
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS photo_tags JSONB DEFAULT '{}';
