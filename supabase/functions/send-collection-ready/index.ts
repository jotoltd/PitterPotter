import { createClient } from 'supabase';
import { isObject, isNonEmptyString } from '../_shared/validate.ts';
import { loadEmailTemplate, renderTemplate } from '../_shared/email-template.ts';
import { loadSMSTemplate } from '../_shared/sms-template.ts';
import { getStudioInfo } from '../_shared/studio-info.ts';
import { corsHeaders as makeCorsHeaders, optionsResponse } from '../_shared/cors.ts';

const SESSION_LABELS: Record<string, string> = {
  'painting': 'Pottery Painting',
  'clay-imprints': 'Baby Prints',
  'birthday-party': 'Birthday Party',
  'baby-shower-hen': 'Baby Shower / Hen Party',
  'corporate': 'Corporate Event',
};

async function sendReadySMS(
  booking: {
    booking_id: string;
    name: string;
    phone: string;
    studio: string;
    management_token: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio not configured; skipping SMS');
    return { success: false, error: 'SMS service not configured' };
  }

  let toNumber = booking.phone.trim();
  if (toNumber.startsWith('07')) {
    toNumber = '+44' + toNumber.substring(1);
  } else if (toNumber.startsWith('7') && !toNumber.startsWith('+')) {
    toNumber = '+44' + toNumber;
  } else if (!toNumber.startsWith('+')) {
    toNumber = '+' + toNumber;
  }

  const studioInfo = getStudioInfo(booking.studio);
  const studioName = `Pitter Potter ${booking.studio}`;
  const siteUrl = (Deno.env.get('SITE_URL') || 'https://www.pitterpotter.co.uk').replace(/\/+$/, '');
  const manageUrl = booking.management_token
    ? `${siteUrl}/manage-booking?token=${booking.management_token}`
    : '';

  let message: string;
  const smsTemplate = await loadSMSTemplate('collection_ready');
  if (smsTemplate) {
    message = renderTemplate(smsTemplate.body, {
      name: booking.name,
      studio: booking.studio,
      bookingId: booking.booking_id,
      studioAddress: studioInfo.address,
      studioPhone: studioInfo.phone,
      manageUrl,
    });
  } else {
    message = `Dear ${booking.name}, your pottery from ${studioName} is ready to collect!\n\nClick here to show the QR code for collection: ${manageUrl}\n\nPlease collect within 6 WEEKS, after this period your item(s) may be donated to charity.\n\nPlease also bring your own bag if you can.\n\nClosed on Mondays except school holidays.\n\nAddress: ${studioInfo.address}`;
  }

  if (message.length > 160) {
    console.warn(`SMS message is ${message.length} chars, will be split into multiple segments`);
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const body = new URLSearchParams();
    body.append('From', fromNumber);
    body.append('To', toNumber);
    body.append('Body', message);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Twilio error:', errorData);
      return { success: false, error: errorData.message || 'Failed to send SMS' };
    }

    const twilioData = await response.json().catch(() => ({}));

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (supabaseUrl && supabaseServiceKey) {
        const logClient = createClient(supabaseUrl, supabaseServiceKey);
        await logClient.from('email_logs').insert({
          email_type: 'collection_ready_sms',
          recipient: booking.phone,
          subject: 'Collection Ready SMS',
          resend_id: twilioData.sid || null,
          status: 'sent',
          booking_id: booking.booking_id,
        });
      }
    } catch (logErr) {
      console.error('Failed to log SMS:', logErr);
    }

    return { success: true };
  } catch (err) {
    console.error('Send collection-ready SMS error:', err);
    return { success: false, error: 'Failed to send SMS' };
  }
}

