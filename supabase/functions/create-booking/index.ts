import { createClient } from 'supabase';
import { isObject, isNonEmptyString, isInteger } from '../_shared/validate.ts';
import { isRateLimited, rateLimitResponse, getClientIp } from '../_shared/rate-limit.ts';
import { computeCapacity, StudioName } from '../_shared/capacity.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_STUDIOS = ['Putney', 'Wimbledon'];
const VALID_SESSION_TYPES = ['painting', 'birthday-party', 'baby-shower-hen', 'clay-imprints', 'corporate'];
const VALID_STATUSES = ['pending', 'confirmed', 'cancelled'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(`create-booking:${clientIp}`, 10, 60_000)) {
    return rateLimitResponse();
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

    const { booking } = body;
    if (!isObject(booking)) {
      return new Response(JSON.stringify({ error: 'Missing booking data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate required fields
    if (!isNonEmptyString(booking.id)) {
      return new Response(JSON.stringify({ error: 'Missing booking ID' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!VALID_STUDIOS.includes(booking.studio)) {
      return new Response(JSON.stringify({ error: 'Invalid studio' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!isNonEmptyString(booking.name) || booking.name.length > 200) {
      return new Response(JSON.stringify({ error: 'Invalid name' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (booking.email && (typeof booking.email !== 'string' || booking.email.length > 320 || !booking.email.includes('@'))) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!isNonEmptyString(booking.phone) || booking.phone.length > 30) {
      return new Response(JSON.stringify({ error: 'Invalid phone' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!isNonEmptyString(booking.date) || !/^\d{4}-\d{2}-\d{2}$/.test(booking.date)) {
      return new Response(JSON.stringify({ error: 'Invalid date format' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!isNonEmptyString(booking.time)) {
      return new Response(JSON.stringify({ error: 'Invalid time' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!isInteger(booking.paintersCount) || booking.paintersCount < 1 || booking.paintersCount > 100) {
      return new Response(JSON.stringify({ error: 'Invalid painters count' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!VALID_SESSION_TYPES.includes(booking.sessionType)) {
      return new Response(JSON.stringify({ error: 'Invalid session type' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const status = booking.status || 'pending';
    if (!VALID_STATUSES.includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check capacity (independent front/back pools; party bookings reduce open capacity to front-tables-only)
    const capacity = await computeCapacity(
      supabase,
      booking.studio as StudioName,
      booking.date,
      booking.time,
      booking.sessionType,
    );

    if (capacity.conflict === 'party_session_exists') {
      return new Response(JSON.stringify({ error: 'This time slot already has a party booked. Please choose a different time.' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (capacity.remaining < booking.paintersCount) {
      return new Response(JSON.stringify({ error: `Not enough capacity. Only ${Math.max(0, capacity.remaining)} spots remaining for this slot.` }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate management token
    const managementToken = crypto.randomUUID();

    // Insert booking
    const bookingRow: Record<string, unknown> = {
      booking_id: booking.id,
      studio: booking.studio,
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      date: booking.date,
      time: booking.time,
      painters_count: booking.paintersCount,
      session_type: booking.sessionType,
      notes: booking.notes || null,
      status,
      request_date: booking.requestDate || new Date().toISOString().split('T')[0],
      estimated_price: booking.estimatedPrice ?? null,
      source: booking.source || 'online',
      gift_card_code: booking.giftCardCode || null,
      gift_card_discount: booking.giftCardDiscount ?? null,
      management_token: managementToken,
    };

    const { error: insertError } = await supabase.from('bookings').insert(bookingRow);
    if (insertError) {
      console.error('Failed to create booking:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create booking' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send confirmation email for non-party bookings only.
    // Party bookings get their confirmation email AFTER the deposit is paid
    // (triggered by stripe-party-webhook) to ensure we don't confirm unpaid parties.
    const isPartyBooking = ['birthday-party', 'baby-shower-hen', 'corporate'].includes(booking.sessionType);
    if (!isPartyBooking) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-booking-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: booking.id, managementToken }),
        });
      } catch (err) {
        console.error('Failed to send confirmation email:', err);
      }
    }

    return new Response(JSON.stringify({ success: true, managementToken }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Create booking error:', err);
    return new Response(JSON.stringify({ error: 'Failed to process booking' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
