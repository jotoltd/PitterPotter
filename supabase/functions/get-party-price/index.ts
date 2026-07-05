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
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ price: 28.95 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  try {
    const { data } = await supabase.from('settings').select('value').eq('key', 'party_price_per_person').single();
    const price = data?.value ? Number(data.value) : 28.95;
    return new Response(JSON.stringify({ price }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Get party price error:', err);
    return new Response(JSON.stringify({ price: 28.95 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