async function sendReadyEmail(
  booking: {
    booking_id: string;
    name: string;
    email: string;
    studio: string;
    date: string;
    time: string;
    painters_count: number;
    session_type: string;
    management_token: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'bookings@pitterpotter.co.uk';
  if (!resendKey) {
    console.warn('RESEND_API_KEY not set; skipping collection-ready email');
    return { success: false, error: 'Email service not configured' };
  }

  const formatDate = (d: string) => {
    const parts = d.split('-');
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : d;
  };
  const formattedDate = formatDate(booking.date);

  const studioName = `Pitter Potter ${booking.studio}`;
  const studioInfo = getStudioInfo(booking.studio);
  const siteUrl = (Deno.env.get('SITE_URL') || 'https://www.pitterpotter.co.uk').replace(/\/+$/, '');
  const manageUrl = booking.management_token
    ? `${siteUrl}/manage-booking?token=${booking.management_token}`
    : '';
  const qrCodeUrl = manageUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(manageUrl)}`
    : '';

  const subject = `Your pottery is ready to collect — ${studioName}`;

  const templateVars: Record<string, string | number | undefined> = {
    name: booking.name,
    studio: studioName,
    studioAddress: studioInfo.address,
    studioPhone: studioInfo.phone,
    date: formattedDate,
    sessionType: SESSION_LABELS[booking.session_type] || booking.session_type,
    manageUrl,
    qrCodeUrl,
  };

  const tpl = await loadEmailTemplate('collection_ready');
  const fallbackHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#FFFFFF;font-family:'DM Sans','Outfit','Plus Jakarta Sans','Inter',sans-serif;color:#1B2D3C;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://www.pitterpotter.co.uk/pp_logo.png" alt="Pitter Potter" style="height:56px;width:auto;margin:0 auto 12px;display:block;" />
      <p style="font-size:11px;color:#1B2D3C;opacity:0.5;margin:0;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Pottery Painting Studio</p>
    </div>

    <div style="background:#FFFFFF;border-radius:16px;padding:32px;border:1px solid #D6E2E9;">
      <h2 style="font-family:'Montserrat','Outfit','Plus Jakarta Sans','Inter',sans-serif;font-size:22px;font-weight:900;color:#1B2D3C;margin:0 0 16px;">Your pottery is ready to collect!</h2>

      <p style="font-size:15px;line-height:1.6;color:#1B2D3C;margin:0 0 16px;">Hi ${booking.name},</p>
      <p style="font-size:15px;line-height:1.6;color:#1B2D3C;margin:0 0 24px;">Great news! The pottery you painted at <strong style="color:#1B2D3C;">${studioName}</strong> on <strong>${formattedDate}</strong> is now ready for collection.</p>

      <div style="background:#DBE7E4;border-radius:12px;padding:24px;margin:0 0 24px;">
        <p style="font-size:14px;line-height:1.8;margin:0;color:#1B2D3C;">
          <strong style="display:inline-block;width:90px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Studio</strong> ${studioName}<br/>
          <strong style="display:inline-block;width:90px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Address</strong> ${studioInfo.address}<br/>
          <strong style="display:inline-block;width:90px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Phone</strong> ${studioInfo.phone}
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

      ${manageUrl ? `
      <div style="background:#FFFFFF;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;border:1px solid #D6E2E9;">
        <img src="${qrCodeUrl}" alt="Booking QR code" width="160" height="160" style="display:block;margin:0 auto 12px;width:160px;height:160px;border-radius:8px;" />
        <p style="font-size:12px;color:#1B2D3C;opacity:0.6;margin:0;font-weight:600;">Scan on arrival</p>
      </div>
      ` : ''}

      <p style="font-size:15px;line-height:1.6;color:#1B2D3C;margin:0 0 8px;">We can't wait for you to see your finished pieces!</p>
    </div>

    <div style="text-align:center;margin-top:24px;padding-top:24px;border-top:1px solid #D6E2E9;">
      <p style="font-size:13px;color:#1B2D3C;font-weight:700;margin:0 0 4px;">${studioName}</p>
      <p style="font-size:12px;color:#1B2D3C;opacity:0.6;margin:0 0 2px;line-height:1.5;">${studioInfo.address}</p>
      <p style="font-size:12px;color:#1B2D3C;opacity:0.6;margin:0;">${studioInfo.phone}</p>
    </div>
  </div>
</body>
</html>
  `;

  const html = tpl ? renderTemplate(tpl.html_content, templateVars) : fallbackHtml;
  const finalSubject = tpl ? renderTemplate(tpl.subject, templateVars) : subject;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Pitter Potter <${fromEmail}>`,
        to: booking.email,
        subject: finalSubject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Resend error:', errorData);
      return { success: false, error: errorData.message || 'Failed to send email' };
    }

    const resendData = await response.json().catch(() => ({}));

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (supabaseUrl && supabaseServiceKey) {
        const logClient = createClient(supabaseUrl, supabaseServiceKey);
        await logClient.from('email_logs').insert({
          email_type: 'collection_ready',
          recipient: booking.email,
          subject: finalSubject,
          resend_id: resendData.id || null,
          status: 'sent',
          booking_id: booking.booking_id,
        });
      }
    } catch (logErr) {
      console.error('Failed to log email:', logErr);
    }

    return { success: true };
  } catch (err) {
    console.error('Send collection-ready email error:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req, true);
  }
  const corsHeaders = makeCorsHeaders(req, true);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    if (!isObject(body)) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { bookingId } = body;
    if (!isNonEmptyString(bookingId)) {
      return new Response(JSON.stringify({ error: 'Missing bookingId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send both email and SMS when available
    const results: { email?: { success: boolean; error?: string }; sms?: { success: boolean; error?: string } } = {};

    if (booking.email) {
      results.email = await sendReadyEmail({
        booking_id: booking.booking_id,
        name: booking.name,
        email: booking.email,
        studio: booking.studio,
        date: booking.date,
        time: booking.time,
        painters_count: booking.painters_count,
        session_type: booking.session_type,
        management_token: booking.management_token,
      });
    }

    if (booking.phone) {
      results.sms = await sendReadySMS({
        booking_id: booking.booking_id,
        name: booking.name,
        phone: booking.phone,
        studio: booking.studio,
        management_token: booking.management_token,
      });
    }

    if (!booking.email && !booking.phone) {
      return new Response(JSON.stringify({ error: 'Booking has no email or phone number' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Send collection-ready error:', err);
    return new Response(JSON.stringify({ error: 'Failed to send notification' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
