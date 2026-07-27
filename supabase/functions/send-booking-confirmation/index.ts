import { createClient } from 'supabase';
import { isObject, isNonEmptyString } from '../_shared/validate.ts';
import { loadEmailTemplate, renderTemplate } from '../_shared/email-template.ts';
import { getStudioInfo } from '../_shared/studio-info.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingRow {
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

async function sendEmail(
  booking: BookingRow,
  managementToken: string,
): Promise<{ success: boolean; error?: string }> {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'bookings@pitterpotter.co.uk';
  if (!resendKey) {
    console.warn('RESEND_API_KEY not set; skipping confirmation email');
    return { success: false, error: 'Email service not configured' };
  }

  const subject = `Booking confirmed — ${booking.studio} on ${booking.date}`;
  const manageUrl = `${Deno.env.get('SITE_URL') || 'https://www.pitterpotter.co.uk'}/manage-booking?token=${managementToken}`;

  const studioInfo = getStudioInfo(booking.studio);
  const templateVars: Record<string, string | number | undefined> = {
    bookingId: booking.booking_id,
    name: booking.name,
    studio: booking.studio,
    studioAddress: studioInfo.address,
    studioPhone: studioInfo.phone,
    date: booking.date,
    time: booking.time,
    paintersCount: booking.painters_count,
    sessionType: booking.session_type,
    manageUrl,
  };

  const tpl = await loadEmailTemplate('booking_confirmation');
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
      <img src="https://www.pitterpotter.co.uk/assets/images/pp_logo.png" alt="Pitter Potter" style="height:56px;width:auto;margin:0 auto 12px;display:block;" />
      <p style="font-size:11px;color:#1B2D3C;opacity:0.5;margin:0;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Pottery Painting Studio</p>
    </div>

    <div style="background:#DBE7E4;border-radius:16px;padding:32px;">
      <h2 style="font-family:'Montserrat','Outfit','Plus Jakarta Sans','Inter',sans-serif;font-size:22px;font-weight:900;color:#1B2D3C;margin:0 0 16px;">Your booking is confirmed!</h2>

      <p style="font-size:15px;line-height:1.6;color:#1B2D3C;margin:0 0 24px;">Hi ${booking.name},</p>
      <p style="font-size:15px;line-height:1.6;color:#1B2D3C;margin:0 0 24px;">We're looking forward to seeing you at <strong style="color:#1B2D3C;">${booking.studio}</strong>. Here are your booking details:</p>

      <div style="background:#FFFFFF;border-radius:12px;padding:24px;margin:0 0 24px;border:1px solid #D6E2E9;">
        <p style="font-size:14px;line-height:1.8;margin:0;color:#1B2D3C;">
          <strong style="display:inline-block;width:80px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Date</strong> ${booking.date}<br/>
          <strong style="display:inline-block;width:80px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Time</strong> ${booking.time}<br/>
          <strong style="display:inline-block;width:80px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Studio</strong> ${booking.studio}<br/>
          <strong style="display:inline-block;width:80px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Seats</strong> ${booking.painters_count}<br/>
          <strong style="display:inline-block;width:80px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Session</strong> ${booking.session_type}
        </p>
      </div>

      <div style="background:#D6E2E9;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
        <p style="font-size:14px;color:#1B2D3C;margin:0 0 12px;font-weight:600;">Need to reschedule or cancel?</p>
        <a href="${manageUrl}" style="display:inline-block;padding:12px 32px;background:#1B2D3C;color:#FFFFFF;text-decoration:none;font-weight:700;border-radius:8px;font-size:14px;font-family:'DM Sans','Outfit','Inter',sans-serif;">Manage your booking</a>
      </div>

      <p style="font-size:15px;line-height:1.6;color:#1B2D3C;margin:0 0 8px;">We can't wait to see your creations!</p>
    </div>

    <div style="text-align:center;margin-top:24px;padding-top:24px;border-top:1px solid #D6E2E9;">
      <p style="font-size:13px;color:#1B2D3C;font-weight:700;margin:0 0 4px;">${booking.studio} Studio</p>
      <p style="font-size:12px;color:#1B2D3C;opacity:0.6;margin:0 0 2px;line-height:1.5;">${studioInfo.address}</p>
      <p style="font-size:12px;color:#1B2D3C;opacity:0.6;margin:0;">${studioInfo.phone}</p>
    </div>

    <p style="text-align:center;font-size:11px;color:#1B2D3C;opacity:0.4;margin:24px 0 0;">Pitter Potter — Paint your story</p>
  </div>
</body>
</html>
        `;
  const html = fallbackHtml;
  const finalSubject = subject;

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

    // Log to email_logs
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (supabaseUrl && supabaseServiceKey) {
        const logClient = createClient(supabaseUrl, supabaseServiceKey);
        await logClient.from('email_logs').insert({
          email_type: 'booking_confirmation',
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
    console.error('Send email error:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

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
    const { bookingId, managementToken } = body;

    if (!isNonEmptyString(bookingId)) {
      return new Response(JSON.stringify({ error: 'Missing bookingId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_id', bookingId)
      .single() as { data: BookingRow | null; error: Error | null };

    if (!booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use the token from the request (newly generated) or fall back to stored token
    const token = managementToken || booking.management_token;
    if (!token) {
      return new Response(JSON.stringify({ error: 'No management token available' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await sendEmail(booking, token);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Send booking confirmation error:', err);
    return new Response(JSON.stringify({ error: 'Failed to send confirmation' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
