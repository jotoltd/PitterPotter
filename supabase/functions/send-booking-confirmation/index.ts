import { createClient } from 'supabase';
import { isObject, isNonEmptyString } from '../_shared/validate.ts';
import { loadEmailTemplate, renderTemplate } from '../_shared/email-template.ts';
import { getStudioInfo } from '../_shared/studio-info.ts';
import { isRateLimited, rateLimitResponse, getClientIp } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SESSION_LABELS: Record<string, string> = {
  'painting': 'Pottery Painting',
  'clay-imprints': 'Baby Prints',
  'birthday-party': 'Birthday Party',
  'baby-shower-hen': 'Baby Shower / Hen Party',
  'corporate': 'Corporate Event',
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
  deposit_amount: number | null;
  final_seats: number | null;
  final_balance: number | null;
  final_price: number | null;
  estimated_price: number | null;
  payment_status: string | null;
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

  const formatDate = (d: string) => {
    const parts = d.split('-');
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : d;
  };
  const formattedDate = formatDate(booking.date);

  const studioName = `Pitter Potter ${booking.studio}`;
  const subject = `Booking confirmed — ${studioName} on ${formattedDate}`;
  const siteUrl = (Deno.env.get('SITE_URL') || 'https://www.pitterpotter.co.uk').replace(/\/+$/, '');
  const manageUrl = `${siteUrl}/manage-booking?token=${managementToken}`;

  const studioInfo = getStudioInfo(booking.studio);
  const isParty = ['birthday-party', 'baby-shower-hen', 'corporate'].includes(booking.session_type);
  const depositAmount = booking.deposit_amount ? Number(booking.deposit_amount) : 0;
  const finalSeats = booking.final_seats ? Number(booking.final_seats) : booking.painters_count;
  const finalBalance = booking.final_balance ? Number(booking.final_balance) : 0;
  const estimatedPrice = booking.estimated_price ? Number(booking.estimated_price) : 0;
  const templateVars: Record<string, string | number | undefined> = {
    bookingId: booking.booking_id,
    name: booking.name,
    studio: studioName,
    studioAddress: studioInfo.address,
    studioPhone: studioInfo.phone,
    date: formattedDate,
    time: booking.time,
    paintersCount: booking.painters_count,
    sessionType: SESSION_LABELS[booking.session_type] || booking.session_type,
    manageUrl,
    isParty: isParty ? 'yes' : 'no',
    depositAmount: depositAmount.toFixed(2),
    finalSeats,
    finalBalance: finalBalance.toFixed(2),
    estimatedPrice: estimatedPrice.toFixed(2),
  };

  const tpl = await loadEmailTemplate(isParty ? 'party_confirmation' : 'booking_confirmation');
  const fallbackHtml = isParty ? `
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
      <h2 style="font-family:'Montserrat','Outfit','Plus Jakarta Sans','Inter',sans-serif;font-size:22px;font-weight:900;color:#1B2D3C;margin:0 0 16px;">Your party is booked — we can't wait to celebrate with you!</h2>

      <p style="font-size:15px;line-height:1.6;color:#1B2D3C;margin:0 0 16px;">Hi ${booking.name},</p>
      <p style="font-size:15px;line-height:1.6;color:#1B2D3C;margin:0 0 24px;">Thank you for booking your ${SESSION_LABELS[booking.session_type] || booking.session_type} with <strong style="color:#1B2D3C;">${studioName}</strong>. We're so excited to host your special celebration! Here are all the details:</p>

      <div style="background:#DBE7E4;border-radius:12px;padding:24px;margin:0 0 24px;">
        <p style="font-size:14px;line-height:1.8;margin:0;color:#1B2D3C;">
          <strong style="display:inline-block;width:90px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Date</strong> ${formattedDate}<br/>
          <strong style="display:inline-block;width:90px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Time</strong> ${booking.time}<br/>
          <strong style="display:inline-block;width:90px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Studio</strong> ${studioName}<br/>
          <strong style="display:inline-block;width:90px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Guests</strong> ${booking.painters_count}<br/>
          <strong style="display:inline-block;width:90px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Session</strong> ${SESSION_LABELS[booking.session_type] || booking.session_type}
        </p>
      </div>

      ${depositAmount > 0 ? `
      <div style="background:#F0FDF4;border-radius:12px;padding:20px;margin:0 0 24px;border:1px solid #BBF7D0;">
        <p style="font-size:14px;line-height:1.6;margin:0;color:#166534;">
          <strong style="font-size:12px;text-transform:uppercase;letter-spacing:1px;">Deposit Paid</strong><br/>
          <span style="font-size:20px;font-weight:900;color:#166534;">&pound;${depositAmount.toFixed(2)}</span>
        </p>
      </div>
      ` : ''}

      <div style="background:#FEF3C7;border-radius:12px;padding:20px;margin:0 0 24px;border:1px solid #FDE68A;">
        <p style="font-size:14px;line-height:1.6;margin:0;color:#92400E;">
          <strong style="font-size:12px;text-transform:uppercase;letter-spacing:1px;">Final Payment</strong><br/>
          You'll receive another email closer to the date with a link to pay your final balance and confirm your final number of guests. No need to do anything right now!
        </p>
      </div>

      <div style="background:#FFFFFF;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;border:1px solid #D6E2E9;">
        <p style="font-size:14px;color:#1B2D3C;margin:0 0 8px;font-weight:600;">Need to change your guest count, reschedule, or cancel?</p>
        <p style="font-size:12px;color:#1B2D3C;opacity:0.6;margin:0 0 12px;">You can manage your booking anytime using your private link</p>
        <a href="${manageUrl}" style="display:inline-block;padding:12px 32px;background:#DBE7E4;color:#1B2D3C;text-decoration:none;font-weight:700;border-radius:8px;font-size:14px;font-family:'DM Sans','Outfit','Inter',sans-serif;border:1px solid #1B2D3C;">Manage your booking</a>
      </div>

      <p style="font-size:15px;line-height:1.6;color:#1B2D3C;margin:0 0 8px;">We can't wait to celebrate with you and see all the amazing creations!</p>
    </div>

    <div style="text-align:center;margin-top:24px;padding-top:24px;border-top:1px solid #D6E2E9;">
      <p style="font-size:13px;color:#1B2D3C;font-weight:700;margin:0 0 4px;">${studioName}</p>
      <p style="font-size:12px;color:#1B2D3C;opacity:0.6;margin:0 0 2px;line-height:1.5;">${studioInfo.address}</p>
      <p style="font-size:12px;color:#1B2D3C;opacity:0.6;margin:0;">${studioInfo.phone}</p>
    </div>

  </div>
</body>
</html>
        ` : `
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
      <h2 style="font-family:'Montserrat','Outfit','Plus Jakarta Sans','Inter',sans-serif;font-size:22px;font-weight:900;color:#1B2D3C;margin:0 0 16px;">Your booking is confirmed!</h2>

      <p style="font-size:15px;line-height:1.6;color:#1B2D3C;margin:0 0 24px;">Hi ${booking.name},</p>
      <p style="font-size:15px;line-height:1.6;color:#1B2D3C;margin:0 0 24px;">We're looking forward to seeing you at <strong style="color:#1B2D3C;">${studioName}</strong>. Here are your booking details:</p>

      <div style="background:#DBE7E4;border-radius:12px;padding:24px;margin:0 0 24px;">
        <p style="font-size:14px;line-height:1.8;margin:0;color:#1B2D3C;">
          <strong style="display:inline-block;width:80px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Date</strong> ${formattedDate}<br/>
          <strong style="display:inline-block;width:80px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Time</strong> ${booking.time}<br/>
          <strong style="display:inline-block;width:80px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Studio</strong> ${studioName}<br/>
          <strong style="display:inline-block;width:80px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Seats</strong> ${booking.painters_count}<br/>
          <strong style="display:inline-block;width:80px;color:#1B2D3C;opacity:0.6;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Session</strong> ${SESSION_LABELS[booking.session_type] || booking.session_type}
        </p>
      </div>

      <div style="background:#FFFFFF;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;border:1px solid #D6E2E9;">
        <p style="font-size:14px;color:#1B2D3C;margin:0 0 12px;font-weight:600;">Need to reschedule, change guests, or cancel?</p>
        <a href="${manageUrl}" style="display:inline-block;padding:12px 32px;background:#DBE7E4;color:#1B2D3C;text-decoration:none;font-weight:700;border-radius:8px;font-size:14px;font-family:'DM Sans','Outfit','Inter',sans-serif;border:1px solid #1B2D3C;">Manage your booking</a>
      </div>

      <p style="font-size:15px;line-height:1.6;color:#1B2D3C;margin:0 0 8px;">We can't wait to see your creations!</p>
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

  // Check if recipient is suppressed (bounced/complained before)
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (supabaseUrl && supabaseServiceKey) {
    const checkClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: suppressed } = await checkClient.from('email_logs')
      .select('id').eq('recipient', booking.email).eq('suppressed', true).limit(1);
    if (suppressed && suppressed.length > 0) {
      console.log(`Email to ${booking.email} suppressed (bounced/complained previously)`);
      return { success: false, error: 'Recipient is suppressed due to previous bounce/complaint' };
    }
  }

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
          body: html,
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

  const clientIp = getClientIp(req);
  if (isRateLimited(`booking-confirm:${clientIp}`, 20, 60_000)) {
    return rateLimitResponse();
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
