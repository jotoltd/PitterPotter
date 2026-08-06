import { createClient } from 'supabase';
import { isObject, isNonEmptyString, isOneOf } from '../_shared/validate.ts';
import { logAudit } from '../_shared/audit.ts';
import type { AdminSupabaseClient, StaffRecord } from '../_shared/types.ts';
import { verifyStaff } from '../_shared/auth.ts';
import { corsHeaders as makeCorsHeaders, optionsResponse } from '../_shared/cors.ts';


// deno-lint-ignore no-explicit-any
function toBookingInquiry(row: any): any {
  return {
    id: row.booking_id,
    studio: row.studio,
    name: row.name,
    email: row.email,
    phone: row.phone,
    date: row.date,
    time: row.time,
    paintersCount: row.painters_count,
    sessionType: row.session_type,
    notes: row.notes || undefined,
    status: row.status,
    requestDate: row.request_date,
    estimatedPrice: row.estimated_price ? Number(row.estimated_price) : undefined,
    source: row.source || undefined,
    giftCardCode: row.gift_card_code || undefined,
    giftCardDiscount: row.gift_card_discount ? Number(row.gift_card_discount) : undefined,
    finalPrice: row.final_price ? Number(row.final_price) : undefined,
    tableId: row.table_id || undefined,
    depositAmount: row.deposit_amount ? Number(row.deposit_amount) : undefined,
    finalSeats: row.final_seats || undefined,
    finalBalance: row.final_balance ? Number(row.final_balance) : undefined,
    paymentLinkUrl: row.payment_link_url || undefined,
    paymentLinkSentAt: row.payment_link_sent_at || undefined,
    paymentStatus: row.payment_status || undefined,
    stripePaymentIntentId: row.stripe_payment_intent_id || undefined,
    createdAt: row.created_at || undefined,
  };
}

// deno-lint-ignore no-explicit-any
function toBookingRow(booking: any): any {
  return {
    booking_id: booking.id,
    studio: booking.studio,
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    date: booking.date,
    time: booking.time,
    painters_count: booking.paintersCount,
    session_type: booking.sessionType,
    notes: booking.notes || null,
    status: booking.status,
    request_date: booking.requestDate,
    estimated_price: booking.estimatedPrice ?? null,
    source: booking.source || null,
    gift_card_code: booking.giftCardCode || null,
    gift_card_discount: booking.giftCardDiscount ?? null,
    final_price: booking.finalPrice ?? null,
    table_id: booking.tableId || null,
    deposit_amount: booking.depositAmount ?? null,
    final_seats: booking.finalSeats ?? null,
    final_balance: booking.finalBalance ?? null,
    payment_link_url: booking.paymentLinkUrl || null,
    payment_link_sent_at: booking.paymentLinkSentAt || null,
    payment_status: booking.paymentStatus || null,
    stripe_payment_intent_id: booking.stripePaymentIntentId || null,
  };
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
    const { action, username, sessionToken, booking, id, status } = body;

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

    if (action === 'load') {
      let query = supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (!isSuperAdmin && staff.allowed_studios && staff.allowed_studios.length > 0) {
        query = query.in('studio', staff.allowed_studios);
      }
      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify((data || []).map(toBookingInquiry)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create') {
      if (!isSuperAdmin && !staff.can_add_walk_ins) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!isObject(booking)) {
        return new Response(JSON.stringify({ error: 'Invalid booking data' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!isSuperAdmin && staff.allowed_studios && staff.allowed_studios.length > 0 && !staff.allowed_studios.includes(booking.studio)) {
        return new Response(JSON.stringify({ error: 'You can only create bookings for your assigned studio' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const managementToken = crypto.randomUUID();
      const bookingRow = { ...toBookingRow(booking as Record<string, unknown>), management_token: managementToken };
      const { error } = await supabase.from('bookings').insert(bookingRow);
      if (error) throw error;
      await logAudit(supabase, staff, 'create', 'booking', booking.id as string, { studio: booking.studio, date: booking.date, time: booking.time });

      // Send confirmation email if the booking has an email address
      if (booking.email) {
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-booking-confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') ?? ''}` },
            body: JSON.stringify({ bookingId: booking.id, managementToken }),
          });
        } catch (emailErr) {
          console.error('Failed to send confirmation email for admin booking:', emailErr);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update') {
      if (!isSuperAdmin && !staff.can_edit_bookings) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!isObject(booking) || !isNonEmptyString(booking.id)) {
        return new Response(JSON.stringify({ error: 'Invalid booking data' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!isSuperAdmin && staff.allowed_studios && staff.allowed_studios.length > 0 && !staff.allowed_studios.includes(booking.studio)) {
        return new Response(JSON.stringify({ error: 'You can only edit bookings for your assigned studio' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { error } = await supabase.from('bookings').update(toBookingRow(booking as Record<string, unknown>)).eq('booking_id', booking.id);
      if (error) throw error;
      await logAudit(supabase, staff, 'update', 'booking', booking.id as string, { studio: booking.studio, date: booking.date, time: booking.time });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'updateStatus') {
      if (!isSuperAdmin && !staff.can_update_status) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!isNonEmptyString(id) || !isOneOf(status, ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'] as const)) {
        return new Response(JSON.stringify({ error: 'Invalid booking id or status' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!isSuperAdmin && staff.allowed_studios && staff.allowed_studios.length > 0) {
        const { data: bookingRow } = await supabase.from('bookings').select('studio').eq('booking_id', id).single();
        if (bookingRow && !staff.allowed_studios.includes(bookingRow.studio)) {
          return new Response(JSON.stringify({ error: 'You can only update bookings for your assigned studio' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      const { error } = await supabase.from('bookings').update({ status }).eq('booking_id', id);
      if (error) throw error;
      await logAudit(supabase, staff, 'update_status', 'booking', id, { status });

      if (status === 'confirmed') {
        try {
          const projectUrl = Deno.env.get('SUPABASE_URL')!;
          await fetch(`${projectUrl}/functions/v1/send-booking-confirmation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': req.headers.get('Authorization') || '',
            },
            body: JSON.stringify({ username, sessionToken, bookingId: id }),
          });
        } catch (err) {
          console.error('Failed to send confirmation email:', err);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      if (!isSuperAdmin && !staff.can_delete_bookings) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!isNonEmptyString(id)) {
        return new Response(JSON.stringify({ error: 'Invalid booking id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!isSuperAdmin && staff.allowed_studios && staff.allowed_studios.length > 0) {
        const { data: bookingRow } = await supabase.from('bookings').select('studio').eq('booking_id', id).single();
        if (bookingRow && !staff.allowed_studios.includes(bookingRow.studio)) {
          return new Response(JSON.stringify({ error: 'You can only delete bookings for your assigned studio' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      const { error } = await supabase.from('bookings').delete().eq('booking_id', id);
      if (error) throw error;
      await logAudit(supabase, staff, 'delete', 'booking', id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin bookings error:', err);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
