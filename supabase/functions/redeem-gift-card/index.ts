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
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const { action, code, amount, username, sessionToken, totalAmount, remainingAmount, cloverPaymentId } = body;

    if (!code) {
      return new Response(JSON.stringify({ error: 'Gift card code required' }), {
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

    if (action === 'balance') {
      return new Response(JSON.stringify({
        success: true,
        balance: Number(card.balance),
        amount: Number(card.amount),
        status: card.status,
        code: card.code,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (username && sessionToken) {
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('username', username)
        .eq('session_token', sessionToken)
        .single();
      if (staffError || !staff) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
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

    // Record POS transaction if Clover payment details are provided
    if (cloverPaymentId || (typeof totalAmount === 'number' && totalAmount > 0)) {
      let staffId = null;
      if (username && sessionToken) {
        const { data: staff } = await supabase
          .from('staff')
          .select('id')
          .eq('username', username)
          .eq('session_token', sessionToken)
          .single();
        if (staff) staffId = staff.id;
      }
      await supabase.from('pos_transactions').insert({
        staff_id: staffId,
        gift_card_code: code,
        total_amount: typeof totalAmount === 'number' ? totalAmount : amount,
        gift_card_discount: discount,
        remaining_amount: typeof remainingAmount === 'number' ? remainingAmount : 0,
        clover_payment_id: cloverPaymentId || null,
      });
    }

    return new Response(JSON.stringify({ success: true, discount, balance: newBalance, status: newStatus, code: card.code }), {
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
