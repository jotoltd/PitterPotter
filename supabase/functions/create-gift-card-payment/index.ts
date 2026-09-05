import Stripe from 'stripe';
import { createClient } from 'supabase';
import { isRateLimited, rateLimitResponse, getClientIp } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(`gift-card-payment:${clientIp}`, 10, 60_000)) {
    return rateLimitResponse();
  }

  try {
    const { amount, recipientName, recipientEmail, senderName, senderEmail, message } = await req.json();

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Read stripe mode from DB
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
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
        recipientName: recipientName || '',
        recipientEmail: recipientEmail || '',
        senderName: senderName || '',
        senderEmail: senderEmail || '',
        message: message || '',
        amount: String(amount),
        type: 'gift_card',
      },
    });

    return new Response(JSON.stringify({
      clientSecret: paymentIntent.client_secret,
      publishableKey: publishableKey || '',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Payment intent error:', err);
    return new Response(JSON.stringify({ error: 'Failed to create payment' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
