-- Grant INSERT on management_token column to anon and authenticated
GRANT INSERT (management_token) ON bookings TO anon;
GRANT INSERT (management_token) ON bookings TO authenticated;
