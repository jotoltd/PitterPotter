import { createClient } from 'supabase';
import { isObject, isNonEmptyString } from '../_shared/validate.ts';
import type { StaffRecord } from '../_shared/types.ts';

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
}

interface BookingDetails {
  bookingId: string;
  name: string;
  email: string;
  studio: string;
  date: string;
  time: string;
  paintersCount: number;
  sessionType: string;
}

async function sendEmail(details: BookingDetails): Promise<{ success: boolean; error?: string }> {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'bookings@pitterpotter.com';
  if (!resendKey) {
    console.warn('RESEND_API_KEY not set; skipping confirmation email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: details.email,
        subject: `Booking confirmed — ${details.studio} on ${details.date}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1B2D3C;">
            <h2 style="color: #1B2D3C;">Your booking is confirmed</h2>
            <p>Hi ${details.name},</p>
            <p>Your booking at <strong>${details.studio}</strong> has been confirmed.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Reference</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">${details.bookingId}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Date</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">${details.date}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Time</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">${details.time}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Studio</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">${details.studio}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Painters</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">${details.paintersCount}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Session</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">${details.sessionType}</td></tr>
            </table>
            <p>We look forward to seeing you in the studio!</p>
            <p>Pitter Potter</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Resend error:', errorData);
      return { success: false, error: errorData.message || 'Failed to send email' };
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
    const { username, sessionToken, bookingId } = body;

    if (!isNonEmptyString(username) || !isNonEmptyString(sessionToken) || !isNonEmptyString(bookingId)) {
      return new Response(JSON.stringify({ error: 'Missing username, sessionToken, or bookingId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const staff = await supabase
      .from('staff')
      .select('*')
      .eq('username', username)
      .eq('session_token', sessionToken)
      .gt('session_expires_at', new Date().toISOString())
      .single() as { data: StaffRecord | null; error: Error | null };

    if (!staff.data) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
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

    const result = await sendEmail({
      bookingId: booking.booking_id,
      name: booking.name,
      email: booking.email,
      studio: booking.studio,
      date: booking.date,
      time: booking.time,
      paintersCount: booking.painters_count,
      sessionType: booking.session_type,
    });

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
