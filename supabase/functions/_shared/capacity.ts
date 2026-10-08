// Shared capacity logic for open (painting) and party bookings.
// Wimbledon now uses the resource-based allocation engine in allocation.ts.
// Putney keeps the previous coarse seat-count model until it is migrated.

import {
  planAllocation,
  largestAvailablePartyCapacity,
  isPartySessionType,
  loadStudioConfigFromDb,
  StudioName,
  PARTY_SESSION_TYPES,
} from './allocation.ts';

export const DEFAULT_MAX_BOOKINGS: Record<StudioName, number> = { Putney: 99, Wimbledon: 17 };
export const DEFAULT_RESTRICTED_MAX_BOOKINGS: Record<StudioName, number> = { Putney: 99, Wimbledon: 10 };
export const DEFAULT_OPEN_CAPACITY: Record<StudioName, number> = { Putney: 32, Wimbledon: 58 };
export const DEFAULT_OPEN_RESTRICTED_CAPACITY: Record<StudioName, number> = { Putney: 15, Wimbledon: 32 };
export const DEFAULT_PARTY_CAPACITY: Record<StudioName, number> = { Putney: 20, Wimbledon: 26 };
export const DEFAULT_SIP_AND_PAINT_CAPACITY: Record<StudioName, number> = { Putney: 32, Wimbledon: 58 };
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
  conflict?: 'party_session_exists' | 'no_valid_configuration';
  allocationReason?: string;
}

interface BookingRow {
  painters_count?: number;
  session_type?: string;
  booking_id?: string;
  time?: string;
  resources?: Array<{ table_id?: string; blocked_start?: string; blocked_end?: string }>;
}

