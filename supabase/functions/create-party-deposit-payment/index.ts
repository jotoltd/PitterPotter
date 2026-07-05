import Stripe from 'stripe';
import { createClient } from 'supabase';
import { isObject, isNonEmptyString } from '../_shared/validate.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { bookingId, amount = 50 } = body;
    if (!isNonEmptyString(bookingId)) {
      return new Response(JSON.stringify({ error: 'Missing bookingId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'gbp',
      automatic_payment_methods: { enabled: true },
      metadata: {
        bookingId,
        type: 'party_deposit',
        amount: String(amount),
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
