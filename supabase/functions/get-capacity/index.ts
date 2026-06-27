import { createClient } from 'npm:@supabase/supabase-js@^2.0.0';

const DEFAULT_MAX_PAINTERS: Record<'Putney' | 'Wimbledon', number> = { Putney: 30, Wimbledon: 50 };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { studio, date, time } = await req.json();
    if (!studio || !date || !time) {
      return new Response(JSON.stringify({ error: 'Missing studio, date or time' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

    const { data, error } = await supabase
      .from('bookings')
      .select('painters_count')
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

    const booked = (data || []).reduce((sum: number, row: { painters_count?: number }) => sum + (row.painters_count || 1), 0);

    const { data: capacity } = await supabase
      .from('capacity')
      .select('max_painters')
      .eq('studio', studio)
      .eq('session_type', 'open')
      .single();

    const max = capacity?.max_painters ?? DEFAULT_MAX_PAINTERS[studio as 'Putney' | 'Wimbledon'] ?? 0;

    return new Response(JSON.stringify({ booked, remaining: max - booked, max }), {
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
