import { createClient } from 'supabase';
import { getStudioInfo } from '../_shared/studio-info.ts';
import { loadSMSTemplate, renderTemplate } from '../_shared/sms-template.ts';

const PARTY_TYPES = ['birthday-party', 'baby-shower-hen', 'corporate'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Allow manual trigger with daysBefore param, default to 2 days
  let daysBefore = 2;
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body.daysBefore === 'number') daysBefore = body.daysBefore;
  } catch { /* ignore */ }

  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  if (!accountSid || !authToken) {
    return new Response(JSON.stringify({ error: 'Twilio not configured' }), { status: 500 });
  }

  // Calculate target date (X days from now)
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysBefore);
  const targetDateStr = targetDate.toISOString().split('T')[0];

  // Find confirmed party bookings on the target date
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .in('session_type', PARTY_TYPES)
    .eq('status', 'confirmed')
    .eq('date', targetDateStr);

  if (error) {
    console.error('Failed to fetch bookings:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch bookings' }), { status: 500 });
  }

  if (!bookings || bookings.length === 0) {
    return new Response(JSON.stringify({ success: true, message: 'No party bookings found for ' + targetDateStr, sent: 0 }));
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const booking of bookings) {
    const phone = booking.phone;
    if (!phone) { skipped++; continue; }

    // Check SMS opt-out
    const { data: optOut } = await supabase.from('sms_opt_outs')
      .select('phone').eq('phone', phone).is('opted_in_at', null).limit(1);
    if (optOut && optOut.length > 0) {
      console.log(`SMS to ${phone} skipped (opted out)`);
      skipped++;
      continue;
    }

    // Check if we already sent a reminder for this booking
    const { data: existing } = await supabase.from('email_logs')
      .select('id')
      .eq('booking_id', booking.booking_id)
      .eq('email_type', 'party_reminder_sms')
      .limit(1);
    if (existing && existing.length > 0) {
      skipped++;
      continue;
    }

    const studioName = `Pitter Potter ${booking.studio}`;
    const studioInfo = getStudioInfo(booking.studio);

    // Format date nicely
    const parts = (booking.date || '').split('-');
    const formattedDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : booking.date;

    const templateVars: Record<string, string | number | undefined> = {
      name: booking.name,
      studio: studioName,
      studioAddress: studioInfo.address,
      studioPhone: studioInfo.phone,
      date: formattedDate,
      time: booking.time || '',
      bookingId: booking.booking_id,
    };

    const tpl = await loadSMSTemplate('party_reminder');
    let message: string;
    if (tpl) {
      message = renderTemplate(tpl.body, templateVars).replace(/\\n/g, '\n');
    } else {
      message = `Hi ${booking.name}, reminder: your party at ${studioName} is on ${formattedDate} at ${booking.time || 'your booked time'}. See you soon! Questions? Call ${studioInfo.phone}`;
    }

    let toNumber = phone.trim();
    if (toNumber.startsWith('07')) {
      toNumber = '+44' + toNumber.substring(1);
    } else if (toNumber.startsWith('7') && !toNumber.startsWith('+')) {
      toNumber = '+44' + toNumber;
    } else if (!toNumber.startsWith('+')) {
      toNumber = '+44' + toNumber;
    }

    const senderId = booking.studio.toLowerCase().includes('wimbledon') ? 'PitterPotW' : 'PitterPotP';

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const params = new URLSearchParams();
      params.append('From', senderId);
      params.append('To', toNumber);
      params.append('Body', message);
      const projectUrl = Deno.env.get('SUPABASE_URL');
      if (projectUrl) {
        params.append('StatusCallback', `${projectUrl}/functions/v1/twilio-webhook`);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Twilio error:', errorData);
        failed++;
        continue;
      }

      const data = await response.json();

      // Log to email_logs
      try {
        await supabase.from('email_logs').insert({
          email_type: 'party_reminder_sms',
          recipient: toNumber,
          subject: 'Party reminder SMS',
          body: message,
          resend_id: data.sid || null,
          status: 'sent',
          booking_id: booking.booking_id,
        });
      } catch (logErr) {
        console.error('Failed to log SMS:', logErr);
      }

      sent++;
    } catch (err) {
      console.error('Failed to send reminder SMS:', err);
      failed++;
    }
  }

  return new Response(JSON.stringify({
    success: true,
    targetDate: targetDateStr,
    totalBookings: bookings.length,
    sent,
    skipped,
    failed,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
