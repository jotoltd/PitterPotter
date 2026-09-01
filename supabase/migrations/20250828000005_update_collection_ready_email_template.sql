-- Update collection_ready email template:
--   * New "Please note" copy (6 week collection window, bring own bag, closed Mondays)
--   * Replace "Need to check your booking details?" button with a QR code
UPDATE email_templates
SET
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
      <h2 style="font-family:''Montserrat'',''Outfit'',''Plus Jakarta Sans'',''Inter'',sans-serif;font-size:22px;font-weight:900;color:#1B2D3C;margin:0 0 16px;">Your pottery is ready to collect!</h2>

      <p style="font-size:15px;line-height:1.6;color:#1B2D3C;margin:0 0 16px;">Hi {{name}},</p>
      <p style="font-size:15px;line-height:1.6;color:#1B2D3C;margin:0 0 24px;">Great news! The pottery you painted at <strong style="color:#1B2D3C;">{{studio}}</strong> on <strong>{{date}}</strong> is now ready for collection.</p>

      <div style="background:#DBE7E4;border-radius:12px;padding:24px;margin:0 0 24px;">
        <p style="font-size:14px;line-height:1.8;margin:0;color:#1B2D3C;">
          <strong style="display:inline-block;width:90px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Studio</strong> {{studio}}<br/>
          <strong style="display:inline-block;width:90px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Address</strong> {{studioAddress}}<br/>
          <strong style="display:inline-block;width:90px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Phone</strong> {{studioPhone}}
        </p>
      </div>

      <div style="background:#FEF3C7;border-radius:12px;padding:20px;margin:0 0 24px;border:1px solid #FDE68A;">
        <p style="font-size:14px;line-height:1.6;margin:0 0 12px;color:#92400E;">
          <strong style="font-size:12px;text-transform:uppercase;letter-spacing:1px;">Please note</strong>
        </p>
        <p style="font-size:14px;line-height:1.6;margin:0 0 12px;color:#92400E;">Please collect within <strong>6 WEEKS</strong>, after this period your item(s) may be donated to charity.</p>
        <p style="font-size:14px;line-height:1.6;margin:0 0 12px;color:#92400E;">Please also bring your own bag if you can.</p>
        <p style="font-size:14px;line-height:1.6;margin:0;color:#92400E;">Closed on Mondays except school holidays.</p>
      </div>

      <div style="background:#FFFFFF;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;border:1px solid #D6E2E9;">
        <img src="{{qrCodeUrl}}" alt="Booking QR code" width="160" height="160" style="display:block;margin:0 auto 12px;width:160px;height:160px;border-radius:8px;" />
        <p style="font-size:12px;color:#1B2D3C;opacity:0.6;margin:0;font-weight:600;">Scan on arrival</p>
      </div>

      <p style="font-size:15px;line-height:1.6;color:#1B2D3C;margin:0 0 8px;">We can''t wait for you to see your finished pieces!</p>
    </div>

    <div style="text-align:center;margin-top:24px;padding-top:24px;border-top:1px solid #D6E2E9;">
      <p style="font-size:13px;color:#1B2D3C;font-weight:700;margin:0 0 4px;">{{studio}}</p>
      <p style="font-size:12px;color:#1B2D3C;opacity:0.6;margin:0 0 2px;line-height:1.5;">{{studioAddress}}</p>
      <p style="font-size:12px;color:#1B2D3C;opacity:0.6;margin:0;">{{studioPhone}}</p>
    </div>
  </div>
</body>
</html>',
  available_variables = ARRAY['name', 'studio', 'studioAddress', 'studioPhone', 'date', 'sessionType', 'manageUrl', 'qrCodeUrl'],
  updated_at = NOW()
WHERE template_key = 'collection_ready';
