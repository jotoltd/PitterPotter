import { createClient } from 'supabase';
import { isObject, isNonEmptyString } from '../_shared/validate.ts';
import { logAudit } from '../_shared/audit.ts';
import type { AdminSupabaseClient, StaffRecord } from '../_shared/types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifyStaff(supabase: AdminSupabaseClient, username: string, sessionToken: string): Promise<StaffRecord | null> {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('username', username)
    .eq('session_token', sessionToken)
    .single();
  if (error || !data) return null;
  return data;
}

const SAMPLE_BOOKINGS = [
  { booking_id: 'BK-SAMPLE-001', studio: 'Putney', name: 'Olivia Smith', email: 'olivia.smith@example.com', phone: '07700 900001', date: '2026-07-10', time: '10:00', painters_count: 2, session_type: 'painting', notes: 'SAMPLE DATA: Adult + child pottery painting', status: 'confirmed', request_date: '2026-07-01', estimated_price: 59.90, final_price: 59.90, table_id: 'T1' },
  { booking_id: 'BK-SAMPLE-002', studio: 'Wimbledon', name: 'Noah Jones', email: 'noah.jones@example.com', phone: '07700 900002', date: '2026-07-11', time: '11:00', painters_count: 4, session_type: 'painting', notes: 'SAMPLE DATA: Family of four', status: 'pending', request_date: '2026-07-02', estimated_price: 99.80, final_price: 99.80, table_id: null },
  { booking_id: 'BK-SAMPLE-003', studio: 'Putney', name: 'Emma Brown', email: 'emma.brown@example.com', phone: '07700 900003', date: '2026-07-12', time: '14:00', painters_count: 1, session_type: 'clay-imprints', notes: 'SAMPLE DATA: Baby hand/foot print keepsake', status: 'confirmed', request_date: '2026-07-03', estimated_price: 35.00, final_price: 35.00, table_id: null },
  { booking_id: 'BK-SAMPLE-004', studio: 'Wimbledon', name: 'Liam Wilson', email: 'liam.wilson@example.com', phone: '07700 900004', date: '2026-07-13', time: '16:00', painters_count: 8, session_type: 'birthday-party', notes: 'SAMPLE DATA: 8th birthday party', status: 'confirmed', request_date: '2026-07-04', estimated_price: 231.60, final_price: 231.60, table_id: 'P1' },
  { booking_id: 'BK-SAMPLE-005', studio: 'Putney', name: 'Ava Taylor', email: 'ava.taylor@example.com', phone: '07700 900005', date: '2026-07-14', time: '10:00', painters_count: 3, session_type: 'painting', notes: 'SAMPLE DATA: Saturday morning session', status: 'cancelled', request_date: '2026-07-05', estimated_price: 74.85, final_price: 74.85, table_id: null },
  { booking_id: 'BK-SAMPLE-006', studio: 'Wimbledon', name: 'William Davis', email: 'william.davis@example.com', phone: '07700 900006', date: '2026-07-15', time: '12:00', painters_count: 2, session_type: 'painting', notes: 'SAMPLE DATA: Couple date session', status: 'pending', request_date: '2026-07-06', estimated_price: 59.90, final_price: 59.90, table_id: null },
  { booking_id: 'BK-SAMPLE-007', studio: 'Putney', name: 'Sophia Miller', email: 'sophia.miller@example.com', phone: '07700 900007', date: '2026-07-16', time: '15:00', painters_count: 5, session_type: 'baby-shower-hen', notes: 'SAMPLE DATA: Hen party group', status: 'confirmed', request_date: '2026-07-07', estimated_price: 144.75, final_price: 144.75, table_id: 'P2' },
  { booking_id: 'BK-SAMPLE-008', studio: 'Wimbledon', name: 'James Anderson', email: 'james.anderson@example.com', phone: '07700 900008', date: '2026-07-17', time: '11:00', painters_count: 1, session_type: 'painting', notes: 'SAMPLE DATA: Walk-in customer', status: 'confirmed', request_date: '2026-07-08', estimated_price: 24.95, final_price: 24.95, table_id: 'T3' },
  { booking_id: 'BK-SAMPLE-009', studio: 'Putney', name: 'Isabella Thomas', email: 'isabella.thomas@example.com', phone: '07700 900009', date: '2026-07-18', time: '14:00', painters_count: 12, session_type: 'corporate', notes: 'SAMPLE DATA: Team building event', status: 'pending', request_date: '2026-07-09', estimated_price: 347.40, final_price: 347.40, table_id: null },
  { booking_id: 'BK-SAMPLE-010', studio: 'Wimbledon', name: 'Mason Jackson', email: 'mason.jackson@example.com', phone: '07700 900010', date: '2026-07-19', time: '10:00', painters_count: 2, session_type: 'clay-imprints', notes: 'SAMPLE DATA: Twin prints', status: 'confirmed', request_date: '2026-07-10', estimated_price: 60.00, final_price: 60.00, table_id: null },
  { booking_id: 'BK-SAMPLE-011', studio: 'Putney', name: 'Mia White', email: 'mia.white@example.com', phone: '07700 900011', date: '2026-07-20', time: '13:00', painters_count: 6, session_type: 'birthday-party', notes: 'SAMPLE DATA: 6th birthday with cake', status: 'confirmed', request_date: '2026-07-11', estimated_price: 173.70, final_price: 173.70, table_id: 'P1' },
  { booking_id: 'BK-SAMPLE-012', studio: 'Wimbledon', name: 'Lucas Harris', email: 'lucas.harris@example.com', phone: '07700 900012', date: '2026-07-21', time: '15:00', painters_count: 3, session_type: 'painting', notes: 'SAMPLE DATA: After school group', status: 'pending', request_date: '2026-07-12', estimated_price: 74.85, final_price: 74.85, table_id: null },
  { booking_id: 'BK-SAMPLE-013', studio: 'Putney', name: 'Charlotte Martin', email: 'charlotte.martin@example.com', phone: '07700 900013', date: '2026-07-22', time: '11:00', painters_count: 1, session_type: 'painting', notes: 'SAMPLE DATA: Solo creative session', status: 'confirmed', request_date: '2026-07-13', estimated_price: 24.95, final_price: 24.95, table_id: 'T2' },
  { booking_id: 'BK-SAMPLE-014', studio: 'Wimbledon', name: 'Henry Thompson', email: 'henry.thompson@example.com', phone: '07700 900014', date: '2026-07-23', time: '14:00', painters_count: 4, session_type: 'painting', notes: 'SAMPLE DATA: Family weekend', status: 'confirmed', request_date: '2026-07-14', estimated_price: 99.80, final_price: 99.80, table_id: null },
  { booking_id: 'BK-SAMPLE-015', studio: 'Putney', name: 'Amelia Garcia', email: 'amelia.garcia@example.com', phone: '07700 900015', date: '2026-07-24', time: '16:00', painters_count: 10, session_type: 'corporate', notes: 'SAMPLE DATA: Office social', status: 'pending', request_date: '2026-07-15', estimated_price: 289.50, final_price: 289.50, table_id: null },
  { booking_id: 'BK-SAMPLE-016', studio: 'Wimbledon', name: 'Ethan Martinez', email: 'ethan.martinez@example.com', phone: '07700 900016', date: '2026-07-25', time: '10:00', painters_count: 2, session_type: 'clay-imprints', notes: 'SAMPLE DATA: Newborn prints', status: 'confirmed', request_date: '2026-07-16', estimated_price: 60.00, final_price: 60.00, table_id: null },
  { booking_id: 'BK-SAMPLE-017', studio: 'Putney', name: 'Harper Robinson', email: 'harper.robinson@example.com', phone: '07700 900017', date: '2026-07-26', time: '12:00', painters_count: 5, session_type: 'baby-shower-hen', notes: 'SAMPLE DATA: Baby shower group', status: 'confirmed', request_date: '2026-07-17', estimated_price: 144.75, final_price: 144.75, table_id: 'P3' },
  { booking_id: 'BK-SAMPLE-018', studio: 'Wimbledon', name: 'Alexander Clark', email: 'alexander.clark@example.com', phone: '07700 900018', date: '2026-07-27', time: '15:00', painters_count: 2, session_type: 'painting', notes: 'SAMPLE DATA: Anniversary activity', status: 'pending', request_date: '2026-07-18', estimated_price: 59.90, final_price: 59.90, table_id: null },
  { booking_id: 'BK-SAMPLE-019', studio: 'Putney', name: 'Evelyn Rodriguez', email: 'evelyn.rodriguez@example.com', phone: '07700 900019', date: '2026-07-28', time: '11:00', painters_count: 7, session_type: 'birthday-party', notes: 'SAMPLE DATA: 7th birthday party', status: 'confirmed', request_date: '2026-07-19', estimated_price: 202.65, final_price: 202.65, table_id: 'P1' },
  { booking_id: 'BK-SAMPLE-020', studio: 'Wimbledon', name: 'Daniel Lewis', email: 'daniel.lewis@example.com', phone: '07700 900020', date: '2026-07-29', time: '13:00', painters_count: 1, session_type: 'painting', notes: 'SAMPLE DATA: Drop-in customer', status: 'cancelled', request_date: '2026-07-20', estimated_price: 24.95, final_price: 24.95, table_id: null },
];

