-- Add body column to email_logs for storing actual email/SMS content
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS body TEXT;

-- Add suppressed column for bounce/complaint suppression
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS suppressed BOOLEAN DEFAULT false;

-- Add suppressed_at for tracking when suppression happened
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS suppressed_at TIMESTAMPTZ;

-- Index for querying suppressed entries
CREATE INDEX IF NOT EXISTS idx_email_logs_suppressed ON email_logs(suppressed) WHERE suppressed = true;

-- Add sms_opt_out table for tracking STOP/UNSTOP responses
CREATE TABLE IF NOT EXISTS sms_opt_outs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  opted_out_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opted_in_at TIMESTAMPTZ,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on sms_opt_outs
ALTER TABLE sms_opt_outs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON sms_opt_outs
  FOR ALL USING (auth.role() = 'service_role');

-- Add webhook_health table for monitoring webhook reliability
CREATE TABLE IF NOT EXISTS webhook_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  event_type TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE webhook_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON webhook_health
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_webhook_health_source ON webhook_health(source, received_at DESC);

-- Add communication_budget_alerts setting table
CREATE TABLE IF NOT EXISTS comm_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL UNIQUE,
  threshold REAL NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE comm_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON comm_alerts
  FOR ALL USING (auth.role() = 'service_role');

-- Insert default alert thresholds
INSERT INTO comm_alerts (alert_type, threshold) VALUES
  ('twilio_low_balance', 10.0),
  ('monthly_sms_spend', 50.0),
  ('monthly_email_spend', 20.0),
  ('webhook_silence_hours', 6.0)
ON CONFLICT (alert_type) DO NOTHING;
