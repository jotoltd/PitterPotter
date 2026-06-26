import Stripe from 'npm:stripe@^17.0.0';
import { createClient } from 'npm:@supabase/supabase-js@^2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'PP-';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { paymentIntentId } = await req.json();
    if (!paymentIntentId) {
      return new Response(JSON.stringify({ error: 'Missing payment intent id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if gift card already created for this payment
    const { data: existing } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('stripe_session_id', paymentIntentId)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({
        code: existing.code,
        amount: existing.amount,
        balance: existing.balance,
        status: existing.status,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get stripe mode and verify payment
    const { data: settings } = await supabase.from('settings').select('value').eq('key', 'stripe_mode').single();
    const isLive = settings?.value === 'live';

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
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return new Response(JSON.stringify({ error: 'Payment not completed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const metadata = paymentIntent.metadata || {};
    const amount = Number(metadata.amount) || (paymentIntent.amount / 100);
    const code = generateCode();
    const purchaseDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const { data: giftCard, error } = await supabase.from('gift_cards').insert({
      code,
      amount,
      balance: amount,
      recipient_name: metadata.recipientName || '',
      recipient_email: metadata.recipientEmail || '',
      sender_name: metadata.senderName || '',
      message: metadata.message || '',
      status: 'active',
      purchase_date: purchaseDate,
      expiry_date: expiryDate.toISOString(),
      stripe_session_id: paymentIntentId,
    }).select().single();

    if (error) {
      console.error('Gift card insert error:', error);
      return new Response(JSON.stringify({ error: 'Failed to create gift card' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      code: giftCard.code,
      amount: giftCard.amount,
      balance: giftCard.balance,
      status: giftCard.status,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Confirm error:', err);
    return new Response(JSON.stringify({ error: 'Failed to confirm payment' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
