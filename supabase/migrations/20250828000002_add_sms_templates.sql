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

-- Insert default SMS templates
INSERT INTO sms_templates (template_key, name, body, available_variables) VALUES
(
  'collection_ready',
  'Collection Ready Notification',
  'Hi {{name}}, your pottery from Pitter Potter {{studio}} is ready to collect! Please bring your booking ref {{bookingId}}. Our address: {{studioAddress}}. Call us: {{studioPhone}}. Thanks!',
  ARRAY['name', 'studio', 'bookingId', 'studioAddress', 'studioPhone']
),
(
  'booking_confirmation',
  'Booking Confirmation',
  'Hi {{name}}, your booking at Pitter Potter {{studio}} is confirmed for {{date}} at {{time}}. Ref: {{bookingId}}. See you there!',
  ARRAY['name', 'studio', 'date', 'time', 'bookingId']
),
(
  'party_reminder',
  'Party Reminder (2 days before)',
  'Hi {{name}}, reminder: your party at Pitter Potter {{studio}} is on {{date}} at {{time}}. Please arrive 10 mins early. Ref: {{bookingId}}',
  ARRAY['name', 'studio', 'date', 'time', 'bookingId']
),
(
  'collection_reminder',
  'Collection Reminder (14 days)',
  'Hi {{name}}, your pottery from Pitter Potter {{studio}} has been ready for 14 days. Please collect it soon! Ref: {{bookingId}}. Address: {{studioAddress}}',
  ARRAY['name', 'studio', 'bookingId', 'studioAddress']
),
(
  'no_show_followup',
  'No-show Follow-up',
  'Hi {{name}}, we missed you at Pitter Potter {{studio}} on {{date}}. Would you like to rebook? Call us: {{studioPhone}}',
  ARRAY['name', 'studio', 'date', 'studioPhone']
);
