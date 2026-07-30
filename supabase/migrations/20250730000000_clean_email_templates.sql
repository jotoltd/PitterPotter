-- Remove " Studio" suffix and "Pitter Potter — Paint your story" tagline from email templates

UPDATE email_templates
SET html_content = REPLACE(
  REPLACE(html_content, '{{studio}} Studio', '{{studio}}'),
  '<p style="text-align:center;font-size:11px;color:#1B2D3C;opacity:0.4;margin:24px 0 0;">Pitter Potter — Paint your story</p>',
  ''
)
WHERE template_key IN ('booking_confirmation', 'party_final_reminder', 'admin_booking_notification');
