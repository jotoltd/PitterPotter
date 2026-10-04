// Resource-based table allocation engine for Pitter Potter Wimbledon.
// Follows the table management spec: per-table occupancy, joinable configurations,
// dedicated party areas, expansion tables, setup/cleanup buffers, and capacity preservation.

export type StudioName = 'Putney' | 'Wimbledon';
export const PARTY_SESSION_TYPES = ['birthday-party', 'baby-shower-hen', 'corporate'];

export interface StudioTable {
  id: string;
  studio: StudioName;
  table_id: string;
  area: string;
  table_type: string;
  width_cm: number | null;
  length_cm: number | null;
  min_capacity: number;
  max_capacity: number;
  joinable: boolean;
  join_group: string | null;
  label: string;
  sort_order: number;
  active: boolean;
}

export interface TableConfiguration {
  id: string;
  studio: StudioName;
  name: string;
  type: 'normal' | 'party' | 'large_party';
  party_area: string | null;
  core_tables: string[];
  expansion_tables: string[];
  all_tables: string[];
  min_capacity: number;
  max_capacity: number;
  sort_order: number;
  active: boolean;
}

export interface BookingResource {
  id?: string;
  booking_id?: string;
  table_configuration_id?: string | null;
  table_id?: string | null;
  blocked_start: Date;
  blocked_end: Date;
}

export interface StudioConfig {
  tables: StudioTable[];
  configurations: TableConfiguration[];
  partySetupBufferMinutes: number;
  partyCleanupBufferMinutes: number;
  normalSessionMinutes: number;
}

export interface AllocationRequest {
  studio: StudioName;
  date: string; // YYYY-MM-DD
  time: string; // 'HH:MM' or 'HH:MM-HH:MM'
  paintersCount: number;
  sessionType: string;
  partyArea?: 'PA1' | 'PA2' | 'PA1+PA2' | null;
  excludeBookingId?: string | null;
}

export interface SelectedConfiguration {
  configuration: TableConfiguration;
  blockedStart: Date;
  blockedEnd: Date;
}

export interface AllocationResult {
  success: boolean;
  configuration: TableConfiguration | null;
  blockedStart: Date | null;
  blockedEnd: Date | null;
  resources: BookingResource[];
  reason?: string;
}

export interface CapacitySnapshot {
  studio: StudioName;
  date: string;
  time: string;
  normalRemaining: number; // rough seat count remaining for normal bookings
  partyRemaining: number;  // rough seat count remaining for party bookings
  availablePartyAreas: string[];
  configurations: TableConfiguration[];
}

export function isPartySessionType(sessionType: string | undefined): boolean {
  if (!sessionType) return false;
  return PARTY_SESSION_TYPES.includes(sessionType);
}

export function parseTimeRange(time: string): { startMinutes: number; endMinutes: number | null } {
  if (!time) return { startMinutes: 0, endMinutes: null };
  const [first, second] = time.split('-').map((t) => t.trim());
  const start = parseSingleTime(first);
  if (second) {
    return { startMinutes: start, endMinutes: parseSingleTime(second) };
  }
  return { startMinutes: start, endMinutes: null };
}

