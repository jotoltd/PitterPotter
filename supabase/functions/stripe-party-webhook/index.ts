import Stripe from 'stripe';
import { createClient } from 'supabase';

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 400 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 500 });
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: modeSetting } = await supabase.from('settings').select('value').eq('key', 'stripe_mode').single();
  const isLive = modeSetting?.value === 'live';
  const secretKey = isLive ? Deno.env.get('STRIPE_SECRET_KEY_LIVE') : Deno.env.get('STRIPE_SECRET_KEY_SANDBOX');
  const webhookSecret = isLive ? Deno.env.get('STRIPE_WEBHOOK_SECRET_LIVE') : Deno.env.get('STRIPE_WEBHOOK_SECRET_SANDBOX');

  if (!secretKey || !webhookSecret) {
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), { status: 500 });
  }

  const stripe = new Stripe(secretKey);

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
      const session = event.data.object as any;
      const bookingId = session.metadata?.bookingId;
      if (!bookingId) {
        return new Response(JSON.stringify({ received: true, ignored: 'No bookingId' }), { status: 200 });
      }
      const { error: updateError } = await supabase.from('bookings').update({
        payment_status: 'paid',
      }).eq('booking_id', bookingId);
      if (updateError) throw updateError;
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    return new Response(JSON.stringify({ error: 'Webhook verification failed' }), { status: 400 });
  }
});
