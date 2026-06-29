import { createClient } from 'supabase';
import { isObject, isNonEmptyString, isInteger } from '../_shared/validate.ts';
import { isRateLimited, rateLimitResponse, getClientIp } from '../_shared/rate-limit.ts';

const PARTY_SESSION_TYPES = ['birthday-party', 'baby-shower-hen', 'corporate'];

const DEFAULT_OPEN_CAPACITY: Record<'Putney' | 'Wimbledon', number> = { Putney: 32, Wimbledon: 65 };
const DEFAULT_PARTY_CAPACITY: Record<'Putney' | 'Wimbledon', number> = { Putney: 20, Wimbledon: 40 };
const SLOTS = ['10:00', '12:00', '14:00', '16:00'];

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
      .in('session_type', ['open', 'party']);

    const openRow = (capacityRows || []).find((r: { session_type: string }) => r.session_type === 'open');
    const partyRow = (capacityRows || []).find((r: { session_type: string }) => r.session_type === 'party');

    const openMax = openRow?.max_painters ?? DEFAULT_OPEN_CAPACITY[studioKey];
    const partyMax = partyRow?.max_painters ?? DEFAULT_PARTY_CAPACITY[studioKey];

    interface BookingRow {
      date: string;
      time: string;
      painters_count: number;
      session_type: string;
    }

    const dateSlotBookings: Record<string, Record<string, BookingRow[]>> = {};
    (data || [] as BookingRow[]).forEach((row) => {
      if (!dateSlotBookings[row.date]) dateSlotBookings[row.date] = {};
      if (!dateSlotBookings[row.date][row.time]) dateSlotBookings[row.date][row.time] = [];
      dateSlotBookings[row.date][row.time].push(row);
    });

    const busyDates = Object.entries(dateSlotBookings)
      .filter(([_, slotMap]) =>
        SLOTS.every((slot) => {
          const slotRows = slotMap[slot] || [];
          const hasParty = slotRows.some((r) => PARTY_SESSION_TYPES.includes(r.session_type ?? ''));
          const max = hasParty ? partyMax : openMax;
          const booked = slotRows.reduce((sum, r) => sum + (r.painters_count || 1), 0);
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
