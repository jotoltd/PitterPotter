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
  const manageUrl = `${Deno.env.get('SITE_URL') || 'https://pitterpotter.co.uk'}/manage-booking?token=${managementToken}`;

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
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1B2D3C;">
            <h2 style="color: #1B2D3C;">Your booking is confirmed</h2>
            <p>Hi ${booking.name},</p>
            <p>Your booking at <strong>${booking.studio}</strong> has been confirmed.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Date</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">${booking.date}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Time</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">${booking.time}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Studio</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">${booking.studio}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Painters</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">${booking.painters_count}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Session</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">${booking.session_type}</td></tr>
            </table>
            <div style="margin: 24px 0; padding: 16px; background: #FFF1E6; border-radius: 8px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #1B2D3C;">Need to reschedule or cancel?</p>
              <a href="${manageUrl}" style="display: inline-block; padding: 10px 24px; background: #1B2D3C; color: #fff; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 14px;">Manage your booking</a>
            </div>
            <p>We look forward to seeing you in the studio!</p>
            <p style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #DBE7E4; font-size: 12px; color: #666;">
              <strong>${booking.studio} Studio</strong><br/>
              ${studioInfo.address}<br/>
              ${studioInfo.phone}
            </p>
            <p>Pitter Potter</p>
          </div>
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
        from: fromEmail,
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
