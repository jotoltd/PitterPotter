import { createClient } from 'supabase';
import { isObject, isNonEmptyString, isInteger } from '../_shared/validate.ts';
import { isRateLimited, rateLimitResponse, getClientIp } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_STUDIOS = ['Putney', 'Wimbledon'];
const VALID_SESSION_TYPES = ['painting', 'birthday-party', 'baby-shower-hen', 'clay-imprints', 'corporate'];
const VALID_STATUSES = ['pending', 'confirmed', 'cancelled'];

const DEFAULT_MAX_PAINTERS: Record<string, number> = { Putney: 32, Wimbledon: 65 };
const PARTY_SESSION_TYPES = ['birthday-party', 'baby-shower-hen', 'corporate'];

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
    if (!isNonEmptyString(booking.email) || booking.email.length > 320 || !booking.email.includes('@')) {
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

    // Check capacity
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('painters_count, session_type, booking_id')
      .eq('studio', booking.studio)
      .eq('date', booking.date)
      .eq('time', booking.time)
      .in('status', ['pending', 'confirmed']);

    const incomingIsParty = PARTY_SESSION_TYPES.includes(booking.sessionType);
    const rows = existingBookings || [];
    const hasParty = rows.some(r => PARTY_SESSION_TYPES.includes(r.session_type));
    const hasOpen = rows.some(r => !PARTY_SESSION_TYPES.includes(r.session_type));

    if (incomingIsParty && hasOpen) {
      return new Response(JSON.stringify({ error: 'This time slot already has open painting sessions booked. Party bookings cannot be mixed with open sessions.' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!incomingIsParty && hasParty) {
      return new Response(JSON.stringify({ error: 'This time slot already has a party booked. Please choose a different time.' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check capacity limits
    const { data: capacityRow } = await supabase
      .from('capacity')
      .select('max_painters')
      .eq('studio', booking.studio)
      .eq('session_type', incomingIsParty ? 'party' : 'painting')
      .maybeSingle();

    const maxPainters = capacityRow?.max_painters ?? DEFAULT_MAX_PAINTERS[booking.studio as string] ?? 32;
    const currentPainters = rows.reduce((sum, r) => sum + (r.painters_count || 0), 0);
    if (currentPainters + booking.paintersCount > maxPainters) {
      const remaining = maxPainters - currentPainters;
      return new Response(JSON.stringify({ error: `Not enough capacity. Only ${remaining} painter spots remaining for this slot.` }), {
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

    // Send confirmation email (non-blocking)
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-booking-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, managementToken }),
      });
    } catch (err) {
      console.error('Failed to send confirmation email:', err);
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
