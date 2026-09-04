import { createClient } from 'supabase';
import { isObject, isNonEmptyString } from '../_shared/validate.ts';
import { isRateLimited, rateLimitResponse, getClientIp } from '../_shared/rate-limit.ts';
import { computeCapacity, StudioName } from '../_shared/capacity.ts';

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
  deposit_amount: number | null;
  final_seats: number | null;
  final_balance: number | null;
  final_price: number | null;
  estimated_price: number | null;
  payment_status: string | null;
  collection_status: string | null;
  photos: string[] | null;
  collected_at: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(`manage-booking:${clientIp}`, 20, 60_000)) {
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
          depositAmount: booking.deposit_amount ? Number(booking.deposit_amount) : null,
          finalSeats: booking.final_seats ? Number(booking.final_seats) : null,
          finalBalance: booking.final_balance ? Number(booking.final_balance) : null,
          finalPrice: booking.final_price ? Number(booking.final_price) : null,
          estimatedPrice: booking.estimated_price ? Number(booking.estimated_price) : null,
          paymentStatus: booking.payment_status || null,
          collectionStatus: booking.collection_status || null,
          photos: booking.photos || null,
          collectedAt: booking.collected_at || null,
          managementToken: booking.management_token || null,
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

      // Check capacity at new slot (independent front/back pools, excluding this booking's own seats)
      const capacity = await computeCapacity(
        supabase,
        booking.studio as StudioName,
        newDate,
        newTime,
        booking.session_type,
        booking.booking_id,
      );

      if (capacity.conflict === 'party_session_exists') {
        return new Response(JSON.stringify({ error: 'This time slot already has a party booked. Please choose a different time.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (capacity.remaining < booking.painters_count) {
        return new Response(JSON.stringify({ error: `Not enough capacity at the selected time. Only ${Math.max(0, capacity.remaining)} spots remaining.` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (capacity.remainingBookings <= 0) {
        return new Response(JSON.stringify({ error: `Maximum number of bookings (${capacity.maxBookings}) reached for this time slot.` }), {
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

    if (action === 'changeGuests') {
      const { newGuests } = body;
      const guestCount = Number(newGuests);
      if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 50) {
        return new Response(JSON.stringify({ error: 'Number of guests must be between 1 and 50' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check capacity at current slot (excluding this booking's own seats)
      const capacity = await computeCapacity(
        supabase,
        booking.studio as StudioName,
        booking.date,
        booking.time,
        booking.session_type,
        booking.booking_id,
      );

      if (capacity.remaining + booking.painters_count < guestCount) {
        const available = Math.max(0, capacity.remaining + booking.painters_count);
        return new Response(JSON.stringify({ error: `Not enough capacity for ${guestCount} guests. Maximum available: ${available}.` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ painters_count: guestCount })
        .eq('booking_id', booking.booking_id);

      if (updateError) {
        console.error('Change guests error:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update number of guests' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Number of guests updated successfully' }), {
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
