import { createClient } from 'supabase';
import { isObject, isNonEmptyString, isInteger } from '../_shared/validate.ts';
import { isRateLimited, rateLimitResponse, getClientIp } from '../_shared/rate-limit.ts';
import {
  PARTY_SESSION_TYPES,
  DEFAULT_OPEN_CAPACITY,
  DEFAULT_OPEN_RESTRICTED_CAPACITY,
  DEFAULT_PARTY_CAPACITY,
  DEFAULT_MAX_CONCURRENT_PARTIES,
} from '../_shared/capacity.ts';

const SLOTS = ['10:00', '12:00', '14:00', '16:00'];

function parseTimeToMinutes(time: string): number {
  const start = time.split('-')[0].trim();
  const [h, m] = start.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function overlapsTwoHours(timeA: string, timeB: string): boolean {
  return Math.abs(parseTimeToMinutes(timeA) - parseTimeToMinutes(timeB)) < 120;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(`busy-dates:${clientIp}`, 30, 60_000)) {
    return rateLimitResponse();
  }

  try {
    const body = await req.json();
    if (!isObject(body) || !isNonEmptyString(body.studio) || !isInteger(body.year) || !isInteger(body.month)) {
      return new Response(JSON.stringify({ error: 'Missing studio, year or month' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { studio, year, month } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const end = `${year}-${String(month + 2).padStart(2, '0')}-01`;

    const { data, error } = await supabase
      .from('bookings')
      .select('date, time, painters_count, session_type')
      .eq('studio', studio)
      .gte('date', start)
      .lt('date', end)
      .in('status', ['pending', 'confirmed']);

    if (error) {
      console.error('Busy dates query error:', error);
      return new Response(JSON.stringify({ error: 'Failed to get busy dates' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const studioKey = studio as 'Putney' | 'Wimbledon';

    const { data: capacityRows } = await supabase
      .from('capacity')
      .select('session_type, max_painters')
      .eq('studio', studio)
      .in('session_type', ['open', 'open_restricted', 'party']);

    const openRow = (capacityRows || []).find((r: { session_type: string }) => r.session_type === 'open');
    const openRestrictedRow = (capacityRows || []).find((r: { session_type: string }) => r.session_type === 'open_restricted');
    const partyRow = (capacityRows || []).find((r: { session_type: string }) => r.session_type === 'party');

    const openMax = openRow?.max_painters ?? DEFAULT_OPEN_CAPACITY[studioKey];
    const openRestrictedMax = openRestrictedRow?.max_painters ?? DEFAULT_OPEN_RESTRICTED_CAPACITY[studioKey];
    const partyMax = partyRow?.max_painters ?? DEFAULT_PARTY_CAPACITY[studioKey];
    const maxConcurrentParties = DEFAULT_MAX_CONCURRENT_PARTIES[studioKey];

    interface BookingRow {
      date: string;
      time: string;
      painters_count: number;
      session_type: string;
    }

    const dateSlotBookings: Record<string, BookingRow[]> = {};
    (data || [] as BookingRow[]).forEach((row) => {
      if (!dateSlotBookings[row.date]) dateSlotBookings[row.date] = [];
      dateSlotBookings[row.date].push(row);
    });

    const busyDates = Object.entries(dateSlotBookings)
      .filter(([_, allRows]) =>
        SLOTS.every((slot) => {
          // Find all bookings that overlap this slot's 2-hour window
          const slotRows = allRows.filter((r) => r.time && overlapsTwoHours(r.time, slot));
          if (slotRows.length === 0) return false;

          const partyRows = slotRows.filter((r) => PARTY_SESSION_TYPES.includes(r.session_type ?? ''));
          const openRows = slotRows.filter((r) => !PARTY_SESSION_TYPES.includes(r.session_type ?? ''));
          const hasParty = partyRows.length > 0;

          // If party spaces are fully used, slot is busy for parties
          if (partyRows.length >= maxConcurrentParties) {
            const partyBooked = partyRows.reduce((sum, r) => sum + (r.painters_count || 1), 0);
            if (partyBooked >= partyMax) return true;
          }

          // For open bookings, use restricted capacity if a party is present
          const max = hasParty ? openRestrictedMax : openMax;
          const booked = openRows.reduce((sum, r) => sum + (r.painters_count || 1), 0);
          return booked >= max;
        })
      )
      .map(([date]) => date);

    return new Response(JSON.stringify({ busyDates }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Get busy dates error:', err);
    return new Response(JSON.stringify({ error: 'Failed to get busy dates' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
