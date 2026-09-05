import Stripe from 'stripe';
import { createClient } from 'supabase';
import { isObject, isNonEmptyString, isNumber } from '../_shared/validate.ts';
import { isRateLimited, rateLimitResponse, getClientIp } from '../_shared/rate-limit.ts';
import { computeCapacity, StudioName, PARTY_SESSION_TYPES } from '../_shared/capacity.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(`party-deposit:${clientIp}`, 10, 60_000)) {
    return rateLimitResponse();
  }

  try {
    const body = await req.json();
    if (!isObject(body)) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { bookingId, amount = 50, booking } = body;
    if (!isNonEmptyString(bookingId)) {
      return new Response(JSON.stringify({ error: 'Missing bookingId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!isNumber(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate booking data is present
    if (!isObject(booking)) {
      return new Response(JSON.stringify({ error: 'Missing booking data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Server-side capacity check before taking payment
    if (booking.studio && booking.date && booking.time && booking.sessionType) {
      const capacity = await computeCapacity(
        supabase,
        booking.studio as StudioName,
        booking.date as string,
        booking.time as string,
        booking.sessionType as string,
      );
      if (capacity.conflict === 'party_session_exists') {
        return new Response(JSON.stringify({ error: 'This time slot already has a party booked. Please choose a different time.' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const seats = Number(booking.paintersCount) || 0;
      if (seats > capacity.remaining) {
        return new Response(JSON.stringify({ error: `Not enough capacity. Only ${Math.max(0, capacity.remaining)} spots remaining.` }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const { data: setting } = await supabase.from('settings').select('value').eq('key', 'stripe_mode').single();
    const isLive = setting?.value === 'live';

    const secretKey = isLive
      ? Deno.env.get('STRIPE_SECRET_KEY_LIVE')
      : Deno.env.get('STRIPE_SECRET_KEY_SANDBOX');
    const publishableKey = isLive
      ? Deno.env.get('STRIPE_PUBLISHABLE_KEY_LIVE')
      : Deno.env.get('STRIPE_PUBLISHABLE_KEY_SANDBOX');

    if (!secretKey) {
      return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(secretKey);

    // Store all booking data in Stripe metadata so the webhook/confirm function
    // can create the booking AFTER payment succeeds. No booking exists in DB yet.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'gbp',
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: 'party_deposit',
        amount: String(amount),
        bookingId,
        studio: String(booking.studio || ''),
        name: String(booking.name || '').slice(0, 500),
        email: String(booking.email || ''),
        phone: String(booking.phone || ''),
        date: String(booking.date || ''),
        time: String(booking.time || ''),
        paintersCount: String(booking.paintersCount || 1),
        sessionType: String(booking.sessionType || ''),
        notes: String(booking.notes || '').slice(0, 500),
        depositAmount: String(booking.depositAmount || amount),
        finalSeats: String(booking.finalSeats || booking.paintersCount || 1),
        finalBalance: String(booking.finalBalance || 0),
        source: String(booking.source || 'online'),
        requestDate: String(booking.requestDate || new Date().toISOString()),
      },
    });

    return new Response(JSON.stringify({
      clientSecret: paymentIntent.client_secret,
      publishableKey: publishableKey || '',
      paymentIntentId: paymentIntent.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Party deposit payment error:', err);
    return new Response(JSON.stringify({ error: 'Failed to create payment' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
