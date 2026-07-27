import { createClient } from 'supabase';
import { isObject, isNonEmptyString, isOneOf } from '../_shared/validate.ts';
import { loadEmailTemplate, renderTemplate } from '../_shared/email-template.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingNotification {
  bookingId: string;
  name: string;
  email: string;
  phone: string;
  studio: 'Putney' | 'Wimbledon';
  date: string;
  time: string;
  paintersCount: number;
  sessionType: string;
  notes?: string;
}

async function sendAdminEmail(details: BookingNotification, adminEmail: string): Promise<{ success: boolean; error?: string }> {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'bookings@pitterpotter.co.uk';

  if (!resendKey) {
    console.warn('RESEND_API_KEY not set; skipping admin notification email');
    return { success: false, error: 'Email service not configured' };
  }

  const subject = `New booking request — ${details.studio} on ${details.date} (${details.bookingId})`;

  const templateVars: Record<string, string | number | undefined> = {
    bookingId: details.bookingId,
    name: details.name,
    email: details.email,
    phone: details.phone,
    studio: details.studio,
    date: details.date,
    time: details.time,
    paintersCount: details.paintersCount,
    sessionType: details.sessionType,
    notes: details.notes || '',
  };

  const tpl = await loadEmailTemplate('admin_booking_notification');
  const fallbackHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1B2D3C;">
            <h2 style="color: #1B2D3C;">New Booking Request — ${details.studio}</h2>
            <p>A new booking request has been submitted for the <strong>${details.studio}</strong> studio.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Reference</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">${details.bookingId}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Customer Name</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">${details.name}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;"><a href="mailto:${details.email}">${details.email}</a></td></tr>
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Phone</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">${details.phone}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Date</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">${details.date}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Time</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">${details.time}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Painters</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">${details.paintersCount}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Session</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">${details.sessionType}</td></tr>
              ${details.notes ? `<tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Notes</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">${details.notes}</td></tr>` : ''}
            </table>
            <p style="color: #666; font-size: 12px;">Log in to the Pitter Potter admin dashboard to confirm or manage this booking.</p>
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
        to: adminEmail,
        subject: finalSubject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Resend admin notify error:', errorData);
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
          email_type: 'admin_booking_notification',
          recipient: adminEmail,
          subject: finalSubject,
          resend_id: resendData.id || null,
          status: 'sent',
          booking_id: details.bookingId,
        });
      }
    } catch (logErr) {
      console.error('Failed to log email:', logErr);
    }

    return { success: true };
  } catch (err) {
    console.error('Admin notify email error:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    if (!isObject(body)) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { bookingId, name, email, phone, studio, date, time, paintersCount, sessionType, notes } = body;

    if (
      !isNonEmptyString(bookingId) ||
      !isNonEmptyString(name) ||
      !isNonEmptyString(email) ||
      !isNonEmptyString(phone) ||
      !isOneOf(studio, ['Putney', 'Wimbledon'] as const) ||
      !isNonEmptyString(date) ||
      !isNonEmptyString(time) ||
      !isNonEmptyString(sessionType)
    ) {
      return new Response(JSON.stringify({ error: 'Missing or invalid required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const putneyEmail = Deno.env.get('PUTNEY_ADMIN_EMAIL');
    const wimbledonEmail = Deno.env.get('WIMBLEDON_ADMIN_EMAIL');

    const adminEmail = studio === 'Putney' ? putneyEmail : wimbledonEmail;

    if (!adminEmail) {
      console.warn(`No admin email configured for ${studio} studio`);
      return new Response(JSON.stringify({ success: false, error: `No admin email configured for ${studio}` }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await sendAdminEmail(
      {
        bookingId: bookingId as string,
        name: name as string,
        email: email as string,
        phone: phone as string,
        studio: studio as 'Putney' | 'Wimbledon',
        date: date as string,
        time: time as string,
        paintersCount: typeof paintersCount === 'number' ? paintersCount : Number(paintersCount),
        sessionType: sessionType as string,
        notes: isNonEmptyString(notes) ? notes as string : undefined,
      },
      adminEmail,
    );

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Notify admin booking error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
