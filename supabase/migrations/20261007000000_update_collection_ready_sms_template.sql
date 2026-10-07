-- Update collection_ready SMS template to shorter first-name message
UPDATE sms_templates
SET body = 'Dear {{firstName}}, your pottery is ready to collect. Please bring a bag and collect within 6 weeks. Collection QR code {{manageUrl}}',
    available_variables = ARRAY['name', 'firstName', 'manageUrl'],
    updated_at = now()
WHERE template_key = 'collection_ready';
