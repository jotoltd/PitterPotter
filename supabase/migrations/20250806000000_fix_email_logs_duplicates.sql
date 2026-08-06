-- Add unique constraint on resend_id to prevent duplicate email log entries
-- Webhook events from Resend can arrive simultaneously (sent, delivered, opened)
-- Without this constraint, race conditions create duplicate rows

-- First, remove any existing duplicates (keep the newest one)
DELETE FROM email_logs a USING email_logs b
WHERE a.resend_id IS NOT NULL
  AND a.resend_id = b.resend_id
  AND a.id < b.id;

-- Add unique constraint
ALTER TABLE email_logs ADD CONSTRAINT email_logs_resend_id_key UNIQUE (resend_id);
