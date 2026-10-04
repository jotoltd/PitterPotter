// One-off backfill: assign physical tables/resources to existing Wimbledon bookings
// that don't have booking_resources yet, so they appear on the floor plan and block
// capacity. Usage: npx tsx scripts/backfill-allocations.ts [apply]
import WebSocket from 'ws';
import { createClient } from '@supabase/supabase-js';
import { allocateResources, isPartySessionType, type AllocationRequest, type ResourceBlock } from '../src/lib/allocation';

(globalThis as any).WebSocket = WebSocket;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APPLY = process.argv.includes('apply');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

type Booking = {
  id: string;
  booking_id: string;
  name: string;
  date: string;
  time: string;
  painters_count: number;
  session_type: string;
  status: string;
  table_id: string | null;
  resources: ResourceBlock[] | null;
  created_at: string;
};

async function main() {
  // Real config UUIDs for booking_resources.table_configuration_id
  const { data: configs, error: cfgErr } = await supabase
    .from('table_configurations').select('id, name').eq('studio', 'Wimbledon');
  if (cfgErr) throw cfgErr;
  const configIdByName = new Map<string, string>((configs || []).map((c: any) => [c.name, c.id]));

  const { data: bookings, error: bErr } = await supabase
    .from('bookings')
    .select('id, booking_id, name, date, time, painters_count, session_type, status, table_id, resources, created_at')
    .eq('studio', 'Wimbledon')
    .in('status', ['pending', 'confirmed'])
    .order('date').order('created_at');
  if (bErr) throw bErr;
  const all = (bookings || []) as Booking[];
  console.log(`Found ${all.length} pending/confirmed Wimbledon bookings`);

  const ids = all.map(b => b.id);
  const { data: existingRows, error: rErr } = await supabase
    .from('booking_resources').select('booking_id, table_id, blocked_start, blocked_end')
    .in('booking_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  if (rErr) throw rErr;

  const byBooking = new Map<string, ResourceBlock[]>();
  for (const r of existingRows || []) {
    const list = byBooking.get(r.booking_id) || [];
    list.push({ table_id: r.table_id, blocked_start: r.blocked_start, blocked_end: r.blocked_end });
    byBooking.set(r.booking_id, list);
  }

  // Bookings that already have booking_resources rows keep them; feed as occupancy.
  for (const b of all) {
    const rows = byBooking.get(b.id);
    if (rows?.length) b.resources = rows;
  }

  // Parties have the strictest constraints — allocate them before normal bookings
  // so expansion tables (T12–T14) aren't stolen by bookings that could sit elsewhere.
  const toAllocate = all
    .filter(b => !byBooking.get(b.id)?.length)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      const pa = isPartySessionType(a.session_type) ? 0 : 1;
      const pb = isPartySessionType(b.session_type) ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return a.created_at < b.created_at ? -1 : 1;
    });
  console.log(`${all.length - toAllocate.length} already allocated; ${toAllocate.length} need tables\n`);

  let assigned = 0, failed = 0;
  for (const b of toAllocate) {
    if (!b.date || !b.time || !b.session_type || !b.painters_count) {
      console.log(`SKIP  ${b.booking_id} ${b.name} — missing date/time/sessionType/painters`);
      failed++;
      continue;
    }
    const req: AllocationRequest = {
      studio: 'Wimbledon',
      date: b.date,
      time: b.time,
      paintersCount: b.painters_count,
      sessionType: b.session_type,
    };
    // Pass every other booking for the same date so their resources/table_id blocks count.
    const others = all.filter(o => o.id !== b.id && o.date === b.date);
    const result = allocateResources(req, others);

    if (!result.success || !result.configuration) {
      console.log(`FAIL  ${b.booking_id} ${b.name} ${b.date} ${b.time} x${b.painters_count} (${b.session_type}) — ${result.reason}`);
      failed++;
      continue;
    }

    const tables = result.resources.map(r => r.table_id).join(', ');
    console.log(`OK    ${b.booking_id} ${b.name} ${b.date} ${b.time} x${b.painters_count} (${b.session_type}) → ${result.configuration.name} [${tables}]`);

    if (APPLY) {
      const rows = result.resources.map(r => ({
        booking_id: b.id,
        table_configuration_id: configIdByName.get(result.configuration!.name) || null,
        table_id: r.table_id,
        blocked_start: r.blocked_start,
        blocked_end: r.blocked_end,
      }));
      const { error: insErr } = await supabase.from('booking_resources').insert(rows);
      if (insErr) { console.log(`      INSERT FAILED: ${insErr.message}`); failed++; continue; }
      const snapshot = result.resources.map(r => ({
        table_id: r.table_id,
        table_configuration_id: configIdByName.get(result.configuration!.name) || null,
        configuration_name: result.configuration!.name,
        blocked_start: r.blocked_start,
        blocked_end: r.blocked_end,
      }));
      const { error: updErr } = await supabase.from('bookings')
        .update({ resources: snapshot, table_id: tables })
        .eq('id', b.id);
      if (updErr) { console.log(`      UPDATE FAILED: ${updErr.message}`); failed++; continue; }
    }

    // Make the new blocks visible to later bookings in this run.
    b.resources = result.resources;
    assigned++;
  }
  console.log(`\n${APPLY ? 'APPLIED' : 'DRY RUN'} — assigned: ${assigned}, failed/skipped: ${failed}`);
}

main().catch(e => { console.error(e); process.exit(1); });
