// Shared capacity logic for open (painting) and party bookings.
//
// Each studio has a "front" area (used for open painting sessions) and a
// "back" area (used for parties). When no party is booked in a time slot,
// open painting bookings may use the full studio (front + back). When a
// party IS booked in that slot, the back tables are reserved for the party
// and open bookings are limited to the front-tables-only capacity.
//
// capacity table session_type values:
//   'open'            - full studio capacity for open/painting sessions (no party present)
//   'open_restricted' - front-tables-only capacity for open/painting sessions (party present)
//   'party'           - capacity for a party booking (birthday / hen / corporate)

export const PARTY_SESSION_TYPES = ['birthday-party', 'baby-shower-hen', 'corporate'];

export type StudioName = 'Putney' | 'Wimbledon';

export const DEFAULT_MAX_BOOKINGS: Record<StudioName, number> = { Putney: 99, Wimbledon: 17 };
export const DEFAULT_RESTRICTED_MAX_BOOKINGS: Record<StudioName, number> = { Putney: 99, Wimbledon: 10 };
export const DEFAULT_OPEN_CAPACITY: Record<StudioName, number> = { Putney: 32, Wimbledon: 58 };
export const DEFAULT_OPEN_RESTRICTED_CAPACITY: Record<StudioName, number> = { Putney: 15, Wimbledon: 32 };
export const DEFAULT_PARTY_CAPACITY: Record<StudioName, number> = { Putney: 20, Wimbledon: 26 };

// How many parties may run at the same time in a studio's back area.
// Putney has a single party space; Wimbledon's back area seats two.
export const DEFAULT_MAX_CONCURRENT_PARTIES: Record<StudioName, number> = { Putney: 1, Wimbledon: 2 };

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

export interface CapacityResult {
  remaining: number;
  max: number;
  booked: number;
  hasPartyBooking: boolean;
  remainingBookings: number;
  maxBookings: number;
  conflict?: 'party_session_exists';
}

interface BookingRow {
  painters_count?: number;
  session_type?: string;
  booking_id?: string;
  time?: string;
}

// Party slots are stored as ranges (e.g. "12:30-14:30"), so only the start
// time is used for overlap comparisons.
function parseTimeToMinutes(time: string): number {
  const start = time.split('-')[0].trim();
  const [h, m] = start.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function overlapsTwoHours(timeA: string, timeB: string): boolean {
  return Math.abs(parseTimeToMinutes(timeA) - parseTimeToMinutes(timeB)) < 120;
}

export async function computeCapacity(
  supabase: SupabaseClient,
  studio: StudioName,
  date: string,
  time: string,
  sessionType: string | undefined,
  excludeBookingId?: string,
): Promise<CapacityResult> {
  // Query all bookings for the date+studio, then filter by 2-hour window overlap
  const { data, error } = await supabase
    .from('bookings')
    .select('painters_count, session_type, booking_id, time')
    .eq('studio', studio)
    .eq('date', date)
    .in('status', ['pending', 'confirmed']);

  if (error) throw error;

  const rows: BookingRow[] = (data || [])
    .filter((r: BookingRow) => !excludeBookingId || r.booking_id !== excludeBookingId)
    .filter((r: BookingRow) => r.time != null && overlapsTwoHours(r.time, time));

  const incomingIsParty = sessionType ? PARTY_SESSION_TYPES.includes(sessionType) : false;
  const partyRows = rows.filter((r) => PARTY_SESSION_TYPES.includes(r.session_type ?? ''));
  const openRows = rows.filter((r) => !PARTY_SESSION_TYPES.includes(r.session_type ?? ''));
  const hasPartyBooking = partyRows.length > 0;

  // A studio's back area can host a limited number of parties at the same time.
  const maxConcurrentParties = DEFAULT_MAX_CONCURRENT_PARTIES[studio];
  if (incomingIsParty && partyRows.length >= maxConcurrentParties) {
    return {
      remaining: 0,
      max: 0,
      booked: 0,
      hasPartyBooking: true,
      remainingBookings: 0,
      maxBookings: maxConcurrentParties,
      conflict: 'party_session_exists',
    };
  }

  const { data: capacityRows } = await supabase
    .from('capacity')
    .select('session_type, max_painters')
    .eq('studio', studio)
    .in('session_type', ['open', 'open_restricted', 'party']);

  const findMax = (type: string, fallback: number) =>
    (capacityRows || []).find((r: { session_type: string; max_painters: number }) => r.session_type === type)
      ?.max_painters ?? fallback;

  const openFullMax = findMax('open', DEFAULT_OPEN_CAPACITY[studio]);
  const openRestrictedMax = findMax('open_restricted', DEFAULT_OPEN_RESTRICTED_CAPACITY[studio]);
  const partyMax = findMax('party', DEFAULT_PARTY_CAPACITY[studio]);

  if (incomingIsParty) {
    // A free party space exists (checked above); seats are shared across any
    // parties already running in this slot.
    const booked = partyRows.reduce((sum, r) => sum + (r.painters_count || 1), 0);
    return {
      remaining: Math.max(0, partyMax - booked),
      max: partyMax,
      booked,
      hasPartyBooking,
      remainingBookings: maxConcurrentParties - partyRows.length,
      maxBookings: maxConcurrentParties,
    };
  }

  // Open/painting bookings: front-only capacity if a party occupies the back area
  const max = hasPartyBooking ? openRestrictedMax : openFullMax;
  const booked = openRows.reduce((sum, r) => sum + (r.painters_count || 1), 0);
  const maxBookings = hasPartyBooking ? DEFAULT_RESTRICTED_MAX_BOOKINGS[studio] : DEFAULT_MAX_BOOKINGS[studio];
  const remainingSeats = Math.max(0, max - booked);
  const remainingBookings = Math.max(0, maxBookings - openRows.length);
  return { remaining: remainingSeats, max, booked, hasPartyBooking, remainingBookings, maxBookings };
}
