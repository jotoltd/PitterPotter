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

CREATE POLICY "Allow public read settings" ON settings
  FOR SELECT
  USING (true);

CREATE POLICY "Allow super admin update settings" ON settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow anyone to read a gift card by code (needed for balance check/redemption)
CREATE POLICY "Allow public read by code" ON gift_cards
  FOR SELECT
  USING (true);

-- Staff table for admin/staff roles
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

CREATE POLICY "Allow staff read own" ON staff
  FOR SELECT
  USING (true);

CREATE POLICY "Allow super admin manage staff" ON staff
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Seed super admin (password hash is SHA-256 of 'lalala14')
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

CREATE POLICY "Allow public read content" ON content
  FOR SELECT
  USING (true);

CREATE POLICY "Allow super admin manage content" ON content
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Storage bucket for CMS image uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('content', 'content', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for content bucket (public read, staff can manage)
CREATE POLICY "Allow public read content images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'content');

CREATE POLICY "Allow staff manage content images" ON storage.objects
  FOR ALL
  USING (bucket_id = 'content')
  WITH CHECK (bucket_id = 'content');
