-- Update open session capacity to correct values
-- Putney: 10 tables = 32 guests (open), 6 tables = 20 guests (when party booked)
-- Wimbledon: 17 tables = 65 guests (open), 17 tables = 40 guests (when party booked)

INSERT INTO capacity (studio, session_type, max_painters)
VALUES
  ('Putney', 'open', 32),
  ('Putney', 'party', 20),
  ('Wimbledon', 'open', 65),
  ('Wimbledon', 'party', 40)
ON CONFLICT (studio, session_type) DO UPDATE SET
  max_painters = EXCLUDED.max_painters,
  updated_at = NOW();
