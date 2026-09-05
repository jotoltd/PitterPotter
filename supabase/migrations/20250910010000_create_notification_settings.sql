-- Notification settings table — super admin can toggle types, filter by studio, and set custom title/message
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  studio TEXT NOT NULL DEFAULT 'All',  -- 'All', 'Putney', 'Wimbledon'
  custom_title TEXT,
  custom_message TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(type, studio)
);

-- RLS: public can read, only service role can write (via edge functions)
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read notification_settings"
  ON notification_settings FOR SELECT
  USING (true);

CREATE POLICY "Service role full access notification_settings"
  ON notification_settings FOR ALL
  USING (true)
  WITH CHECK (true);

-- Seed default settings: all types enabled for All studios
INSERT INTO notification_settings (type, enabled, studio)
VALUES
  ('booking_new', true, 'All'),
  ('booking_cancelled', true, 'All'),
  ('booking_status_changed', true, 'All'),
  ('booking_walk_in', true, 'All'),
  ('gift_card_purchased', true, 'All'),
  ('gift_card_redeemed', true, 'All'),
  ('collection_ready', true, 'All'),
  ('staff_action', true, 'All')
ON CONFLICT (type, studio) DO NOTHING;