function parseTimeToMinutes(time: string): number {
  const start = time.split('-')[0].trim();
  const [h, m] = start.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function overlapsTwoHours(timeA: string, timeB: string): boolean {
  return Math.abs(parseTimeToMinutes(timeA) - parseTimeToMinutes(timeB)) < 120;
}

function isPartyRow(row: BookingRow): boolean {
  return PARTY_SESSION_TYPES.includes(row.session_type ?? '');
}

// Staff are allowed to overbook (walk-ins, squeezing in regulars), so this
// never blocks a write. It returns a message the admin UI surfaces so that
// going over capacity is a deliberate choice rather than a silent one.
export async function capacityWarning(
  supabase: SupabaseClient,
  booking: {
    studio?: unknown;
    date?: unknown;
    time?: unknown;
    sessionType?: unknown;
    paintersCount?: unknown;
  },
  excludeBookingId?: string,
): Promise<string | null> {
  const studio = booking.studio;
  const date = booking.date;
  const time = booking.time;
  const sessionType = typeof booking.sessionType === 'string' ? booking.sessionType : undefined;
  const seats = Number(booking.paintersCount) || 0;

  if (studio !== 'Putney' && studio !== 'Wimbledon') return null;
  if (typeof date !== 'string' || !date || typeof time !== 'string' || !time) return null;

  try {
    const capacity = await computeCapacity(supabase, studio as StudioName, date, time, sessionType, excludeBookingId, seats);
    const when = `${time} on ${date}`;

    if (capacity.conflict === 'party_session_exists') {
      const spaces = capacity.maxBookings;
      return `${studio} already has the maximum of ${spaces} part${spaces === 1 ? 'y' : 'ies'} booked at ${when}.`;
    }
    if (capacity.conflict === 'no_valid_configuration') {
      return capacity.allocationReason || `No valid ${isPartySessionType(sessionType ?? '') ? 'party' : 'table'} configuration available at ${when}.`;
    }
    if (seats > capacity.remaining) {
      const noun = isPartySessionType(sessionType ?? '') ? 'party seat' : 'seat';
      return `Over capacity: ${seats} ${noun}${seats === 1 ? '' : 's'} booked but only ${capacity.remaining} of ${capacity.max} remain at ${when}.`;
    }
    if (capacity.remainingBookings <= 0) {
      return `Over capacity: ${studio} already has the maximum of ${capacity.maxBookings} bookings at ${when}.`;
    }
    return null;
  } catch (err) {
    console.error('Capacity warning check failed:', err);
    return null;
  }
}

export async function computeCapacity(
  supabase: SupabaseClient,
  studio: StudioName,
  date: string,
  time: string,
  sessionType: string | undefined,
  excludeBookingId?: string,
  paintersCount = 1,
): Promise<CapacityResult> {
  // Wimbledon: use resource-based allocation engine.
  if (studio === 'Wimbledon') {
    const config = await loadStudioConfigFromDb(supabase, studio);
    const incomingIsParty = isPartySessionType(sessionType ?? '');

    // First check if the requested booking itself can be allocated,
    // including moving existing bookings to free space.
    const plan = await planAllocation(supabase, {
      studio,
      date,
      time,
      paintersCount,
      sessionType: sessionType ?? '',
      excludeBookingId: excludeBookingId ?? null,
    });
    const allocation = plan.result;

    // For party requests, "remaining" is the largest party configuration
    // currently free — not the size of the config chosen for this group.
    let partyCap = { available: 0, total: 0 };
    if (incomingIsParty) {
      partyCap = await largestAvailablePartyCapacity(supabase, {
        studio,
        date,
        time,
        paintersCount,
        sessionType: sessionType ?? '',
        excludeBookingId: excludeBookingId ?? null,
      });
    }

    // Count existing bookings and rough seat usage for display numbers.
    const { data } = await supabase
      .from('bookings')
      .select('painters_count, session_type, booking_id, time, resources')
      .eq('studio', studio)
      .eq('date', date)
      .in('status', ['pending', 'confirmed']);

    const rows: BookingRow[] = (data || [])
      .filter((r: BookingRow) => !excludeBookingId || r.booking_id !== excludeBookingId)
      .filter((r: BookingRow) => r.time != null && overlapsTwoHours(r.time, time));

    const partyRows = rows.filter(isPartyRow);
    const sipRows = rows.filter((r) => r.session_type === 'sip-and-paint');
    const openRows = rows.filter((r) => !isPartyRow(r) && r.session_type !== 'sip-and-paint');
    const hasPartyBooking = partyRows.length > 0;
    const isSipAndPaint = sessionType === 'sip-and-paint';

    // Wimbledon has two party areas, so up to two parties can run at the same
    // time (one per area). Putney has one party area, so one at a time.
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

    // Determine max capacity from DB overrides or defaults.
    const { data: capacityRows } = await supabase
      .from('capacity')
      .select('session_type, max_painters')
      .eq('studio', studio)
      .in('session_type', ['open', 'open_restricted', 'party', 'sip_and_paint']);

    const findMax = (type: string, fallback: number) =>
      (capacityRows || []).find((r: { session_type: string; max_painters: number }) => r.session_type === type)
        ?.max_painters ?? fallback;

    const openFullMax = findMax('open', DEFAULT_OPEN_CAPACITY[studio]);
    const openRestrictedMax = findMax('open_restricted', DEFAULT_OPEN_RESTRICTED_CAPACITY[studio]);
    const sipMax = findMax('sip_and_paint', DEFAULT_SIP_AND_PAINT_CAPACITY[studio]);

    if (!allocation.success) {
      let displayMax = 0;
      if (incomingIsParty) {
        displayMax = partyCap.total;
      } else if (isSipAndPaint) {
        displayMax = sipMax;
      } else {
        displayMax = hasPartyBooking ? openRestrictedMax : openFullMax;
      }
      return {
        // Even if this exact size can't be seated, report the largest party
        // configuration that IS free so the UI can show partial availability.
        remaining: incomingIsParty ? partyCap.available : 0,
        max: displayMax,
        booked: incomingIsParty
          ? partyRows.reduce((sum, r) => sum + (r.painters_count || 1), 0)
          : isSipAndPaint
            ? sipRows.reduce((sum, r) => sum + (r.painters_count || 1), 0)
            : openRows.reduce((sum, r) => sum + (r.painters_count || 1), 0) + sipRows.reduce((sum, r) => sum + (r.painters_count || 1), 0),
        hasPartyBooking,
        remainingBookings: 0,
        maxBookings: incomingIsParty ? DEFAULT_MAX_CONCURRENT_PARTIES[studio] : (hasPartyBooking ? DEFAULT_RESTRICTED_MAX_BOOKINGS[studio] : DEFAULT_MAX_BOOKINGS[studio]),
        conflict: 'no_valid_configuration',
        allocationReason: allocation.reason,
      };
    }

    // Approximate remaining capacity for display purposes.
    // When allocation succeeded we ensure remaining is at least the requested
    // count so the coarse heuristic does not produce a false warning.
    // For parties, remaining seats = largest party area still free (table
    // conflicts already account for what's been booked).
    let baseMax: number;
    if (incomingIsParty) {
      baseMax = partyCap.total || DEFAULT_PARTY_CAPACITY[studio];
    } else if (isSipAndPaint) {
      baseMax = sipMax;
    } else {
      baseMax = hasPartyBooking ? openRestrictedMax : openFullMax;
    }
    const booked = incomingIsParty
      ? partyRows.reduce((sum, r) => sum + (r.painters_count || 1), 0)
      : isSipAndPaint
        ? sipRows.reduce((sum, r) => sum + (r.painters_count || 1), 0)
        : openRows.reduce((sum, r) => sum + (r.painters_count || 1), 0) + sipRows.reduce((sum, r) => sum + (r.painters_count || 1), 0);
    const maxBookings = incomingIsParty
      ? DEFAULT_MAX_CONCURRENT_PARTIES[studio]
      : (hasPartyBooking ? DEFAULT_RESTRICTED_MAX_BOOKINGS[studio] : DEFAULT_MAX_BOOKINGS[studio]);
    const remaining = incomingIsParty
      ? Math.max(paintersCount, partyCap.available)
      : Math.max(paintersCount, baseMax - booked);

    return {
      remaining,
      max: baseMax,
      booked,
      hasPartyBooking,
      remainingBookings: Math.max(0, maxBookings - (incomingIsParty ? partyRows.length : openRows.length + sipRows.length)),
      maxBookings,
    };
  }

  // Putney: previous coarse model.
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
  const isSipAndPaint = sessionType === 'sip-and-paint';
  const partyRows = rows.filter((r) => PARTY_SESSION_TYPES.includes(r.session_type ?? ''));
  const sipRows = rows.filter((r) => r.session_type === 'sip-and-paint');
  const openRows = rows.filter((r) => !PARTY_SESSION_TYPES.includes(r.session_type ?? '') && r.session_type !== 'sip-and-paint');
  const hasPartyBooking = partyRows.length > 0;

  // Wimbledon has two party areas, so up to two parties can run at the same
  // time (one per area). Putney has one party area, so one at a time.
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
    .in('session_type', ['open', 'open_restricted', 'party', 'sip_and_paint']);

  const findMax = (type: string, fallback: number) =>
    (capacityRows || []).find((r: { session_type: string; max_painters: number }) => r.session_type === type)
      ?.max_painters ?? fallback;

  const openFullMax = findMax('open', DEFAULT_OPEN_CAPACITY[studio]);
  const openRestrictedMax = findMax('open_restricted', DEFAULT_OPEN_RESTRICTED_CAPACITY[studio]);
  const partyMax = findMax('party', DEFAULT_PARTY_CAPACITY[studio]);
  const sipMax = findMax('sip_and_paint', DEFAULT_SIP_AND_PAINT_CAPACITY[studio]);

  if (incomingIsParty) {
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

  if (isSipAndPaint) {
    const booked = sipRows.reduce((sum, r) => sum + (r.painters_count || 1), 0);
    const maxBookings = hasPartyBooking ? DEFAULT_RESTRICTED_MAX_BOOKINGS[studio] : DEFAULT_MAX_BOOKINGS[studio];
    return {
      remaining: Math.max(0, sipMax - booked),
      max: sipMax,
      booked,
      hasPartyBooking,
      remainingBookings: Math.max(0, maxBookings - sipRows.length),
      maxBookings,
    };
  }

  const max = hasPartyBooking ? openRestrictedMax : openFullMax;
  const booked = openRows.reduce((sum, r) => sum + (r.painters_count || 1), 0) + sipRows.reduce((sum, r) => sum + (r.painters_count || 1), 0);
  const maxBookings = hasPartyBooking ? DEFAULT_RESTRICTED_MAX_BOOKINGS[studio] : DEFAULT_MAX_BOOKINGS[studio];
  const remainingSeats = Math.max(0, max - booked);
  const remainingBookings = Math.max(0, maxBookings - (openRows.length + sipRows.length));
  return { remaining: remainingSeats, max, booked, hasPartyBooking, remainingBookings, maxBookings };
}
