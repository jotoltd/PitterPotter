// One-off fix: remove setup/cleanup buffers baked into booking_resources and
// bookings.resources for party bookings. Buffers are now 0, so a party should
// block exactly its session window. Usage:
//   npx tsx scripts/strip-party-buffers.ts [apply]
import WebSocket from 'ws';
import { createClient } from '@supabase/supabase-js';

(globalThis as any).WebSocket = WebSocket;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APPLY = process.argv.includes('apply');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const PARTY_SESSION_TYPES = ['birthday-party', 'baby-shower-hen', 'corporate'];
const SESSION_MINUTES = 120;

function parseSingleTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function sessionWindow(date: string, time: string): { start: Date; end: Date } | null {
  if (!date || !time) return null;
  const [y, mo, d] = date.split('-').map(Number);
  const [first, second] = time.split('-').map((t) => t.trim());
  const startMin = parseSingleTime(first);
  if (!first || Number.isNaN(startMin)) return null;
  const start = new Date(Date.UTC(y, (mo || 1) - 1, d || 1, Math.floor(startMin / 60), startMin % 60));
  const endMin = second ? parseSingleTime(second) : null;
  const end = endMin != null && !Number.isNaN(endMin)
    ? new Date(Date.UTC(y, (mo || 1) - 1, d || 1, Math.floor(endMin / 60), endMin % 60))
    : new Date(start.getTime() + SESSION_MINUTES * 60000);
  return { start, end };
}

async function main() {
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, booking_id, name, date, time, session_type, resources')
    .eq('studio', 'Wimbledon')
    .in('session_type', PARTY_SESSION_TYPES)
    .in('status', ['pending', 'confirmed', 'completed', 'seated'])
    .not('resources', 'is', null);
  if (error) throw error;

  let updated = 0;
  let skipped = 0;
  for (const b of bookings || []) {
    const window = sessionWindow(b.date, b.time);
    if (!window) {
      console.log(`SKIP ${b.booking_id} ${b.name} — unparseable time "${b.time}"`);
      skipped++;
      continue;
    }
    const start = window.start.toISOString();
    const end = window.end.toISOString();

    const { data: resRows } = await supabase
      .from('booking_resources')
      .select('id, blocked_start, blocked_end')
      .eq('booking_id', b.id);

    const alreadyOk = (resRows || []).every(
      (r: any) => new Date(r.blocked_start).toISOString() === start && new Date(r.blocked_end).toISOString() === end,
    ) && (resRows || []).length > 0;

    if (alreadyOk) {
      skipped++;
      continue;
    }

    console.log(`${APPLY ? 'UPDATE' : 'WOULD'} ${b.booking_id} ${b.name} ${b.date} ${b.time} → ${start.slice(11, 16)}-${end.slice(11, 16)} (${(resRows || []).length} resources)`);

    if (APPLY) {
      const { error: rErr } = await supabase
        .from('booking_resources')
        .update({ blocked_start: start, blocked_end: end })
        .eq('booking_id', b.id);
      if (rErr) throw rErr;

      const newResources = (b.resources || []).map((r: any) => ({
        ...r,
        blocked_start: start,
        blocked_end: end,
      }));
      const { error: bErr } = await supabase
        .from('bookings')
        .update({ resources: newResources })
        .eq('id', b.id);
      if (bErr) throw bErr;
    }
    updated++;
  }
  console.log(`\n${APPLY ? 'Updated' : 'Would update'}: ${updated} | skipped: ${skipped}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
