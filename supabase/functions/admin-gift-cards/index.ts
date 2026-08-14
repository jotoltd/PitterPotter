import { createClient } from 'supabase';
import { isObject, isNonEmptyString, isOneOf, isNumber } from '../_shared/validate.ts';
import { logAudit } from '../_shared/audit.ts';
import type { AdminSupabaseClient, StaffRecord } from '../_shared/types.ts';
import { verifyStaff } from '../_shared/auth.ts';
import { corsHeaders as makeCorsHeaders, optionsResponse } from '../_shared/cors.ts';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'PP-';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req, true);
  }
  const corsHeaders = makeCorsHeaders(req, true);

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
    const { action, username, sessionToken, id, status } = body;

    if (!isNonEmptyString(action) || !isNonEmptyString(username) || !isNonEmptyString(sessionToken)) {
      return new Response(JSON.stringify({ error: 'Missing action, username, or sessionToken' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const staff = await verifyStaff(supabase, username, sessionToken);
    if (!staff) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isSuperAdmin = staff.role === 'super_admin';

    if (action === 'list') {
      if (!isSuperAdmin) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data, error: listError } = await supabase
        .from('gift_cards')
        .select('*')
        .order('created_at', { ascending: false });
      if (listError) throw listError;
      return new Response(JSON.stringify({ giftCards: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create') {
      if (!isSuperAdmin) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { amount, recipientName, recipientEmail, senderName, message, isPhysical } = body;
      if (!isNumber(amount) || amount <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid amount' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const code = generateCode();
      const purchaseDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      const { data: giftCard, error: insertError } = await supabase.from('gift_cards').insert({
        code,
        amount,
        balance: amount,
        recipient_name: recipientName || '',
        recipient_email: recipientEmail || '',
        sender_name: senderName || 'In-store',
        sender_email: '',
        message: message || '',
        status: 'active',
        purchase_date: purchaseDate,
        expiry_date: expiryDate.toISOString(),
        stripe_session_id: isPhysical ? `physical_${Date.now()}` : `admin_${Date.now()}`,
      }).select().single();

      if (insertError) throw insertError;

      await logAudit(supabase, staff, 'create', 'gift_card', giftCard.id, { code, amount, isPhysical: !!isPhysical });

      // Send email if recipient email is provided and not a physical card
      if (!isPhysical && recipientEmail) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-gift-card-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
            body: JSON.stringify({ giftCardId: giftCard.id }),
          });
        } catch (emailErr) {
          console.error('Failed to send gift card email:', emailErr);
        }
      }

      return new Response(JSON.stringify({
        id: giftCard.id,
        code: giftCard.code,
        amount: Number(giftCard.amount),
        balance: Number(giftCard.balance),
        status: giftCard.status,
        recipient_name: giftCard.recipient_name,
        recipient_email: giftCard.recipient_email,
        created_at: giftCard.created_at,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'balance') {
      const { code } = body;
      if (!isNonEmptyString(code)) {
        return new Response(JSON.stringify({ error: 'Missing code' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: card, error: cardError } = await supabase
        .from('gift_cards')
        .select('*')
        .eq('code', code.trim())
        .single();

      if (cardError || !card) {
        return new Response(JSON.stringify({ error: 'Gift card not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const expiryDate = card.expiry_date ? new Date(card.expiry_date) : null;
      const isExpired = expiryDate ? expiryDate < new Date() : false;

      if (isExpired && card.status === 'active') {
        await supabase.from('gift_cards').update({ status: 'expired' }).eq('id', card.id);
        card.status = 'expired';
      }

      await logAudit(supabase, staff, 'balance_check', 'gift_card', card.id, { code: card.code });

      return new Response(JSON.stringify({
        id: card.id,
        code: card.code,
        amount: Number(card.amount),
        balance: Number(card.balance),
        status: card.status,
        recipient_name: card.recipient_name,
        recipient_email: card.recipient_email,
        expiry_date: card.expiry_date,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'redeem') {
      const { code, amount: redeemAmount } = body;
      if (!isNonEmptyString(code)) {
        return new Response(JSON.stringify({ error: 'Missing code' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!isNumber(redeemAmount) || redeemAmount <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid amount' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: card, error: cardError } = await supabase
        .from('gift_cards')
        .select('*')
        .eq('code', code.trim())
        .single();

      if (cardError || !card) {
        return new Response(JSON.stringify({ error: 'Gift card not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (card.status !== 'active') {
        return new Response(JSON.stringify({ error: `Gift card is ${card.status}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const expiryDate = card.expiry_date ? new Date(card.expiry_date) : null;
      if (expiryDate && expiryDate < new Date()) {
        await supabase.from('gift_cards').update({ status: 'expired' }).eq('id', card.id);
        return new Response(JSON.stringify({ error: 'Gift card has expired' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const currentBalance = Number(card.balance);
      const discount = Math.min(currentBalance, redeemAmount);
      const newBalance = currentBalance - discount;
      const newStatus = newBalance <= 0 ? 'redeemed' : 'active';

      const { error: updateError } = await supabase.from('gift_cards').update({
        balance: newBalance,
        status: newStatus,
      }).eq('id', card.id);

      if (updateError) throw updateError;

      await logAudit(supabase, staff, 'redeem', 'gift_card', card.id, {
        code: card.code,
        amount: redeemAmount,
        discount,
        newBalance,
      });

      return new Response(JSON.stringify({
        success: true,
        code: card.code,
        discount,
        balance: newBalance,
        status: newStatus,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'updateStatus') {
      if (!isSuperAdmin) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!isNonEmptyString(id) || !isOneOf(status, ['active', 'redeemed', 'expired', 'cancelled'] as const)) {
        return new Response(JSON.stringify({ error: 'Invalid id or status' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { error } = await supabase.from('gift_cards').update({ status }).eq('id', id);
      if (error) throw error;
      await logAudit(supabase, staff, 'update_status', 'gift_card', id, { status });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      if (!isSuperAdmin) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!isNonEmptyString(id)) {
        return new Response(JSON.stringify({ error: 'Missing id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: card, error: fetchError } = await supabase
        .from('gift_cards')
        .select('code, amount, status')
        .eq('id', id)
        .single();
      if (fetchError || !card) {
        return new Response(JSON.stringify({ error: 'Gift card not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { error: deleteError } = await supabase.from('gift_cards').delete().eq('id', id);
      if (deleteError) throw deleteError;
      await logAudit(supabase, staff, 'delete', 'gift_card', id, { code: card.code, amount: card.amount, status: card.status });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'resend') {
      if (!isSuperAdmin) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!isNonEmptyString(id)) {
        return new Response(JSON.stringify({ error: 'Missing id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: card, error: fetchError } = await supabase
        .from('gift_cards')
        .select('code, recipient_email, recipient_name')
        .eq('id', id)
        .single();
      if (fetchError || !card) {
        return new Response(JSON.stringify({ error: 'Gift card not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!card.recipient_email) {
        return new Response(JSON.stringify({ error: 'No recipient email on file' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const resendResponse = await fetch(`${supabaseUrl}/functions/v1/send-gift-card-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
        body: JSON.stringify({ giftCardId: id }),
      });
      if (!resendResponse.ok) {
        const errData = await resendResponse.json().catch(() => ({}));
        return new Response(JSON.stringify({ error: errData.error || 'Failed to resend email' }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await logAudit(supabase, staff, 'resend_email', 'gift_card', id, { code: card.code, recipient_email: card.recipient_email });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin gift cards error:', err);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
