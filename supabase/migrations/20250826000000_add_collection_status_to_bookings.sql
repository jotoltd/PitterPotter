ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS collection_status TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS collected_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_collection_status
  ON bookings(collection_status)
  WHERE collection_status IS NOT NULL;
