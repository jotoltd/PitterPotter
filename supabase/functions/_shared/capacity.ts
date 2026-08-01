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

export const DEFAULT_OPEN_CAPACITY: Record<StudioName, number> = { Putney: 32, Wimbledon: 65 };
export const DEFAULT_OPEN_RESTRICTED_CAPACITY: Record<StudioName, number> = { Putney: 15, Wimbledon: 21 };
export const DEFAULT_PARTY_CAPACITY: Record<StudioName, number> = { Putney: 20, Wimbledon: 40 };

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

export interface CapacityResult {
  remaining: number;
  max: number;
  booked: number;
  hasPartyBooking: boolean;
  conflict?: 'party_session_exists';
}

interface BookingRow {
  painters_count?: number;
  session_type?: string;
  booking_id?: string;
}

export async function computeCapacity(
  supabase: SupabaseClient,
  studio: StudioName,
  date: string,
  time: string,
  sessionType: string | undefined,
  excludeBookingId?: string,
): Promise<CapacityResult> {
  const { data, error } = await supabase
    .from('bookings')
    .select('painters_count, session_type, booking_id')
    .eq('studio', studio)
    .eq('date', date)
    .eq('time', time)
    .in('status', ['pending', 'confirmed']);

  if (error) throw error;

  const rows: BookingRow[] = (data || []).filter(
    (r: BookingRow) => !excludeBookingId || r.booking_id !== excludeBookingId
  );
  const incomingIsParty = sessionType ? PARTY_SESSION_TYPES.includes(sessionType) : false;
  const partyRows = rows.filter((r) => PARTY_SESSION_TYPES.includes(r.session_type ?? ''));
  const openRows = rows.filter((r) => !PARTY_SESSION_TYPES.includes(r.session_type ?? ''));
  const hasPartyBooking = partyRows.length > 0;

  // Only one party can use the back area per time slot
  if (incomingIsParty && hasPartyBooking) {
    return { remaining: 0, max: 0, booked: 0, hasPartyBooking: true, conflict: 'party_session_exists' };
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
    const booked = partyRows.reduce((sum, r) => sum + (r.painters_count || 1), 0);
    return { remaining: partyMax - booked, max: partyMax, booked, hasPartyBooking };
  }

  // Open/painting bookings: front-only capacity if a party occupies the back area
  const max = hasPartyBooking ? openRestrictedMax : openFullMax;
  const booked = openRows.reduce((sum, r) => sum + (r.painters_count || 1), 0);
  return { remaining: max - booked, max, booked, hasPartyBooking };
}
