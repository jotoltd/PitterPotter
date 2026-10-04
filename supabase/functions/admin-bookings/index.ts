import { createClient } from 'supabase';
import { isObject, isNonEmptyString, isOneOf } from '../_shared/validate.ts';
import { logAudit } from '../_shared/audit.ts';
import type { AdminSupabaseClient, StaffRecord } from '../_shared/types.ts';
import { verifyStaff } from '../_shared/auth.ts';
import { corsHeaders as makeCorsHeaders, optionsResponse } from '../_shared/cors.ts';
import { capacityWarning } from '../_shared/capacity.ts';
import { allocateAndApply, persistAllocation, clearBookingResources } from '../_shared/allocation.ts';
import { createNotification } from '../_shared/notifications.ts';

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
    resources: row.resources || undefined,
    depositAmount: row.deposit_amount ? Number(row.deposit_amount) : undefined,
    finalSeats: row.final_seats || undefined,
    finalBalance: row.final_balance ? Number(row.final_balance) : undefined,
    paymentLinkUrl: row.payment_link_url || undefined,
    paymentLinkSentAt: row.payment_link_sent_at || undefined,
    paymentStatus: row.payment_status || undefined,
    stripePaymentIntentId: row.stripe_payment_intent_id || undefined,
    createdAt: row.created_at || undefined,
    photos: row.photos || undefined,
    photoTags: row.photo_tags || undefined,
    collectionStatus: row.collection_status || undefined,
    collectedAt: row.collected_at || undefined,
    managementToken: row.management_token || undefined,
  };
}

