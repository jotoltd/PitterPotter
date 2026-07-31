-- Enable Supabase Realtime for gift_cards and audit_logs tables
-- This allows WebSocket-based real-time updates across multiple staff sessions

ALTER PUBLICATION supabase_realtime ADD TABLE gift_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
