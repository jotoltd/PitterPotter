-- Update email templates to match the branded fallback HTML design
-- Uses template variables ({{var}}) instead of hardcoded values

UPDATE email_templates
SET available_variables = ARRAY['bookingId', 'name', 'studio', 'studioAddress', 'studioPhone', 'date', 'time', 'paintersCount', 'sessionType', 'manageUrl'],
    subject = 'Booking confirmed — {{studio}} on {{date}}',
    html_content = '<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#FFFFFF;font-family:''DM Sans'',''Outfit'',''Plus Jakarta Sans'',''Inter'',sans-serif;color:#1B2D3C;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://www.pitterpotter.co.uk/pp_logo.png" alt="Pitter Potter" style="height:56px;width:auto;margin:0 auto 12px;display:block;" />
      <p style="font-size:11px;color:#1B2D3C;opacity:0.5;margin:0;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Pottery Painting Studio</p>
    </div>

    <div style="background:#FFFFFF;border-radius:16px;padding:32px;border:1px solid #D6E2E9;">
      <h2 style="font-family:''Montserrat'',''Outfit'',''Plus Jakarta Sans'',''Inter'',sans-serif;font-size:22px;font-weight:900;color:#1B2D3C;margin:0 0 16px;">Your booking is confirmed!</h2>

      <p style="font-size:15px;line-height:1.6;color:#1B2D3C;margin:0 0 24px;">Hi {{name}},</p>
      <p style="font-size:15px;line-height:1.6;color:#1B2D3C;margin:0 0 24px;">We''re looking forward to seeing you at <strong style="color:#1B2D3C;">{{studio}}</strong>. Here are your booking details:</p>

      <div style="background:#DBE7E4;border-radius:12px;padding:24px;margin:0 0 24px;">
        <p style="font-size:14px;line-height:1.8;margin:0;color:#1B2D3C;">
          <strong style="display:inline-block;width:80px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Date</strong> {{date}}<br/>
          <strong style="display:inline-block;width:80px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Time</strong> {{time}}<br/>
          <strong style="display:inline-block;width:80px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Studio</strong> {{studio}}<br/>
          <strong style="display:inline-block;width:80px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Seats</strong> {{paintersCount}}<br/>
          <strong style="display:inline-block;width:80px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Session</strong> {{sessionType}}
        </p>
      </div>

      <div style="background:#FFFFFF;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;border:1px solid #D6E2E9;">
        <p style="font-size:14px;color:#1B2D3C;margin:0 0 12px;font-weight:600;">Need to reschedule or cancel?</p>
        <a href="{{manageUrl}}" style="display:inline-block;padding:12px 32px;background:#DBE7E4;color:#1B2D3C;text-decoration:none;font-weight:700;border-radius:8px;font-size:14px;font-family:''DM Sans'',''Outfit'',''Inter'',sans-serif;border:1px solid #1B2D3C;">Manage your booking</a>
      </div>

      <p style="font-size:15px;line-height:1.6;color:#1B2D3C;margin:0 0 8px;">We can''t wait to see your creations!</p>
    </div>

    <div style="text-align:center;margin-top:24px;padding-top:24px;border-top:1px solid #D6E2E9;">
      <p style="font-size:13px;color:#1B2D3C;font-weight:700;margin:0 0 4px;">{{studio}} Studio</p>
      <p style="font-size:12px;color:#1B2D3C;opacity:0.6;margin:0 0 2px;line-height:1.5;">{{studioAddress}}</p>
      <p style="font-size:12px;color:#1B2D3C;opacity:0.6;margin:0;">{{studioPhone}}</p>
    </div>

    <p style="text-align:center;font-size:11px;color:#1B2D3C;opacity:0.4;margin:24px 0 0;">Pitter Potter — Paint your story</p>
  </div>
</body>
</html>'
WHERE template_key = 'booking_confirmation';

