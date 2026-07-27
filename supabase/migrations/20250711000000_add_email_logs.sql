-- Email logs table for tracking Resend email delivery
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type TEXT NOT NULL DEFAULT 'general',
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  resend_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'bounced', 'complained', 'opened', 'clicked', 'failed')),
  booking_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying by status
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- Index for querying by resend_id (webhook lookups)
CREATE INDEX IF NOT EXISTS idx_email_logs_resend_id ON email_logs(resend_id);

-- Index for sorting by created_at
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access (admin reads via edge function)
CREATE POLICY "Service role full access" ON email_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE email_logs;
