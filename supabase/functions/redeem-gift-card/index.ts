import { createClient } from 'npm:@supabase/supabase-js@^2.0.0';

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
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { code, amount } = await req.json();
    if (!code || typeof amount !== 'number' || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: card, error } = await supabase.from('gift_cards').select('*').eq('code', code).single();
    if (error || !card) {
      return new Response(JSON.stringify({ error: 'Gift card not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (card.status !== 'active') {
      return new Response(JSON.stringify({ error: 'Gift card is not active' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (card.expiry_date && new Date(card.expiry_date) < new Date()) {
      await supabase.from('gift_cards').update({ status: 'expired' }).eq('code', code);
      return new Response(JSON.stringify({ error: 'Gift card has expired' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const discount = Math.min(Number(card.balance), amount);
    const newBalance = Number(card.balance) - discount;
    const newStatus = newBalance <= 0 ? 'redeemed' : 'active';

    const { error: updateError } = await supabase.from('gift_cards').update({
      balance: newBalance,
      status: newStatus,
    }).eq('code', code);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ discount, balance: newBalance, status: newStatus }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Redeem error:', err);
    return new Response(JSON.stringify({ error: 'Failed to redeem gift card' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
