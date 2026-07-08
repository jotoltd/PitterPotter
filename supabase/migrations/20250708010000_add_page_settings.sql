-- Page settings table to enable/disable pages from the admin panel
CREATE TABLE IF NOT EXISTS page_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES staff(id)
);

-- Seed default pages as enabled
INSERT INTO page_settings (page_key, enabled)
VALUES
  ('home', true),
  ('baby-prints', true),
  ('parties', true),
  ('food-drink', true),
  ('gallery', true),
  ('pricing', true),
  ('gift-cards', true),
  ('contact-info', true),
  ('contact', true),
  ('putney', true),
  ('wimbledon', true),
  ('faqs', true)
ON CONFLICT (page_key) DO NOTHING;

-- Enable RLS
ALTER TABLE page_settings ENABLE ROW LEVEL SECURITY;

-- Public can read page settings (to check if a page is disabled)
CREATE POLICY "Allow public read page settings" ON page_settings
  FOR SELECT
  USING (true);

-- Only service role can write (through edge functions)
-- No INSERT/UPDATE policies for client connections

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_page_settings_page_key ON page_settings(page_key);