// deno-lint-ignore no-explicit-any
function toBookingRow(booking: any): any {
  // Fields the caller didn't send stay undefined and are stripped before the
  // UPDATE, so a partial booking payload can never wipe existing columns.
  // Explicit null/empty values still clear a field.
  const opt = (v: any) => (v === undefined ? undefined : v || null);
  const optNum = (v: any) => (v === undefined ? undefined : v ?? null);
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
    notes: opt(booking.notes),
    status: booking.status,
    request_date: booking.requestDate,
    estimated_price: optNum(booking.estimatedPrice),
    source: opt(booking.source),
    gift_card_code: opt(booking.giftCardCode),
    gift_card_discount: optNum(booking.giftCardDiscount),
    final_price: optNum(booking.finalPrice),
    table_id: opt(booking.tableId),
    deposit_amount: optNum(booking.depositAmount),
    final_seats: optNum(booking.finalSeats),
    final_balance: optNum(booking.finalBalance),
    payment_link_url: opt(booking.paymentLinkUrl),
    payment_link_sent_at: opt(booking.paymentLinkSentAt),
    payment_status: opt(booking.paymentStatus),
    stripe_payment_intent_id: opt(booking.stripePaymentIntentId),
    photos: opt(booking.photos),
    photo_tags: opt(booking.photoTags),
    collection_status: opt(booking.collectionStatus),
    collected_at: opt(booking.collectedAt),
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
      const allData: Record<string, unknown>[] = [];
      const PAGE_SIZE = 1000;
      let offset = 0;
      while (true) {
        let query = supabase.from('bookings').select('*').order('created_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1);
        if (!isSuperAdmin && staff.allowed_studios && staff.allowed_studios.length > 0) {
          query = query.in('studio', staff.allowed_studios);
        }
        const { data, error } = await query;
        if (error) throw error;
        if (!data || data.length === 0) break;
        allData.push(...data);
        if (data.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }
      return new Response(JSON.stringify(allData.map(toBookingInquiry)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create') {
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
      // Checked before the insert so the new booking is not counted against itself
      const warning = await capacityWarning(supabase, booking as Record<string, unknown>);
      const managementToken = crypto.randomUUID();
      const bookingRow = { ...toBookingRow(booking as Record<string, unknown>), management_token: managementToken };
      const { data: insertedRows, error } = await supabase.from('bookings').insert(bookingRow).select('id');
      if (error) throw error;
      if (warning) {
        console.warn(`Overbooking by ${staff.username}: ${warning}`);
      }

      // Wimbledon: allocate physical tables/resources.
      const bookingPrimaryId = insertedRows?.[0]?.id as string | undefined;
      if (bookingPrimaryId && booking.studio === 'Wimbledon' && booking.status !== 'cancelled') {
        try {
          const allocation = await allocateAndApply(supabase, {
            studio: 'Wimbledon',
            date: booking.date as string,
            time: booking.time as string,
            paintersCount: Number(booking.paintersCount) || 1,
            sessionType: booking.sessionType as string,
          });
          if (allocation.success) {
            await persistAllocation(supabase, bookingPrimaryId, allocation);
          } else {
            console.warn('Admin booking could not be auto-allocated:', allocation.reason);
          }
        } catch (allocErr) {
          console.error('Allocation error during admin create:', allocErr);
        }
      }

      await logAudit(supabase, staff, 'create', 'booking', booking.id as string, { studio: booking.studio, date: booking.date, time: booking.time });

      // Create admin notification for walk-in / admin-created booking
      await createNotification(supabase, {
        type: 'booking_walk_in',
        title: 'New Walk-In Booking',
        message: `${staff.name} added: ${booking.name} — ${booking.studio}, ${booking.date} at ${booking.time}`,
        entityType: 'booking',
        entityId: booking.id as string,
        studio: booking.studio as string,
      });

      // Send confirmation email if the booking has an email address
      // For party bookings, only send if the deposit has been paid (not payment-link)
      const isPartyBooking = ['birthday-party', 'baby-shower-hen', 'corporate'].includes(booking.sessionType as string);
      const depositPaid = Number(booking.depositAmount) > 0;
      if (booking.email && (!isPartyBooking || depositPaid)) {
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

      return new Response(JSON.stringify({ success: true, warning }), {
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
      const { data: prevRow } = await supabase.from('bookings').select('*').eq('booking_id', booking.id).single();
      // Excludes this booking so its own seats are not double counted
      const warning = await capacityWarning(supabase, booking as Record<string, unknown>, booking.id as string);
      if (warning) {
        console.warn(`Overbooking by ${staff.username}: ${warning}`);
      }
      const bookingRow = toBookingRow(booking as Record<string, unknown>);
      if (bookingRow.status === 'completed' && !prevRow?.collection_status && !bookingRow.collection_status) {
        bookingRow.collection_status = 'painted';
      }
      // Remove undefined fields so partial updates don't wipe existing data
      for (const key of Object.keys(bookingRow)) {
        if (bookingRow[key] === undefined) delete bookingRow[key];
      }
      const { error } = await supabase.from('bookings').update(bookingRow).eq('booking_id', booking.id);
      if (error) throw error;

      // Wimbledon: re-allocate or clear resources when core booking details change.
      const bookingPrimaryId = prevRow?.id as string | undefined;
      const isWimbledon = (booking.studio || prevRow?.studio) === 'Wimbledon';
      const newStatus = bookingRow.status ?? prevRow?.status;
      if (bookingPrimaryId && isWimbledon) {
        try {
          if (newStatus === 'cancelled') {
            await clearBookingResources(supabase, bookingPrimaryId);
            await supabase.from('bookings').update({ resources: null, table_id: null }).eq('id', bookingPrimaryId);
          } else {
            const date = bookingRow.date ?? prevRow?.date;
            const time = bookingRow.time ?? prevRow?.time;
            const paintersCount = bookingRow.painters_count ?? prevRow?.painters_count;
            const sessionType = bookingRow.session_type ?? prevRow?.session_type;
            const allocation = await allocateAndApply(supabase, {
              studio: 'Wimbledon',
              date: date as string,
              time: time as string,
              paintersCount: Number(paintersCount) || 1,
              sessionType: sessionType as string,
              excludeBookingId: booking.id as string,
            });
            if (allocation.success) {
              await persistAllocation(supabase, bookingPrimaryId, allocation);
            } else {
              console.warn('Admin booking update could not be re-allocated:', allocation.reason);
            }
          }
        } catch (allocErr) {
          console.error('Allocation error during admin update:', allocErr);
        }
      }

      await logAudit(supabase, staff, 'update', 'booking', booking.id as string, { studio: booking.studio, date: booking.date, time: booking.time });

      // Send "ready to collect" notification when collection_status changes to 'ready'
      const prevStatus = prevRow?.collection_status ?? null;
      const newCollectionStatus = bookingRow.collection_status ?? null;
      if (newCollectionStatus === 'ready' && prevStatus !== 'ready') {
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-collection-ready`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': req.headers.get('Authorization') || '' },
            body: JSON.stringify({ bookingId: booking.id }),
          });
        } catch (notifyErr) {
          console.error('Failed to send collection-ready notification:', notifyErr);
        }
      }

      return new Response(JSON.stringify({ success: true, warning }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Lightweight partial update — writes only the fields sent. Used by the app
    // for tags/photos/notes so stale local copies can't clobber other columns,
    // and no capacity check or re-allocation runs for non-seating fields.
    if (action === 'patch') {
      if (!isSuperAdmin && !staff.can_edit_bookings && !staff.can_update_status) {
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
      const { data: prevRow } = await supabase.from('bookings').select('*').eq('booking_id', booking.id).single();
      const patchStudio = booking.studio || prevRow?.studio;
      if (!isSuperAdmin && staff.allowed_studios && staff.allowed_studios.length > 0 && !staff.allowed_studios.includes(patchStudio)) {
        return new Response(JSON.stringify({ error: 'You can only edit bookings for your assigned studio' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const bookingRow = toBookingRow(booking as Record<string, unknown>);
      delete bookingRow.booking_id;
      for (const key of Object.keys(bookingRow)) {
        if (bookingRow[key] === undefined) delete bookingRow[key];
      }
      const { error } = await supabase.from('bookings').update(bookingRow).eq('booking_id', booking.id);
      if (error) throw error;

      await logAudit(supabase, staff, 'patch', 'booking', booking.id as string, { fields: Object.keys(bookingRow) });

      const prevStatus = prevRow?.collection_status ?? null;
      const newCollectionStatus = bookingRow.collection_status ?? null;
      if (newCollectionStatus === 'ready' && prevStatus !== 'ready') {
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-collection-ready`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': req.headers.get('Authorization') || '' },
            body: JSON.stringify({ bookingId: booking.id }),
          });
        } catch (notifyErr) {
          console.error('Failed to send collection-ready notification:', notifyErr);
        }
      }

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
      const updateData: Record<string, any> = { status };
      if (status === 'completed') {
        const { data: prevRow } = await supabase.from('bookings').select('collection_status').eq('booking_id', id).single();
        if (!prevRow?.collection_status) {
          updateData.collection_status = 'painted';
        }
      }
      const { error } = await supabase.from('bookings').update(updateData).eq('booking_id', id);
      if (error) throw error;
      await logAudit(supabase, staff, 'update_status', 'booking', id, { status });

      // Create notification for status changes
      if (status === 'cancelled') {
        await createNotification(supabase, {
          type: 'booking_cancelled',
          title: 'Booking Cancelled',
          message: `${staff.name} cancelled booking ${id}`,
          entityType: 'booking',
          entityId: id,
        });
      } else {
        await createNotification(supabase, {
          type: 'booking_status_changed',
          title: 'Booking Status Updated',
          message: `${staff.name} marked booking ${id} as ${status}`,
          entityType: 'booking',
          entityId: id,
        });
      }

      if (status === 'confirmed') {
        // For party bookings, only send confirmation if deposit has been paid
        const { data: bookingRow } = await supabase.from('bookings').select('session_type, deposit_amount').eq('booking_id', id).single();
        const isPartyBooking = bookingRow && ['birthday-party', 'baby-shower-hen', 'corporate'].includes(bookingRow.session_type);
        const depositPaid = bookingRow && Number(bookingRow.deposit_amount) > 0;
        if (!isPartyBooking || depositPaid) {
          try {
            const projectUrl = Deno.env.get('SUPABASE_URL');
            if (!projectUrl) throw new Error('SUPABASE_URL not set');
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
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'updateCollection') {
      if (!isSuperAdmin && !staff.can_edit_bookings) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { collectionStatus, collectedAt, location } = body;
      if (!isNonEmptyString(id) || !isOneOf(collectionStatus, ['painted', 'ready', 'collected'] as const)) {
        return new Response(JSON.stringify({ error: 'Invalid booking id or collection status' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: prevRow } = await supabase
        .from('bookings')
        .select('studio, collection_status, photo_tags')
        .eq('booking_id', id)
        .single();
      if (!prevRow) {
        return new Response(JSON.stringify({ error: 'Booking not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!isSuperAdmin && staff.allowed_studios && staff.allowed_studios.length > 0 && !staff.allowed_studios.includes(prevRow.studio)) {
        return new Response(JSON.stringify({ error: 'You can only update bookings for your assigned studio' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const updates: Record<string, any> = { collection_status: collectionStatus };
      if (collectionStatus === 'collected') {
        updates.collected_at = isNonEmptyString(collectedAt) ? collectedAt : new Date().toISOString();
      } else if (isNonEmptyString(collectedAt)) {
        updates.collected_at = collectedAt;
      } else {
        updates.collected_at = null;
      }

      // Merge the location tag server-side so photos/tags are never overwritten by a stale client copy
      if (isNonEmptyString(location)) {
        const tags: Record<string, any[]> = (prevRow.photo_tags && typeof prevRow.photo_tags === 'object')
          ? { ...(prevRow.photo_tags as Record<string, any[]>) }
          : {};
        for (const k of Object.keys(tags)) {
          const kept = (Array.isArray(tags[k]) ? tags[k] : []).filter((t: any) => t?.status !== 'location');
          if (kept.length > 0) tags[k] = kept; else delete tags[k];
        }
        tags['0'] = [...(tags['0'] || []), { label: location, status: 'location', x: 50, y: 50 }];
        updates.photo_tags = tags;
      }

      const { error } = await supabase.from('bookings').update(updates).eq('booking_id', id);
      if (error) throw error;
      await logAudit(supabase, staff, 'update_collection_status', 'booking', id, { collectionStatus });

      // Send "ready to collect" notification when collection_status changes to 'ready'
      if (collectionStatus === 'ready' && prevRow.collection_status !== 'ready') {
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-collection-ready`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': req.headers.get('Authorization') || '' },
            body: JSON.stringify({ bookingId: id }),
          });
        } catch (notifyErr) {
          console.error('Failed to send collection-ready notification:', notifyErr);
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
