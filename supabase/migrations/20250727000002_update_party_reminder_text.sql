-- Update party_final_reminder template text to reflect adjustable seats on payment page
UPDATE email_templates
SET html_content = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1B2D3C;">
  <h2 style="color: #1B2D3C;">Your party is almost here</h2>
  <p>Hi {{name}},</p>
  <p>Your party at <strong>{{studio}}</strong> is on <strong>{{date}}</strong> at <strong>{{time}}</strong>.</p>
  <p>Please confirm your final number of seats so we can prepare everything for you.</p>
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Final seats</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">{{finalSeats}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Price per person</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">£{{partyPrice}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Total</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">£{{totalAmount}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Deposit paid</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">−£{{depositAmount}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Final balance</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>£{{finalBalance}}</strong></td></tr>
  </table>
  <p style="text-align: center; margin: 30px 0;">
    <a href="{{paymentLinkUrl}}" style="background: #1B2D3C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Confirm and pay final balance</a>
  </p>
  <p>If your numbers have changed, you can adjust them on the payment page before paying.</p>
  <p style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #DBE7E4; font-size: 12px; color: #666;">
    <strong>{{studio}} Studio</strong><br/>
    {{studioAddress}}<br/>
    {{studioPhone}}
  </p>
  <p>Pitter Potter</p>
</div>'
WHERE template_key = 'party_final_reminder';