const SAMPLE_GIFT_CARDS = [
  { code: 'SAMPLE-GC-0001', amount: 50.00, balance: 50.00, recipient_name: 'Emily', recipient_email: 'emily@example.com', sender_name: 'Sample Sender', message: 'SAMPLE DATA: Happy birthday!', status: 'active', purchase_offset_days: -2, expiry_offset_days: 360, stripe_session_id: 'sess_sample_001' },
  { code: 'SAMPLE-GC-0002', amount: 100.00, balance: 0.00, recipient_name: 'Jessica', recipient_email: 'jessica@example.com', sender_name: 'Sample Sender', message: 'SAMPLE DATA: Thank you gift', status: 'redeemed', purchase_offset_days: -30, expiry_offset_days: 330, stripe_session_id: 'sess_sample_002' },
  { code: 'SAMPLE-GC-0003', amount: 25.00, balance: 25.00, recipient_name: 'Olivia', recipient_email: 'olivia@example.com', sender_name: 'Sample Sender', message: 'SAMPLE DATA: Get creative!', status: 'active', purchase_offset_days: -5, expiry_offset_days: 355, stripe_session_id: 'sess_sample_003' },
  { code: 'SAMPLE-GC-0004', amount: 75.00, balance: 75.00, recipient_name: 'Sophia', recipient_email: 'sophia@example.com', sender_name: 'Sample Sender', message: 'SAMPLE DATA: Housewarming present', status: 'expired', purchase_offset_days: -10, expiry_offset_days: -1, stripe_session_id: 'sess_sample_004' },
  { code: 'SAMPLE-GC-0005', amount: 150.00, balance: 50.00, recipient_name: 'Ava', recipient_email: 'ava@example.com', sender_name: 'Sample Sender', message: 'SAMPLE DATA: Family fun day', status: 'active', purchase_offset_days: -20, expiry_offset_days: 340, stripe_session_id: 'sess_sample_005' },
];

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
    if (!isObject(body)) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { action, username, sessionToken } = body;

    if (!isNonEmptyString(action) || !isNonEmptyString(username) || !isNonEmptyString(sessionToken)) {
      return new Response(JSON.stringify({ error: 'Missing credentials' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const staff = await verifyStaff(supabase, username, sessionToken);
    if (!staff || staff.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'remove') {
      const { error: bookingsError } = await supabase.from('bookings').delete().eq('source', 'sample');
      if (bookingsError) throw bookingsError;
      const { error: giftCardsError } = await supabase.from('gift_cards').delete().eq('sender_name', 'Sample Sender');
      if (giftCardsError) throw giftCardsError;
      await logAudit(supabase, staff, 'remove_sample_data', 'sample_data', 'all', {});
      return new Response(JSON.stringify({ success: true, message: 'Sample data removed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'add') {
      // Remove existing sample data first to avoid conflicts
      await supabase.from('bookings').delete().eq('source', 'sample');
      await supabase.from('gift_cards').delete().eq('sender_name', 'Sample Sender');

      const bookingsWithSource = SAMPLE_BOOKINGS.map(b => ({ ...b, source: 'sample' }));
      const { error: bookingsError } = await supabase.from('bookings').insert(bookingsWithSource);
      if (bookingsError) throw bookingsError;

      const now = new Date();
      const giftCards = SAMPLE_GIFT_CARDS.map(g => ({
        code: g.code,
        amount: g.amount,
        balance: g.balance,
        recipient_name: g.recipient_name,
        recipient_email: g.recipient_email,
        sender_name: g.sender_name,
        message: g.message,
        status: g.status,
        purchase_date: new Date(now.getTime() + g.purchase_offset_days * 86400000).toISOString(),
        expiry_date: new Date(now.getTime() + g.expiry_offset_days * 86400000).toISOString(),
        stripe_session_id: g.stripe_session_id,
      }));
      const { error: giftCardsError } = await supabase.from('gift_cards').insert(giftCards);
      if (giftCardsError) throw giftCardsError;

      await logAudit(supabase, staff, 'add_sample_data', 'sample_data', 'all', { bookings: bookingsWithSource.length, giftCards: giftCards.length });
      return new Response(JSON.stringify({ success: true, message: 'Sample data added', bookings: bookingsWithSource.length, giftCards: giftCards.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'status') {
      const { count: bookingsCount } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('source', 'sample');
      const { count: giftCardsCount } = await supabase.from('gift_cards').select('*', { count: 'exact', head: true }).eq('sender_name', 'Sample Sender');
      return new Response(JSON.stringify({
        sampleBookings: bookingsCount ?? 0,
        sampleGiftCards: giftCardsCount ?? 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Sample data error:', err);
    const details = err instanceof Error ? err.message : JSON.stringify(err);
    return new Response(JSON.stringify({ error: 'Failed to process request', details }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