function parseSingleTime(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function toTimestamp(date: string, minutes: number): Date {
  const [y, mo, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, (mo || 1) - 1, d || 1, Math.floor(minutes / 60), minutes % 60, 0, 0));
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function getRequestWindow(
  request: AllocationRequest,
  config: StudioConfig
): { start: Date; end: Date } {
  const { startMinutes, endMinutes } = parseTimeRange(request.time);
  const start = toTimestamp(request.date, startMinutes);
  let end: Date;
  if (endMinutes != null) {
    end = toTimestamp(request.date, endMinutes);
  } else {
    end = new Date(start.getTime() + config.normalSessionMinutes * 60000);
  }
  if (isPartySessionType(request.sessionType)) {
    const bufferedStart = new Date(start.getTime() - config.partySetupBufferMinutes * 60000);
    const bufferedEnd = new Date(end.getTime() + config.partyCleanupBufferMinutes * 60000);
    return { start: bufferedStart, end: bufferedEnd };
  }
  return { start, end };
}

export function loadStudioConfigFromDb(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  studio: StudioName
): Promise<StudioConfig> {
  return loadStudioConfig(supabase, studio, 120);
}

export async function loadStudioConfig(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  studio: StudioName,
  normalSessionMinutes = 120
): Promise<StudioConfig> {
  const [tablesRes, configsRes, settingsRes] = await Promise.all([
    supabase.from('studio_tables').select('*').eq('studio', studio).eq('active', true).order('sort_order', { ascending: true }),
    supabase.from('table_configurations').select('*').eq('studio', studio).eq('active', true).order('sort_order', { ascending: true }),
    supabase.from('settings').select('key, value').in('key', ['party_setup_buffer_minutes', 'party_cleanup_buffer_minutes']),
  ]);

  const tables: StudioTable[] = tablesRes.data || [];
  const configurations: TableConfiguration[] = configsRes.data || [];

  const settings: Record<string, string> = {};
  for (const row of settingsRes.data || []) {
    settings[row.key] = row.value;
  }

  // Fallback to Wimbledon defaults if not configured. Note: `|| 30` would
  // misread an explicit "0" as unset — check for undefined instead.
  const partySetupBufferMinutes = settings['party_setup_buffer_minutes'] !== undefined
    ? Number(settings['party_setup_buffer_minutes']) : 0;
  const partyCleanupBufferMinutes = settings['party_cleanup_buffer_minutes'] !== undefined
    ? Number(settings['party_cleanup_buffer_minutes']) : 0;

  return {
    tables,
    configurations,
    partySetupBufferMinutes,
    partyCleanupBufferMinutes,
    normalSessionMinutes,
  };
}

export async function loadExistingResources(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  studio: StudioName,
  date: string,
  excludeBookingId?: string | null
): Promise<BookingResource[]> {
  // Need bookings on this date at this studio. Since the date column is TEXT, filter exactly.
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, booking_id')
    .eq('studio', studio)
    .eq('date', date)
    .in('status', ['pending', 'confirmed']);

  const bookingIds = (bookings || [])
    // excludeBookingId may be the public booking_id (PP-…) or the row UUID.
    .filter((b: { id: string; booking_id?: string }) =>
      !excludeBookingId || (b.booking_id !== excludeBookingId && b.id !== excludeBookingId))
    .map((b: { id: string }) => b.id);

  if (!bookingIds.length) return [];

  const { data: resources } = await supabase
    .from('booking_resources')
    .select('*')
    .in('booking_id', bookingIds);

  return (resources || []).map((r: BookingResource) => ({
    ...r,
    blocked_start: new Date(r.blocked_start),
    blocked_end: new Date(r.blocked_end),
  }));
}

function configurationIsAvailable(
  configuration: TableConfiguration,
  requestWindow: { start: Date; end: Date },
  existingResources: BookingResource[]
): boolean {
  for (const tableId of configuration.all_tables) {
    for (const resource of existingResources) {
      if (resource.table_id !== tableId) continue;
      if (overlaps(requestWindow.start, requestWindow.end, resource.blocked_start, resource.blocked_end)) {
        return false;
      }
    }
  }
  return true;
}

function scoreConfiguration(
  configuration: TableConfiguration,
  request: AllocationRequest
): number {
  // Lower is better. Prioritise fewer tables, then capacity closest to requested size.
  const tableCount = configuration.all_tables.length;
  const waste = configuration.max_capacity - request.paintersCount;
  return tableCount * 1000 + waste;
}

export function findValidConfigurations(
  config: StudioConfig,
  request: AllocationRequest
): TableConfiguration[] {
  const isParty = isPartySessionType(request.sessionType);
  const candidates = config.configurations.filter((c) => {
    if (!c.active) return false;
    if (c.studio !== request.studio) return false;
    if (isParty) {
      if (c.type !== 'party' && c.type !== 'large_party') return false;
      if (request.partyArea && c.party_area !== request.partyArea) return false;
    } else {
      if (c.type !== 'normal') return false;
    }
    if (request.paintersCount < c.min_capacity) return false;
    if (request.paintersCount > c.max_capacity) return false;
    return true;
  });
  return candidates.sort((a, b) => scoreConfiguration(a, request) - scoreConfiguration(b, request));
}

// When no named configuration fits a normal booking, fall back to combining
// free individual tables so groups aren't refused while seats remain.
// Prefers fewest tables, then least wasted seats, then physically adjacent
// tables; party-area tables are used only when nothing else works.
function findTableCombination(
  config: StudioConfig,
  request: AllocationRequest,
  requestWindow: { start: Date; end: Date },
  existingResources: BookingResource[]
): StudioTable[] | null {
  if (isPartySessionType(request.sessionType)) return null;

  const free = config.tables.filter((t) => {
    if (!t.active || t.studio !== request.studio) return false;
    return !existingResources.some(
      (r) => r.table_id === t.table_id &&
        overlaps(requestWindow.start, requestWindow.end, r.blocked_start, r.blocked_end)
    );
  });

  let best: StudioTable[] | null = null;
  let bestScore = Infinity;
  const combo: StudioTable[] = [];

  const search = (startIdx: number, k: number) => {
    if (k === 0) {
      const cap = combo.reduce((s, t) => s + t.max_capacity, 0);
      if (cap < request.paintersCount) return;
      const waste = cap - request.paintersCount;
      const orders = combo.map((t) => t.sort_order);
      const span = Math.max(...orders) - Math.min(...orders);
      const partyTables = combo.filter((t) => t.area.startsWith('PARTY_AREA')).length;
      const score = waste * 1000 + span * 10 + partyTables;
      if (score < bestScore) {
        bestScore = score;
        best = [...combo];
      }
      return;
    }
    for (let i = startIdx; i <= free.length - k; i++) {
      combo.push(free[i]);
      search(i + 1, k - 1);
      combo.pop();
    }
  };

  for (let k = 1; k <= Math.min(4, free.length) && !best; k++) {
    search(0, k);
  }
  return best;
}

// Pure core: pick a configuration (or free-table combination) against a given
// resource set. No database access.
function allocateCore(
  config: StudioConfig,
  request: AllocationRequest,
  requestWindow: { start: Date; end: Date },
  existingResources: BookingResource[]
): AllocationResult {
  const candidates = findValidConfigurations(config, request).filter((c) =>
    configurationIsAvailable(c, requestWindow, existingResources)
  );

  const selected = candidates[0] ?? null;
  if (selected) {
    return {
      success: true,
      configuration: selected,
      blockedStart: requestWindow.start,
      blockedEnd: requestWindow.end,
      resources: selected.all_tables.map((tableId) => ({
        table_configuration_id: selected.id,
        table_id: tableId,
        blocked_start: requestWindow.start,
        blocked_end: requestWindow.end,
      })),
    };
  }

  const combo = findTableCombination(config, request, requestWindow, existingResources);
  if (combo) {
    return {
      success: true,
      configuration: null,
      blockedStart: requestWindow.start,
      blockedEnd: requestWindow.end,
      resources: combo.map((t) => ({
        table_configuration_id: null,
        table_id: t.table_id,
        blocked_start: requestWindow.start,
        blocked_end: requestWindow.end,
      })),
    };
  }

  const typeLabel = isPartySessionType(request.sessionType) ? 'party area' : 'table';
  return {
    success: false,
    configuration: null,
    blockedStart: null,
    blockedEnd: null,
    resources: [],
    reason: `No available ${typeLabel} configuration can accommodate ${request.paintersCount} people at this time`,
  };
}

export async function allocateResources(
  supabase: unknown,
  request: AllocationRequest,
  options: { normalSessionMinutes?: number } = {}
): Promise<AllocationResult> {
  const studio = request.studio;
  if (studio !== 'Wimbledon') {
    return { success: false, configuration: null, blockedStart: null, blockedEnd: null, resources: [], reason: 'Resource allocation is only enabled for Wimbledon' };
  }

  const config = await loadStudioConfig(supabase as { from: () => unknown }, studio, options.normalSessionMinutes ?? 120);
  const requestWindow = getRequestWindow(request, config);
  const existingResources = await loadExistingResources(supabase as { from: () => unknown }, studio, request.date, request.excludeBookingId);

  return allocateCore(config, request, requestWindow, existingResources);
}

// Largest party configuration currently free for this window — used for
// capacity display so a small party doesn't report the smallest area's size.
export async function largestAvailablePartyCapacity(
  supabase: unknown,
  request: AllocationRequest,
  options: { normalSessionMinutes?: number } = {}
): Promise<{ available: number; total: number }> {
  const studio = request.studio;
  if (studio !== 'Wimbledon') return { available: 0, total: 0 };

  // deno-lint-ignore no-explicit-any
  const sb = supabase as any;
  const config = await loadStudioConfig(sb, studio, options.normalSessionMinutes ?? 120);
  const requestWindow = getRequestWindow(request, config);
  const existingResources = await loadExistingResources(sb, studio, request.date, request.excludeBookingId);

  const partyConfigs = config.configurations.filter(
    (c) => c.active && c.studio === studio && (c.type === 'party' || c.type === 'large_party') &&
      (!request.partyArea || c.party_area === request.partyArea)
  );
  const total = partyConfigs.reduce((m, c) => Math.max(m, c.max_capacity), 0);
  const available = partyConfigs
    .filter((c) => configurationIsAvailable(c, requestWindow, existingResources))
    .reduce((m, c) => Math.max(m, c.max_capacity), 0);
  return { available, total };
}

export interface AllocationMove {
  bookingId: string;
  configuration: TableConfiguration | null;
  resources: BookingResource[];
}

export interface AllocationPlan {
  result: AllocationResult;
  moves: AllocationMove[];
}

// Plans the allocation for a new/edited booking. If it can't be seated
// directly, tries moving each conflicting booking to alternative tables.
// Read-only: nothing is written; write paths use allocateAndApply.
export async function planAllocation(
  supabase: unknown,
  request: AllocationRequest,
  options: { normalSessionMinutes?: number } = {}
): Promise<AllocationPlan> {
  const studio = request.studio;
  if (studio !== 'Wimbledon') {
    return {
      result: { success: false, configuration: null, blockedStart: null, blockedEnd: null, resources: [], reason: 'Resource allocation is only enabled for Wimbledon' },
      moves: [],
    };
  }

  // deno-lint-ignore no-explicit-any
  const sb = supabase as any;
  const config = await loadStudioConfig(sb, studio, options.normalSessionMinutes ?? 120);
  const requestWindow = getRequestWindow(request, config);
  const existingResources = await loadExistingResources(sb, studio, request.date, request.excludeBookingId);

  const result = allocateCore(config, request, requestWindow, existingResources);
  if (result.success) return { result, moves: [] };

  // Bookings whose resources overlap the requested window — moving one of
  // these is the only way to free space.
  const blockerIds = new Set<string>();
  for (const r of existingResources) {
    if (r.booking_id && overlaps(requestWindow.start, requestWindow.end, r.blocked_start, r.blocked_end)) {
      blockerIds.add(r.booking_id);
    }
  }
  if (!blockerIds.size) return { result, moves: [] };

  const { data: rows } = await sb
    .from('bookings')
    .select('id, time, session_type, painters_count')
    .in('id', Array.from(blockerIds));

  for (const row of rows || []) {
    const remaining = existingResources.filter((r: BookingResource) => r.booking_id !== row.id);
    const incoming = allocateCore(config, request, requestWindow, remaining);
    if (!incoming.success) continue;

    const movedRequest: AllocationRequest = {
      studio,
      date: request.date,
      time: row.time,
      paintersCount: Number(row.painters_count) || 1,
      sessionType: row.session_type ?? '',
    };
    const movedWindow = getRequestWindow(movedRequest, config);
    const incomingBlocks: BookingResource[] = incoming.resources.map((r) => ({
      booking_id: '__incoming__',
      table_configuration_id: null,
      table_id: r.table_id,
      blocked_start: r.blocked_start,
      blocked_end: r.blocked_end,
    }));
    const moved = allocateCore(config, movedRequest, movedWindow, [...remaining, ...incomingBlocks]);
    if (!moved.success) continue;

    return {
      result: incoming,
      moves: [{ bookingId: row.id, configuration: moved.configuration, resources: moved.resources }],
    };
  }

  return { result, moves: [] };
}

// Plans the allocation and applies any required reassignments to existing
// bookings. Callers then persist the returned result on their own booking.
export async function allocateAndApply(
  supabase: unknown,
  request: AllocationRequest,
  options: { normalSessionMinutes?: number } = {}
): Promise<AllocationResult> {
  const plan = await planAllocation(supabase, request, options);
  for (const move of plan.moves) {
    await persistAllocation(supabase, move.bookingId, {
      success: true,
      configuration: move.configuration,
      blockedStart: move.resources[0]?.blocked_start ?? null,
      blockedEnd: move.resources[0]?.blocked_end ?? null,
      resources: move.resources,
    });
  }
  return plan.result;
}

export function buildResourcesFromBooking(
  config: StudioConfig,
  booking: { date: string; time: string; session_type: string; painters_count: number },
  configuration: TableConfiguration
): BookingResource[] {
  const request: AllocationRequest = {
    studio: 'Wimbledon' as StudioName,
    date: booking.date,
    time: booking.time,
    paintersCount: booking.painters_count,
    sessionType: booking.session_type,
  };
  const window = getRequestWindow(request, config);
  return configuration.all_tables.map((tableId) => ({
    table_configuration_id: configuration.id,
    table_id: tableId,
    blocked_start: window.start,
    blocked_end: window.end,
  }));
}

export function formatResources(resources: BookingResource[]): string {
  if (!resources.length) return '';
  const tableIds = resources.map((r) => r.table_id).filter(Boolean);
  return Array.from(new Set(tableIds)).join(', ');
}

export async function clearBookingResources(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  bookingId: string
): Promise<void> {
  await supabase.from('booking_resources').delete().eq('booking_id', bookingId);
}

export async function persistAllocation(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  bookingId: string,
  result: AllocationResult
): Promise<void> {
  if (!result.success || !result.resources.length) {
    await clearBookingResources(supabase, bookingId);
    await supabase
      .from('bookings')
      .update({ resources: null, table_id: null })
      .eq('id', bookingId);
    return;
  }
  await clearBookingResources(supabase, bookingId);
  const resourcesPayload = result.resources.map((r) => ({
    booking_id: bookingId,
    table_configuration_id: result.configuration?.id || null,
    table_id: r.table_id,
    blocked_start: r.blocked_start.toISOString(),
    blocked_end: r.blocked_end.toISOString(),
  }));
  const { error } = await supabase.from('booking_resources').insert(resourcesPayload);
  if (error) throw error;

  const resourceSnapshot = result.resources.map((r) => ({
    table_id: r.table_id,
    table_configuration_id: result.configuration?.id || null,
    configuration_name: result.configuration?.name || null,
    blocked_start: r.blocked_start.toISOString(),
    blocked_end: r.blocked_end.toISOString(),
  }));
  const tableIdString = formatResources(result.resources);
  await supabase
    .from('bookings')
    .update({ resources: resourceSnapshot, table_id: tableIdString })
    .eq('id', bookingId);
}
