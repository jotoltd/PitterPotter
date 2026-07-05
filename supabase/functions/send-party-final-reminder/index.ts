import { createClient } from 'supabase';
import Stripe from 'stripe';
import { isObject, isNonEmptyString, isInteger } from '../_shared/validate.ts';
import type { StaffRecord } from '../_shared/types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PARTY_TYPES = ['birthday-party', 'baby-shower-hen', 'corporate'];

async function verifyStaff(supabase: any, username: string, sessionToken: string): Promise<StaffRecord | null> {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('username', username)
    .eq('session_token', sessionToken)
    .single();
  if (error || !data) return null;
  return data;
}

async function sendReminderEmail(
  details: {
    bookingId: string;
    name: string;
    email: string;
    studio: string;
    date: string;
    time: string;
    finalSeats: number;
    partyPrice: number;
    depositAmount: number;
    finalBalance: number;
    paymentLinkUrl: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'bookings@pitterpotter.com';
  if (!resendKey) {
    console.warn('RESEND_API_KEY not set; skipping reminder email');
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
        subject: `Final payment for your party — ${details.studio} on ${details.date}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1B2D3C;">
            <h2 style="color: #1B2D3C;">Your party is almost here</h2>
            <p>Hi ${details.name},</p>
            <p>Your party at <strong>${details.studio}</strong> is on <strong>${details.date}</strong> at <strong>${details.time}</strong>.</p>
            <p>Please confirm your final number of seats so we can prepare everything for you.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Reference</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">${details.bookingId}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Final seats</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">${details.finalSeats}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Price per person</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">£${details.partyPrice.toFixed(2)}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Total</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">£${(details.finalSeats * details.partyPrice).toFixed(2)}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Deposit paid</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;">−£${details.depositAmount.toFixed(2)}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>Final balance</strong></td><td style="padding: 8px; border: 1px solid #DBE7E4;"><strong>£${details.finalBalance.toFixed(2)}</strong></td></tr>
            </table>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${details.paymentLinkUrl}" style="background: #1B2D3C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Pay final balance</a>
            </p>
            <p>If your numbers have changed, please reply to this email or call us and we will adjust the balance.</p>
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
    console.error('Send reminder email error:', err);
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

    const { username, sessionToken, bookingId, finalSeats } = body;

    if (!isNonEmptyString(bookingId)) {
      return new Response(JSON.stringify({ error: 'Missing bookingId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Staff auth is optional for cron-based calls, required for manual admin calls
    let isAuthorized = false;
    if (isNonEmptyString(username) && isNonEmptyString(sessionToken)) {
      const staff = await verifyStaff(supabase, username, sessionToken);
      if (staff) isAuthorized = true;
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

    if (!PARTY_TYPES.includes(booking.session_type)) {
      return new Response(JSON.stringify({ error: 'Not a party booking' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isAuthorized && booking.payment_status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: priceSetting } = await supabase.from('settings').select('value').eq('key', 'party_price_per_person').single();
    const partyPrice = Number(priceSetting?.value) || 28.95;
    const depositAmount = Number(booking.deposit_amount) || 50;
    const resolvedFinalSeats = isInteger(finalSeats) && finalSeats >= 1 ? finalSeats : booking.painters_count;
    const total = resolvedFinalSeats * partyPrice;
    const finalBalance = Math.max(0, total - depositAmount);

    // Read stripe mode from DB
    const { data: setting } = await supabase.from('settings').select('value').eq('key', 'stripe_mode').single();
    const isLive = setting?.value === 'live';
    const secretKey = isLive
      ? Deno.env.get('STRIPE_SECRET_KEY_LIVE')
      : Deno.env.get('STRIPE_SECRET_KEY_SANDBOX');

    if (!secretKey) {
      return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(secretKey);

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price_data: {
        currency: 'gbp',
        product_data: { name: `Party final balance — ${booking.booking_id}` },
        unit_amount: Math.round(finalBalance * 100),
      }, quantity: 1 }],
      metadata: {
        bookingId: booking.booking_id,
        type: 'party_final_balance',
        finalSeats: String(resolvedFinalSeats),
      },
      after_completion: { type: 'redirect', redirect: { url: `${Deno.env.get('SITE_URL') || 'https://pitterpotter.co.uk'}/party-payment-success?booking=${booking.booking_id}` } },
    });

    const emailResult = await sendReminderEmail({
      bookingId: booking.booking_id,
      name: booking.name,
      email: booking.email,
      studio: booking.studio,
      date: booking.date,
      time: booking.time,
      finalSeats: resolvedFinalSeats,
      partyPrice,
      depositAmount,
      finalBalance,
      paymentLinkUrl: paymentLink.url,
    });

    const { error: updateError } = await supabase.from('bookings').update({
      final_seats: resolvedFinalSeats,
      final_balance: finalBalance,
      payment_link_url: paymentLink.url,
      payment_link_sent_at: new Date().toISOString(),
    }).eq('booking_id', bookingId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, email: emailResult, paymentLinkUrl: paymentLink.url, finalBalance }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Send party final reminder error:', err);
    return new Response(JSON.stringify({ error: 'Failed to send reminder' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
