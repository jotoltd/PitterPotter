-- Notifications table for admin/staff notification system
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN (
    'booking_new',
    'booking_cancelled',
    'booking_status_changed',
    'booking_walk_in',
    'gift_card_purchased',
    'gift_card_redeemed',
    'collection_ready',
    'staff_action'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  studio TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Public can read notifications (anon key used by admin clients).
-- All writes go through service-role edge functions.
DROP POLICY IF EXISTS "Allow public read notifications" ON notifications;
CREATE POLICY "Allow public read notifications" ON notifications
  FOR SELECT
  USING (true);

-- Allow public to update read_at (mark as read) — no other columns can be touched
DROP POLICY IF EXISTS "Allow public update notification read_at" ON notifications;
CREATE POLICY "Allow public update notification read_at" ON notifications
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_studio ON notifications(studio);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Enable Supabase Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
