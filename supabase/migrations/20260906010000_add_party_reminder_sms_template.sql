-- Add party_reminder SMS template
INSERT INTO sms_templates (template_key, name, body, available_variables)
VALUES (
  'party_reminder',
  'Party Reminder (Automated)',
  'Hi {{name}}, reminder: your party at {{studio}} is on {{date}} at {{time}}. We can''t wait to see you! Questions? Call {{studioPhone}}. Ref: {{bookingId}}',
  ARRAY['name', 'studio', 'studioAddress', 'studioPhone', 'date', 'time', 'bookingId']
)
ON CONFLICT (template_key) DO NOTHING;
