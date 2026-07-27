import Stripe from 'stripe';
import { createClient } from 'supabase';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'PP-';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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
      const obj = event.data.object as any;
      const metadata = obj.metadata || {};
      const type = metadata.type;

      if (type === 'party_deposit') {
        // Update party booking payment status
        const bookingId = metadata.bookingId;
        if (bookingId) {
          const { error: updateError } = await supabase.from('bookings').update({
            payment_status: 'paid',
          }).eq('booking_id', bookingId);
          if (updateError) throw updateError;
        }
      } else if (type === 'party_final_balance') {
        // Final balance paid — update booking with final seats and mark as paid
        const bookingId = metadata.bookingId;
        if (bookingId) {
          const updateData: any = {
            payment_status: 'paid',
          };
          if (metadata.finalSeats) {
            updateData.final_seats = Number(metadata.finalSeats);
          }
          if (metadata.finalBalance) {
            updateData.final_balance = Number(metadata.finalBalance);
          }
          const { error: updateError } = await supabase.from('bookings').update(updateData).eq('booking_id', bookingId);
          if (updateError) throw updateError;
        }
      } else if (type === 'gift_card') {
        // Create gift card if not already created (idempotent)
        const paymentIntentId = obj.id;
        const { data: existing } = await supabase
          .from('gift_cards')
          .select('id')
          .eq('stripe_session_id', paymentIntentId)
          .maybeSingle();

        if (!existing) {
          const amount = Number(metadata.amount) || (obj.amount / 100);
          const code = generateCode();
          const purchaseDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
          const expiryDate = new Date();
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);

          const { error: insertError } = await supabase.from('gift_cards').insert({
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
          });
          if (insertError) throw insertError;
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    return new Response(JSON.stringify({ error: 'Webhook verification failed' }), { status: 400 });
  }
});
