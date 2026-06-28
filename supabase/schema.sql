-- Run this in the Supabase SQL Editor to create the gift_cards table

CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  amount NUMERIC(10, 2) NOT NULL,
  balance NUMERIC(10, 2) NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO settings (key, value)
VALUES ('stripe_mode', 'sandbox')
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies so they can be recreated idempotently
DROP POLICY IF EXISTS "Allow public read settings" ON settings;
DROP POLICY IF EXISTS "Allow public insert gift cards" ON gift_cards;

-- Public can read settings only (e.g. stripe_mode). Staff updates must go through service-role edge functions.
CREATE POLICY "Allow public read settings" ON settings
  FOR SELECT
  USING (true);

-- Gift cards: public may only create a card after Stripe checkout. Reads and updates must go through edge functions.
CREATE POLICY "Allow public insert gift cards" ON gift_cards
  FOR INSERT
  WITH CHECK (true);

-- Staff table for admin/staff roles (managed exclusively by service-role edge functions)
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'staff')),
  can_update_status BOOLEAN NOT NULL DEFAULT false,
  can_edit_bookings BOOLEAN NOT NULL DEFAULT false,
  can_add_walk_ins BOOLEAN NOT NULL DEFAULT false,
  can_delete_bookings BOOLEAN NOT NULL DEFAULT false,
  session_token TEXT,
  session_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- No public access to staff. Edge functions use the service role key for all staff operations.
-- We intentionally do NOT create SELECT/UPDATE policies for anonymous/authenticated users.

-- Seed super admin (password hash is SHA-256 of 'lalala14')
-- NOTE: migrate to bcrypt/argon2 in the staff-login edge function before storing real passwords.
INSERT INTO staff (name, username, password_hash, role, can_update_status, can_edit_bookings, can_add_walk_ins, can_delete_bookings)
VALUES ('Evonne', 'Evonne', '971c0c79a0bf248d94f48fd66819944641715b690116b2d281d50f4249379448', 'super_admin', true, true, true, true)
ON CONFLICT (username) DO NOTHING;

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT NOT NULL UNIQUE,
  studio TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  painters_count INTEGER NOT NULL,
  session_type TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  request_date TEXT,
  estimated_price NUMERIC(10, 2),
  source TEXT,
  gift_card_code TEXT,
  gift_card_discount NUMERIC(10, 2),
  final_price NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Performance indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_bookings_date_studio ON bookings(date, studio);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_content_key_page ON content(key, page);
CREATE INDEX IF NOT EXISTS idx_staff_username ON staff(username);
CREATE INDEX IF NOT EXISTS idx_staff_session_token ON staff(session_token);

-- Drop existing policies so they can be recreated idempotently
DROP POLICY IF EXISTS "Allow public insert bookings" ON bookings;

-- Anyone can create a booking (customer-facing)
CREATE POLICY "Allow public insert bookings" ON bookings
  FOR INSERT
  WITH CHECK (true);

-- Content table for CMS-style inline editing
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'html')),
  page TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read content" ON content;

CREATE POLICY "Allow public read content" ON content
  FOR SELECT
  USING (true);

-- All content writes are routed through the admin-content edge function using the service role key.
-- We intentionally do NOT create INSERT/UPDATE policies for client connections.

-- Capacity table for configurable studio/session limits
CREATE TABLE IF NOT EXISTS capacity (
  studio TEXT NOT NULL,
  session_type TEXT NOT NULL,
  max_painters INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (studio, session_type)
);

ALTER TABLE capacity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read capacity" ON capacity;

-- Public can read capacity (used by booking flow). Staff updates via edge functions.
CREATE POLICY "Allow public read capacity" ON capacity
  FOR SELECT
  USING (true);

-- Seed default capacity
INSERT INTO capacity (studio, session_type, max_painters)
VALUES
  ('Putney', 'open', 30),
  ('Wimbledon', 'open', 50)
ON CONFLICT (studio, session_type) DO NOTHING;

-- Audit log for staff actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  username TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_staff_id ON audit_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Storage bucket for CMS image uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('content', 'content', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for content bucket (public read only; writes go through admin-content edge function)
DROP POLICY IF EXISTS "Allow public read content images" ON storage.objects;
DROP POLICY IF EXISTS "Allow staff manage content images" ON storage.objects;

CREATE POLICY "Allow public read content images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'content');
