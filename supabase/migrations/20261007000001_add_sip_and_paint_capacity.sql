-- Add default capacity row for Sip & Paint sessions in both studios.
-- Sip & Paint uses the same physical tables as painting by default, but
-- having a separate row lets admins control its capacity independently.
INSERT INTO capacity (studio, session_type, max_painters)
VALUES
  ('Putney', 'sip_and_paint', 32),
  ('Wimbledon', 'sip_and_paint', 58)
ON CONFLICT (studio, session_type) DO NOTHING;
