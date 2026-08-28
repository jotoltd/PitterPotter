-- Add error tracking columns to email_logs for SMS delivery receipts
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS error_code INTEGER;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS error_message TEXT;
