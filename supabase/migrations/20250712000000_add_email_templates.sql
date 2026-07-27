-- Email templates table for admin-editable email content
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  available_variables TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Only service role can access (admin reads/writes via edge function)
CREATE POLICY "Service role full access" ON email_templates
  FOR ALL USING (auth.role() = 'service_role');

-- Insert default templates
INSERT INTO email_templates (template_key, name, subject, html_content, available_variables) VALUES
(
  'admin_booking_notification',
  'Admin Booking Notification',
  'New booking request — {{studio}} on {{date}} ({{bookingId}})',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1B2D3C;">
  <h2 style="color: #1B2D3C;">New Booking Request — {{studio}}</h2>
  <p>A new booking request has been submitted for the <strong>{{studio}}</strong> studio.</p>
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Reference</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">{{bookingId}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Customer Name</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">{{name}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;"><a href="mailto:{{email}}">{{email}}</a></td></tr>
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Phone</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">{{phone}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Date</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">{{date}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Time</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">{{time}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Painters</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">{{paintersCount}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Session</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">{{sessionType}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Notes</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">{{notes}}</td></tr>
  </table>
  <p style="color: #666; font-size: 12px;">Log in to the Pitter Potter admin dashboard to confirm or manage this booking.</p>
</div>',
  ARRAY['bookingId', 'name', 'email', 'phone', 'studio', 'date', 'time', 'paintersCount', 'sessionType', 'notes']
),
(
  'booking_confirmation',
  'Booking Confirmation (Customer)',
  'Booking confirmed — {{studio}} on {{date}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1B2D3C;">
  <h2 style="color: #1B2D3C;">Your booking is confirmed</h2>
  <p>Hi {{name}},</p>
  <p>Your booking at <strong>{{studio}}</strong> has been confirmed.</p>
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Reference</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">{{bookingId}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Date</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">{{date}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Time</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">{{time}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Studio</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">{{studio}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Painters</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">{{paintersCount}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Session</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">{{sessionType}}</td></tr>
  </table>
  <p>We look forward to seeing you in the studio!</p>
  <p>Pitter Potter</p>
</div>',
  ARRAY['bookingId', 'name', 'studio', 'date', 'time', 'paintersCount', 'sessionType']
),
(
  'party_final_reminder',
  'Party Final Payment Reminder',
  'Final payment for your party — {{studio}} on {{date}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1B2D3C;">
  <h2 style="color: #1B2D3C;">Your party is almost here</h2>
  <p>Hi {{name}},</p>
  <p>Your party at <strong>{{studio}}</strong> is on <strong>{{date}}</strong> at <strong>{{time}}</strong>.</p>
  <p>Please confirm your final number of seats so we can prepare everything for you.</p>
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Reference</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">{{bookingId}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Final seats</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">{{finalSeats}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Price per person</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">£{{partyPrice}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Total</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">£{{totalAmount}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Deposit paid</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">−£{{depositAmount}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Final balance</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>£{{finalBalance}}</strong></td></tr>
  </table>
  <p style="text-align: center; margin: 30px 0;">
    <a href="{{paymentLinkUrl}}" style="background: #1B2D3C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Pay final balance</a>
  </p>
  <p>If your numbers have changed, please reply to this email or call us and we will adjust the balance.</p>
  <p>Pitter Potter</p>
</div>',
  ARRAY['bookingId', 'name', 'studio', 'date', 'time', 'finalSeats', 'partyPrice', 'totalAmount', 'depositAmount', 'finalBalance', 'paymentLinkUrl']
)
ON CONFLICT (template_key) DO NOTHING;
