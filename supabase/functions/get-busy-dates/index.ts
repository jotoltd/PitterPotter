import { createClient } from 'supabase';
import { isObject, isNonEmptyString, isInteger } from '../_shared/validate.ts';
import { isRateLimited, rateLimitResponse, getClientIp } from '../_shared/rate-limit.ts';

const DEFAULT_MAX_PAINTERS: Record<'Putney' | 'Wimbledon', number> = { Putney: 30, Wimbledon: 50 };
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
      .select('date, time, painters_count')
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

    const { data: capacity } = await supabase
      .from('capacity')
      .select('max_painters')
      .eq('studio', studio)
      .eq('session_type', 'open')
      .single();

    const max = capacity?.max_painters ?? DEFAULT_MAX_PAINTERS[studio as 'Putney' | 'Wimbledon'] ?? 0;
    const dateMap: Record<string, Record<string, number>> = {};
    interface BookingRow {
      date: string;
      time: string;
      painters_count: number;
    }
    (data || [] as BookingRow[]).forEach((row) => {
      if (!dateMap[row.date]) dateMap[row.date] = {};
      dateMap[row.date][row.time] = (dateMap[row.date][row.time] || 0) + (row.painters_count || 1);
    });

    const busyDates = Object.entries(dateMap)
      .filter(([_, slots]: [string, Record<string, number>]) => SLOTS.every((slot) => (slots[slot] || 0) >= max))
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
