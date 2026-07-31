import { createClient } from 'supabase';
import { isObject, isNonEmptyString } from '../_shared/validate.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingRow {
  booking_id: string;
  name: string;
  email: string;
  phone: string;
  studio: string;
  date: string;
  time: string;
  painters_count: number;
  session_type: string;
  status: string;
  notes: string | null;
  management_token: string | null;
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

    const { action, token } = body;

    if (!isNonEmptyString(token)) {
      return new Response(JSON.stringify({ error: 'Missing token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Look up booking by management token
    const { data: booking, error: lookupError } = await supabase
      .from('bookings')
      .select('*')
      .eq('management_token', token)
      .single() as { data: BookingRow | null; error: Error | null };

    if (lookupError || !booking) {
      return new Response(JSON.stringify({ error: 'Invalid or expired link' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Don't allow managing cancelled bookings
    if (booking.status === 'cancelled' && action !== 'view') {
      return new Response(JSON.stringify({ error: 'This booking has been cancelled and can no longer be modified.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'view') {
      // Return booking details
      return new Response(JSON.stringify({
        booking: {
          bookingId: booking.booking_id,
          name: booking.name,
          email: booking.email,
          phone: booking.phone,
          studio: booking.studio,
          date: booking.date,
          time: booking.time,
          paintersCount: booking.painters_count,
          sessionType: booking.session_type,
          status: booking.status,
          notes: booking.notes,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'reschedule') {
      const { newDate, newTime } = body;
      if (!isNonEmptyString(newDate) || !isNonEmptyString(newTime)) {
        return new Response(JSON.stringify({ error: 'Missing newDate or newTime' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Reject past dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const requestedDate = new Date(newDate + 'T00:00:00');
      if (requestedDate < today) {
        return new Response(JSON.stringify({ error: 'Cannot reschedule to a past date. Please select a future date.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Reject same-day bookings less than 1 hour before the slot
      const slotTime = newTime.split('-')[0].trim();
      const [slotHour, slotMin] = slotTime.split(':').map(Number);
      const slotDateTime = new Date(newDate + 'T00:00:00');
      slotDateTime.setHours(slotHour || 0, slotMin || 0, 0, 0);
      const oneHourAhead = new Date(Date.now() + 60 * 60 * 1000);
      if (slotDateTime < oneHourAhead) {
        return new Response(JSON.stringify({ error: 'Bookings must be made at least 1 hour before the session start time. Please choose a later time.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check capacity at new slot (query existing bookings, excluding this booking's own seats)
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('painters_count, session_type, booking_id')
        .eq('studio', booking.studio)
        .eq('date', newDate)
        .eq('time', newTime)
        .in('status', ['pending', 'confirmed']);

      const PARTY_SESSION_TYPES = ['birthday-party', 'baby-shower-hen', 'corporate'];
      const rows = existingBookings || [];
      const incomingIsParty = PARTY_SESSION_TYPES.includes(booking.session_type);
      const hasPartyBooking = rows.some((r: { session_type?: string; booking_id?: string }) =>
        PARTY_SESSION_TYPES.includes(r.session_type ?? '') && r.booking_id !== booking.booking_id
      );
      const hasOpenBooking = rows.some((r: { session_type?: string; booking_id?: string }) =>
        !PARTY_SESSION_TYPES.includes(r.session_type ?? '') && r.booking_id !== booking.booking_id
      );

      if (incomingIsParty && hasOpenBooking) {
        return new Response(JSON.stringify({ error: 'This time slot has open painting sessions and cannot accommodate a party booking.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!incomingIsParty && hasPartyBooking) {
        return new Response(JSON.stringify({ error: 'This time slot already has a party booked. Please choose a different time.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (incomingIsParty && hasPartyBooking) {
        return new Response(JSON.stringify({ error: 'This time slot already has a party booked. Please choose a different time.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const bookedByOthers = rows
        .filter((r: { booking_id?: string }) => r.booking_id !== booking.booking_id)
        .reduce((sum: number, r: { painters_count?: number }) => sum + (r.painters_count || 1), 0);

      const DEFAULT_OPEN_CAPACITY: Record<string, number> = { Putney: 32, Wimbledon: 65 };
      const DEFAULT_PARTY_CAPACITY: Record<string, number> = { Putney: 20, Wimbledon: 40 };
      const isPartySlot = incomingIsParty || hasPartyBooking;
      const max = isPartySlot
        ? DEFAULT_PARTY_CAPACITY[booking.studio] ?? 20
        : DEFAULT_OPEN_CAPACITY[booking.studio] ?? 32;

      const remaining = max - bookedByOthers;
      if (remaining < booking.painters_count) {
        return new Response(JSON.stringify({ error: `Not enough capacity at the selected time. Only ${remaining} spots remaining.` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ date: newDate, time: newTime })
        .eq('booking_id', booking.booking_id);

      if (updateError) {
        console.error('Reschedule error:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to reschedule booking' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Booking rescheduled successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'cancel') {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('booking_id', booking.booking_id);

      if (updateError) {
        console.error('Cancel error:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to cancel booking' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Booking cancelled successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Manage booking error:', err);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
