-- SMS templates table for admin-editable SMS content
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  available_variables TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

-- Only service role can access (admin reads/writes via edge function)
CREATE POLICY "Service role full access" ON sms_templates
  FOR ALL USING (auth.role() = 'service_role');

-- Insert default SMS template (only collection_ready needed)
INSERT INTO sms_templates (template_key, name, body, available_variables) VALUES
(
  'collection_ready',
  'Collection Ready Notification',
  'Hi {{name}}, your pottery from Pitter Potter {{studio}} is ready to collect! Please bring your booking ref {{bookingId}}. Our address: {{studioAddress}}. Call us: {{studioPhone}}. Thanks!',
  ARRAY['name', 'studio', 'bookingId', 'studioAddress', 'studioPhone']
);
