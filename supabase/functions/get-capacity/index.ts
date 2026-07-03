import { createClient } from 'supabase';
import { isObject, isNonEmptyString } from '../_shared/validate.ts';
import { isRateLimited, rateLimitResponse, getClientIp } from '../_shared/rate-limit.ts';

const PARTY_SESSION_TYPES = ['birthday-party', 'baby-shower-hen', 'corporate'];

const DEFAULT_OPEN_CAPACITY: Record<'Putney' | 'Wimbledon', number> = { Putney: 32, Wimbledon: 65 };
const DEFAULT_PARTY_CAPACITY: Record<'Putney' | 'Wimbledon', number> = { Putney: 20, Wimbledon: 40 };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(`capacity:${clientIp}`, 30, 60_000)) {
    return rateLimitResponse();
  }

  try {
    const body = await req.json();
    if (!isObject(body) || !isNonEmptyString(body.studio) || !isNonEmptyString(body.date) || !isNonEmptyString(body.time)) {
      return new Response(JSON.stringify({ error: 'Missing studio, date or time' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { studio, date, time, sessionType } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('bookings')
      .select('painters_count, session_type')
      .eq('studio', studio)
      .eq('date', date)
      .eq('time', time)
      .in('status', ['pending', 'confirmed']);

    if (error) {
      console.error('Capacity query error:', error);
      return new Response(JSON.stringify({ error: 'Failed to get capacity' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rows = data || [];
    const incomingIsParty = sessionType ? PARTY_SESSION_TYPES.includes(sessionType) : false;
    const hasPartyBooking = rows.some((r: { session_type?: string }) => PARTY_SESSION_TYPES.includes(r.session_type ?? ''));
    const hasOpenBooking = rows.some((r: { session_type?: string }) => !PARTY_SESSION_TYPES.includes(r.session_type ?? ''));

    // Prevent mixing party and open session types at the same time slot
    if (incomingIsParty && hasOpenBooking) {
      return new Response(JSON.stringify({ booked: 0, remaining: 0, max: 0, hasPartyBooking: true, conflict: 'open_session_exists' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!incomingIsParty && sessionType && hasPartyBooking) {
      return new Response(JSON.stringify({ booked: 0, remaining: 0, max: 0, hasPartyBooking: true, conflict: 'party_session_exists' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const booked = rows.reduce((sum: number, row: { painters_count?: number }) => sum + (row.painters_count || 1), 0);

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

    // Use party max if incoming booking is a party OR if existing bookings are parties
    const isPartySlot = incomingIsParty || hasPartyBooking;
    const max = isPartySlot ? partyMax : openMax;

    return new Response(JSON.stringify({ booked, remaining: max - booked, max, hasPartyBooking: isPartySlot }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Get capacity error:', err);
    return new Response(JSON.stringify({ error: 'Failed to get capacity' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