-- Update party_final_reminder to match branded design
UPDATE email_templates
SET available_variables = ARRAY['bookingId', 'name', 'studio', 'studioAddress', 'studioPhone', 'date', 'time', 'finalSeats', 'partyPrice', 'totalAmount', 'depositAmount', 'finalBalance', 'paymentLinkUrl'],
    subject = 'Final payment for your party — {{studio}} on {{date}}',
    html_content = '<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#FFFFFF;font-family:''DM Sans'',''Outfit'',''Plus Jakarta Sans'',''Inter'',sans-serif;color:#1B2D3C;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://www.pitterpotter.co.uk/pp_logo.png" alt="Pitter Potter" style="height:56px;width:auto;margin:0 auto 12px;display:block;" />
      <p style="font-size:11px;color:#1B2D3C;opacity:0.5;margin:0;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Pottery Painting Studio</p>
    </div>

    <div style="background:#FFFFFF;border-radius:16px;padding:32px;border:1px solid #D6E2E9;">
      <h2 style="font-family:''Montserrat'',''Outfit'',''Plus Jakarta Sans'',''Inter'',sans-serif;font-size:22px;font-weight:900;color:#1B2D3C;margin:0 0 16px;">Your party is almost here!</h2>

      <p style="font-size:15px;line-height:1.6;color:#1B2D3C;margin:0 0 24px;">Hi {{name}},</p>
      <p style="font-size:15px;line-height:1.6;color:#1B2D3C;margin:0 0 24px;">Your party at <strong style="color:#1B2D3C;">{{studio}}</strong> is on <strong>{{date}}</strong> at <strong>{{time}}</strong>.</p>
      <p style="font-size:15px;line-height:1.6;color:#1B2D3C;margin:0 0 24px;">Please confirm your final number of seats so we can prepare everything for you.</p>

      <div style="background:#DBE7E4;border-radius:12px;padding:24px;margin:0 0 24px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#1B2D3C;">
          <tr><td style="padding:8px 0;font-weight:600;">Final seats</td><td style="padding:8px 0;text-align:right;">{{finalSeats}}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600;">Price per person</td><td style="padding:8px 0;text-align:right;">£{{partyPrice}}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600;">Total</td><td style="padding:8px 0;text-align:right;">£{{totalAmount}}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600;">Deposit paid</td><td style="padding:8px 0;text-align:right;">−£{{depositAmount}}</td></tr>
          <tr style="border-top:1px solid #D6E2E9;"><td style="padding:12px 0;font-weight:900;font-size:16px;">Final balance</td><td style="padding:12px 0;text-align:right;font-weight:900;font-size:16px;">£{{finalBalance}}</td></tr>
        </table>
      </div>

      <div style="text-align:center;margin:0 0 24px;">
        <a href="{{paymentLinkUrl}}" style="display:inline-block;padding:14px 36px;background:#1B2D3C;color:#FFFFFF;text-decoration:none;font-weight:700;border-radius:8px;font-size:15px;font-family:''DM Sans'',''Outfit'',''Inter'',sans-serif;">Confirm and pay final balance</a>
      </div>

      <p style="font-size:14px;line-height:1.6;color:#1B2D3C;opacity:0.7;margin:0 0 8px;">If your numbers have changed, you can adjust them on the payment page before paying.</p>
    </div>

    <div style="text-align:center;margin-top:24px;padding-top:24px;border-top:1px solid #D6E2E9;">
      <p style="font-size:13px;color:#1B2D3C;font-weight:700;margin:0 0 4px;">{{studio}} Studio</p>
      <p style="font-size:12px;color:#1B2D3C;opacity:0.6;margin:0 0 2px;line-height:1.5;">{{studioAddress}}</p>
      <p style="font-size:12px;color:#1B2D3C;opacity:0.6;margin:0;">{{studioPhone}}</p>
    </div>

    <p style="text-align:center;font-size:11px;color:#1B2D3C;opacity:0.4;margin:24px 0 0;">Pitter Potter — Paint your story</p>
  </div>
</body>
</html>'
WHERE template_key = 'party_final_reminder';

-- Update admin_booking_notification to match branded design
UPDATE email_templates
SET available_variables = ARRAY['bookingId', 'name', 'email', 'phone', 'studio', 'studioAddress', 'studioPhone', 'date', 'time', 'paintersCount', 'sessionType', 'notes'],
    subject = 'New booking request — {{studio}} on {{date}}',
    html_content = '<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#FFFFFF;font-family:''DM Sans'',''Outfit'',''Plus Jakarta Sans'',''Inter'',sans-serif;color:#1B2D3C;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://www.pitterpotter.co.uk/pp_logo.png" alt="Pitter Potter" style="height:56px;width:auto;margin:0 auto 12px;display:block;" />
      <p style="font-size:11px;color:#1B2D3C;opacity:0.5;margin:0;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Pottery Painting Studio</p>
    </div>

    <div style="background:#FFFFFF;border-radius:16px;padding:32px;border:1px solid #D6E2E9;">
      <h2 style="font-family:''Montserrat'',''Outfit'',''Plus Jakarta Sans'',''Inter'',sans-serif;font-size:22px;font-weight:900;color:#1B2D3C;margin:0 0 16px;">New Booking Request — {{studio}}</h2>

      <p style="font-size:15px;line-height:1.6;color:#1B2D3C;margin:0 0 24px;">A new booking request has been submitted for the <strong>{{studio}}</strong> studio.</p>

      <div style="background:#DBE7E4;border-radius:12px;padding:24px;margin:0 0 24px;">
        <p style="font-size:14px;line-height:1.8;margin:0;color:#1B2D3C;">
          <strong style="display:inline-block;width:120px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Customer</strong> {{name}}<br/>
          <strong style="display:inline-block;width:120px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Email</strong> <a href="mailto:{{email}}" style="color:#1B2D3C;">{{email}}</a><br/>
          <strong style="display:inline-block;width:120px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Phone</strong> {{phone}}<br/>
          <strong style="display:inline-block;width:120px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Date</strong> {{date}}<br/>
          <strong style="display:inline-block;width:120px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Time</strong> {{time}}<br/>
          <strong style="display:inline-block;width:120px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Painters</strong> {{paintersCount}}<br/>
          <strong style="display:inline-block;width:120px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Session</strong> {{sessionType}}
        </p>
      </div>

      <p style="font-size:14px;line-height:1.6;color:#1B2D3C;opacity:0.7;margin:0 0 8px;">Log in to the Pitter Potter admin dashboard to confirm or manage this booking.</p>
    </div>

    <div style="text-align:center;margin-top:24px;padding-top:24px;border-top:1px solid #D6E2E9;">
      <p style="font-size:13px;color:#1B2D3C;font-weight:700;margin:0 0 4px;">{{studio}} Studio</p>
      <p style="font-size:12px;color:#1B2D3C;opacity:0.6;margin:0 0 2px;line-height:1.5;">{{studioAddress}}</p>
      <p style="font-size:12px;color:#1B2D3C;opacity:0.6;margin:0;">{{studioPhone}}</p>
    </div>

    <p style="text-align:center;font-size:11px;color:#1B2D3C;opacity:0.4;margin:24px 0 0;">Pitter Potter — Paint your story</p>
  </div>
</body>
</html>'
WHERE template_key = 'admin_booking_notification';
