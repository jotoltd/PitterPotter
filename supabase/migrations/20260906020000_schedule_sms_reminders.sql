-- Schedule the send-scheduled-reminders function to run daily at 9am UK time
-- This uses Supabase's pg_cron extension
-- The cron job calls the edge function via the Supabase functions API

-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily at 9:00 AM UTC (8:00 AM GMT / 9:00 AM BST during summer)
-- The function checks for party bookings 2 days from the current date
SELECT cron.schedule(
  'send-scheduled-sms-reminders',
  '0 9 * * *',
  $$
    SELECT net.http_post(
      url := 'https://xjtfjlhykfvkckziyvxk.supabase.co/functions/v1/send-scheduled-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
      ),
      body := jsonb_build_object('daysBefore', 2)
    );
  $$
);
