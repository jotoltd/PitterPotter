-- Add party guest limit settings per studio
INSERT INTO settings (key, value) VALUES ('party_guest_limit_putney', '16')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value) VALUES ('party_guest_limit_wimbledon', '16')
ON CONFLICT (key) DO NOTHING;
