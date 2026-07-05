import { createClient } from 'supabase';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const cronSecret = Deno.env.get('CRON_SECRET');

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    if (body.cronSecret !== cronSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('booking_id, painters_count')
      .in('session_type', ['birthday-party', 'baby-shower-hen', 'corporate'])
      .neq('status', 'cancelled')
      .is('payment_link_sent_at', null)
      .lte('date', new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0])
      .gt('date', new Date().toISOString().split('T')[0]);

    if (error) throw error;

    const results = [];
    for (const booking of bookings || []) {
      const response = await fetch(`${supabaseUrl}/functions/v1/send-party-final-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
        },
        body: JSON.stringify({
          bookingId: booking.booking_id,
          finalSeats: booking.painters_count,
        }),
      });
      const data = await response.json().catch(() => ({ error: 'Failed to parse response' }));
      results.push({ bookingId: booking.booking_id, ok: response.ok, data });
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Process party reminders error:', err);
    return new Response(JSON.stringify({ error: 'Failed to process reminders' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
