ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10, 2) DEFAULT 50,
  ADD COLUMN IF NOT EXISTS final_seats INTEGER,
  ADD COLUMN IF NOT EXISTS final_balance NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS payment_link_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_link_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded'));

-- Default party price per person setting
INSERT INTO settings (key, value) VALUES ('party_price_per_person', '28.95')
ON CONFLICT (key) DO NOTHING;
