-- Automated 48-hour party payment reminders
-- This uses pg_cron if available. On Supabase free tier pg_cron may need to be enabled in the dashboard first.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Schedule hourly check for party bookings due in ~48 hours that have not had a reminder sent
    PERFORM cron.schedule(
      'party-final-reminders',
      '0 * * * *',
      $$
        SELECT net.http_post(
          url := concat(current_setting('app.settings.supabase_url', true), '/functions/v1/send-party-final-reminder'),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', concat('Bearer ', current_setting('app.settings.supabase_anon_key', true))
          ),
          body := jsonb_build_object(
            'bookingId', b.booking_id,
            'finalSeats', b.painters_count
          )
        )
        FROM bookings b
        WHERE b.session_type IN ('birthday-party', 'baby-shower-hen', 'corporate')
          AND b.status != 'cancelled'
          AND b.payment_link_sent_at IS NULL
          AND b.date::date <= (now() + interval '48 hours')::date
          AND b.date::date > now()::date;
      $$
    );
  END IF;
END
$$;
