-- Enable Supabase Realtime for bookings table
-- This allows WebSocket-based real-time updates across multiple staff sessions

ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
