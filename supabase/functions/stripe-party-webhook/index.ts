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
        // Create the booking now that deposit is paid — booking does not exist in DB until this point
        const bookingId = metadata.bookingId;
        const depositAmount = Number(metadata.amount) || 50;
        if (bookingId) {
          // Check if booking already exists (idempotent — confirm-party-payment may have created it)
          const { data: existing } = await supabase
            .from('bookings')
            .select('booking_id')
            .eq('stripe_payment_intent_id', obj.id)
            .maybeSingle();

          if (!existing) {
            const managementToken = crypto.randomUUID();

            const { error: insertError } = await supabase.from('bookings').insert({
              booking_id: bookingId,
              studio: metadata.studio,
              name: metadata.name,
              email: metadata.email || null,
              phone: metadata.phone,
              date: metadata.date,
              time: metadata.time,
              painters_count: Number(metadata.paintersCount) || 1,
              session_type: metadata.sessionType,
              notes: metadata.notes || null,
              status: 'confirmed',
              request_date: metadata.requestDate || new Date().toISOString().split('T')[0],
              source: metadata.source || 'online',
              deposit_amount: depositAmount,
              final_seats: Number(metadata.finalSeats) || null,
              final_balance: Number(metadata.finalBalance) || null,
              payment_status: 'paid',
              stripe_payment_intent_id: obj.id,
              management_token: managementToken,
            });

            if (insertError) {
              if (insertError.code === '23505') {
                console.log('Booking already exists for paymentIntent:', obj.id);
              } else {
                throw insertError;
              }
            } else {
              // Send confirmation email
              try {
                await fetch(`${supabaseUrl}/functions/v1/send-booking-confirmation`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ bookingId, managementToken }),
                });
              } catch (emailErr) {
                console.error('Failed to send confirmation email after deposit:', emailErr);
              }
            }
          }
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
            sender_email: metadata.senderEmail || '',
            message: metadata.message || '',
            status: 'active',
            purchase_date: purchaseDate,
            expiry_date: expiryDate.toISOString(),
            stripe_session_id: paymentIntentId,
          });
          if (insertError) {
            // Race condition: confirm-gift-card-payment may have already created the card
            if (insertError.code === '23505') {
              console.log('Gift card already exists for paymentIntent:', paymentIntentId);
            } else {
              throw insertError;
            }
          }

          // Send gift card emails (recipient gets voucher PDF, sender gets confirmation)
          try {
            const { data: giftCard } = await supabase.from('gift_cards').select('id').eq('stripe_session_id', paymentIntentId).single();
            if (giftCard) {
              await fetch(`${supabaseUrl}/functions/v1/send-gift-card-email`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                },
                body: JSON.stringify({ giftCardId: giftCard.id }),
              });
            }
          } catch (emailErr) {
            console.error('Failed to send gift card email:', emailErr);
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    return new Response(JSON.stringify({ error: 'Webhook verification failed' }), { status: 400 });
  }
});
