// Resource-based table allocation engine for the web UI.
// Mirrors supabase/functions/_shared/allocation.ts logic but works from local booking data.

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

export interface ResourceBlock {
  table_id?: string;
  table_configuration_id?: string;
  configuration_name?: string;
  blocked_start?: string;
  blocked_end?: string;
}

export interface AllocationRequest {
  studio: StudioName;
  date: string;
  time: string;
  paintersCount: number;
  sessionType: string;
  partyArea?: 'PA1' | 'PA2' | 'PA1+PA2' | null;
  excludeBookingId?: string | null;
}

export interface StudioConfig {
  tables: StudioTable[];
  configurations: TableConfiguration[];
  partySetupBufferMinutes: number;
  partyCleanupBufferMinutes: number;
  normalSessionMinutes: number;
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
  resources: ResourceBlock[];
  reason?: string;
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

const WIMBLEDON_TABLES: StudioTable[] = [
  { id: 'w-t1', studio: 'Wimbledon', table_id: 'T1', area: 'FRONT', table_type: 'SMALL_SQUARE', width_cm: 75, length_cm: 75, min_capacity: 1, max_capacity: 3, joinable: false, join_group: null, label: 'T1', sort_order: 1, active: true },
  { id: 'w-t2', studio: 'Wimbledon', table_id: 'T2', area: 'FRONT', table_type: 'LARGE_RECTANGLE', width_cm: 75, length_cm: 125, min_capacity: 1, max_capacity: 5, joinable: false, join_group: null, label: 'T2', sort_order: 2, active: true },
  { id: 'w-t3', studio: 'Wimbledon', table_id: 'T3', area: 'FRONT', table_type: 'LARGE_RECTANGLE', width_cm: 75, length_cm: 125, min_capacity: 1, max_capacity: 5, joinable: false, join_group: null, label: 'T3', sort_order: 3, active: true },
  { id: 'w-t4', studio: 'Wimbledon', table_id: 'T4', area: 'FRONT', table_type: 'LARGE_RECTANGLE', width_cm: 75, length_cm: 125, min_capacity: 1, max_capacity: 5, joinable: false, join_group: null, label: 'T4', sort_order: 4, active: true },
  { id: 'w-t5', studio: 'Wimbledon', table_id: 'T5', area: 'FRONT', table_type: 'LARGE_RECTANGLE', width_cm: 75, length_cm: 125, min_capacity: 1, max_capacity: 4, joinable: true, join_group: 'front_flex', label: 'T5', sort_order: 5, active: true },
  { id: 'w-t6', studio: 'Wimbledon', table_id: 'T6', area: 'FRONT', table_type: 'SMALL_SQUARE', width_cm: 75, length_cm: 75, min_capacity: 1, max_capacity: 2, joinable: true, join_group: 'front_flex', label: 'T6', sort_order: 6, active: true },
  { id: 'w-t7', studio: 'Wimbledon', table_id: 'T7', area: 'FRONT', table_type: 'LARGE_RECTANGLE', width_cm: 75, length_cm: 125, min_capacity: 1, max_capacity: 4, joinable: true, join_group: 'front_flex', label: 'T7', sort_order: 7, active: true },
  { id: 'w-t8', studio: 'Wimbledon', table_id: 'T8', area: 'FRONT', table_type: 'SMALL_SQUARE', width_cm: 75, length_cm: 75, min_capacity: 1, max_capacity: 2, joinable: true, join_group: 'front_flex', label: 'T8', sort_order: 8, active: true },
  { id: 'w-t9', studio: 'Wimbledon', table_id: 'T9', area: 'FRONT', table_type: 'LARGE_RECTANGLE', width_cm: 75, length_cm: 125, min_capacity: 1, max_capacity: 4, joinable: true, join_group: 'front_t9t10', label: 'T9', sort_order: 9, active: true },
  { id: 'w-t10', studio: 'Wimbledon', table_id: 'T10', area: 'FRONT', table_type: 'SMALL_SQUARE', width_cm: 75, length_cm: 75, min_capacity: 1, max_capacity: 3, joinable: true, join_group: 'front_t9t10', label: 'T10', sort_order: 10, active: true },
  { id: 'w-t11', studio: 'Wimbledon', table_id: 'T11', area: 'BACK', table_type: 'SMALL_SQUARE', width_cm: 75, length_cm: 75, min_capacity: 1, max_capacity: 3, joinable: true, join_group: null, label: 'T11', sort_order: 11, active: true },
  { id: 'w-t12', studio: 'Wimbledon', table_id: 'T12', area: 'BACK', table_type: 'SMALL_SQUARE', width_cm: 75, length_cm: 75, min_capacity: 1, max_capacity: 3, joinable: true, join_group: 'back_left', label: 'T12', sort_order: 12, active: true },
  { id: 'w-t13', studio: 'Wimbledon', table_id: 'T13', area: 'BACK', table_type: 'SMALL_SQUARE', width_cm: 75, length_cm: 75, min_capacity: 1, max_capacity: 3, joinable: true, join_group: 'back_left', label: 'T13', sort_order: 13, active: true },
  { id: 'w-t14', studio: 'Wimbledon', table_id: 'T14', area: 'BACK', table_type: 'LARGE_RECTANGLE', width_cm: 75, length_cm: 125, min_capacity: 1, max_capacity: 5, joinable: true, join_group: 'back_right', label: 'T14', sort_order: 14, active: true },
  { id: 'w-t15', studio: 'Wimbledon', table_id: 'T15', area: 'PARTY_AREA_1', table_type: 'LARGE_RECTANGLE', width_cm: 75, length_cm: 125, min_capacity: 1, max_capacity: 5, joinable: true, join_group: 'party1_core', label: 'T15', sort_order: 15, active: true },
  { id: 'w-t16', studio: 'Wimbledon', table_id: 'T16', area: 'PARTY_AREA_1', table_type: 'LARGE_RECTANGLE', width_cm: 75, length_cm: 125, min_capacity: 1, max_capacity: 5, joinable: true, join_group: 'party1_core', label: 'T16', sort_order: 16, active: true },
  { id: 'w-t17', studio: 'Wimbledon', table_id: 'T17', area: 'PARTY_AREA_2', table_type: 'LARGE_RECTANGLE', width_cm: 75, length_cm: 125, min_capacity: 1, max_capacity: 5, joinable: true, join_group: 'party2_core', label: 'T17', sort_order: 17, active: true },
  { id: 'w-t18', studio: 'Wimbledon', table_id: 'T18', area: 'PARTY_AREA_2', table_type: 'LARGE_RECTANGLE', width_cm: 75, length_cm: 125, min_capacity: 1, max_capacity: 5, joinable: true, join_group: 'party2_core', label: 'T18', sort_order: 18, active: true },
];

const WIMBLEDON_CONFIGURATIONS: TableConfiguration[] = [
  { id: 'wc-t1', studio: 'Wimbledon', name: 'T1', type: 'normal', party_area: null, core_tables: ['T1'], expansion_tables: [], all_tables: ['T1'], min_capacity: 1, max_capacity: 3, sort_order: 1, active: true },
  { id: 'wc-t2', studio: 'Wimbledon', name: 'T2', type: 'normal', party_area: null, core_tables: ['T2'], expansion_tables: [], all_tables: ['T2'], min_capacity: 1, max_capacity: 5, sort_order: 2, active: true },
  { id: 'wc-t3', studio: 'Wimbledon', name: 'T3', type: 'normal', party_area: null, core_tables: ['T3'], expansion_tables: [], all_tables: ['T3'], min_capacity: 1, max_capacity: 5, sort_order: 3, active: true },
  { id: 'wc-t4', studio: 'Wimbledon', name: 'T4', type: 'normal', party_area: null, core_tables: ['T4'], expansion_tables: [], all_tables: ['T4'], min_capacity: 1, max_capacity: 5, sort_order: 4, active: true },
  { id: 'wc-t5', studio: 'Wimbledon', name: 'T5', type: 'normal', party_area: null, core_tables: ['T5'], expansion_tables: [], all_tables: ['T5'], min_capacity: 1, max_capacity: 4, sort_order: 5, active: true },
  { id: 'wc-t6', studio: 'Wimbledon', name: 'T6', type: 'normal', party_area: null, core_tables: ['T6'], expansion_tables: [], all_tables: ['T6'], min_capacity: 1, max_capacity: 2, sort_order: 6, active: true },
  { id: 'wc-t7', studio: 'Wimbledon', name: 'T7', type: 'normal', party_area: null, core_tables: ['T7'], expansion_tables: [], all_tables: ['T7'], min_capacity: 1, max_capacity: 4, sort_order: 7, active: true },
  { id: 'wc-t8', studio: 'Wimbledon', name: 'T8', type: 'normal', party_area: null, core_tables: ['T8'], expansion_tables: [], all_tables: ['T8'], min_capacity: 1, max_capacity: 2, sort_order: 8, active: true },
  { id: 'wc-t9', studio: 'Wimbledon', name: 'T9', type: 'normal', party_area: null, core_tables: ['T9'], expansion_tables: [], all_tables: ['T9'], min_capacity: 1, max_capacity: 4, sort_order: 9, active: true },
  { id: 'wc-t10', studio: 'Wimbledon', name: 'T10', type: 'normal', party_area: null, core_tables: ['T10'], expansion_tables: [], all_tables: ['T10'], min_capacity: 1, max_capacity: 3, sort_order: 10, active: true },
  { id: 'wc-t11', studio: 'Wimbledon', name: 'T11', type: 'normal', party_area: null, core_tables: ['T11'], expansion_tables: [], all_tables: ['T11'], min_capacity: 1, max_capacity: 3, sort_order: 11, active: true },
  { id: 'wc-t12', studio: 'Wimbledon', name: 'T12', type: 'normal', party_area: null, core_tables: ['T12'], expansion_tables: [], all_tables: ['T12'], min_capacity: 1, max_capacity: 3, sort_order: 12, active: true },
  { id: 'wc-t13', studio: 'Wimbledon', name: 'T13', type: 'normal', party_area: null, core_tables: ['T13'], expansion_tables: [], all_tables: ['T13'], min_capacity: 1, max_capacity: 3, sort_order: 13, active: true },
  { id: 'wc-t14', studio: 'Wimbledon', name: 'T14', type: 'normal', party_area: null, core_tables: ['T14'], expansion_tables: [], all_tables: ['T14'], min_capacity: 1, max_capacity: 5, sort_order: 14, active: true },
  { id: 'wc-f5-6', studio: 'Wimbledon', name: 'FRONT_T5_T6', type: 'normal', party_area: null, core_tables: ['T5', 'T6'], expansion_tables: [], all_tables: ['T5', 'T6'], min_capacity: 1, max_capacity: 8, sort_order: 20, active: true },
  { id: 'wc-f5-7', studio: 'Wimbledon', name: 'FRONT_T5_T6_T7', type: 'normal', party_area: null, core_tables: ['T5', 'T6', 'T7'], expansion_tables: [], all_tables: ['T5', 'T6', 'T7'], min_capacity: 1, max_capacity: 12, sort_order: 21, active: true },
  { id: 'wc-f5-8', studio: 'Wimbledon', name: 'FRONT_T5_T6_T7_T8', type: 'normal', party_area: null, core_tables: ['T5', 'T6', 'T7', 'T8'], expansion_tables: [], all_tables: ['T5', 'T6', 'T7', 'T8'], min_capacity: 1, max_capacity: 14, sort_order: 22, active: true },
  { id: 'wc-f9-10', studio: 'Wimbledon', name: 'FRONT_T9_T10', type: 'normal', party_area: null, core_tables: ['T9', 'T10'], expansion_tables: [], all_tables: ['T9', 'T10'], min_capacity: 1, max_capacity: 8, sort_order: 23, active: true },
  { id: 'wc-pa1-9', studio: 'Wimbledon', name: 'PA1_9', type: 'party', party_area: 'PA1', core_tables: ['T15', 'T16'], expansion_tables: [], all_tables: ['T15', 'T16'], min_capacity: 1, max_capacity: 9, sort_order: 30, active: true },
  { id: 'wc-pa1-12', studio: 'Wimbledon', name: 'PA1_12', type: 'party', party_area: 'PA1', core_tables: ['T15', 'T16'], expansion_tables: ['T13'], all_tables: ['T13', 'T15', 'T16'], min_capacity: 1, max_capacity: 12, sort_order: 31, active: true },
  { id: 'wc-pa1-14', studio: 'Wimbledon', name: 'PA1_14', type: 'party', party_area: 'PA1', core_tables: ['T15', 'T16'], expansion_tables: ['T12', 'T13'], all_tables: ['T12', 'T13', 'T15', 'T16'], min_capacity: 1, max_capacity: 14, sort_order: 32, active: true },
  { id: 'wc-pa2-9', studio: 'Wimbledon', name: 'PA2_9', type: 'party', party_area: 'PA2', core_tables: ['T17', 'T18'], expansion_tables: [], all_tables: ['T17', 'T18'], min_capacity: 1, max_capacity: 9, sort_order: 40, active: true },
  { id: 'wc-pa2-14', studio: 'Wimbledon', name: 'PA2_14', type: 'party', party_area: 'PA2', core_tables: ['T17', 'T18'], expansion_tables: ['T14'], all_tables: ['T14', 'T17', 'T18'], min_capacity: 1, max_capacity: 14, sort_order: 41, active: true },
  { id: 'wc-pa1-pa2-28', studio: 'Wimbledon', name: 'PA1_PA2_28', type: 'large_party', party_area: 'PA1+PA2', core_tables: ['T15', 'T16', 'T17', 'T18'], expansion_tables: ['T12', 'T13', 'T14'], all_tables: ['T12', 'T13', 'T14', 'T15', 'T16', 'T17', 'T18'], min_capacity: 15, max_capacity: 28, sort_order: 50, active: true },
];

export function getStaticStudioConfig(studio: StudioName): StudioConfig {
  if (studio === 'Wimbledon') {
    return {
      tables: WIMBLEDON_TABLES,
      configurations: WIMBLEDON_CONFIGURATIONS,
      partySetupBufferMinutes: 0,
      partyCleanupBufferMinutes: 0,
      normalSessionMinutes: 120,
    };
  }
  // Putney fallback: keep old broad capacity model; no per-table allocations yet.
  return {
    tables: [],
    configurations: [],
    partySetupBufferMinutes: 0,
    partyCleanupBufferMinutes: 0,
    normalSessionMinutes: 120,
  };
}

function configurationIsAvailable(
  configuration: TableConfiguration,
  requestWindow: { start: Date; end: Date },
  existingResources: ResourceBlock[]
): boolean {
  for (const tableId of configuration.all_tables) {
    for (const resource of existingResources) {
      if (resource.table_id !== tableId) continue;
      const bStart = new Date(resource.blocked_start);
      const bEnd = new Date(resource.blocked_end);
      if (overlaps(requestWindow.start, requestWindow.end, bStart, bEnd)) {
        return false;
      }
    }
  }
  return true;
}

function scoreConfiguration(configuration: TableConfiguration, request: AllocationRequest): number {
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

function extractResourceBlocks(booking: { date?: string; time?: string; session_type?: string; painters_count?: number; resources?: ResourceBlock[] | null }): ResourceBlock[] {
  if (!booking.date || !booking.time || !booking.session_type || !booking.painters_count) return [];
  if (booking.resources && Array.isArray(booking.resources) && booking.resources.length) {
    return booking.resources;
  }
  // Legacy fallback: if the booking has a table_id string, treat it as a single resource with a 2-hour block.
  // deno-lint-ignore no-explicit-any
  const tableId = (booking as any).table_id;
  if (typeof tableId === 'string' && tableId.trim()) {
    const { startMinutes } = parseTimeRange(booking.time);
    const start = toTimestamp(booking.date, startMinutes);
    const end = new Date(start.getTime() + 120 * 60000);
    return tableId.split(',').map((t) => t.trim()).filter(Boolean).map((tid) => ({
      table_id: tid,
      blocked_start: start.toISOString(),
      blocked_end: end.toISOString(),
    }));
  }
  return [];
}

export function collectExistingResources(
  bookings: Array<{ id?: string; date?: string; time?: string; session_type?: string; painters_count?: number; resources?: ResourceBlock[] | null; table_id?: string }>,
  date: string,
  excludeBookingId?: string | null
): ResourceBlock[] {
  const blocks: ResourceBlock[] = [];
  for (const booking of bookings) {
    if (booking.id && excludeBookingId && booking.id === excludeBookingId) continue;
    if (booking.date !== date) continue;
    blocks.push(...extractResourceBlocks(booking as { date?: string; time?: string; session_type?: string; painters_count?: number; resources?: ResourceBlock[] | null }));
  }
  return blocks;
}

// When no named configuration fits a normal booking, fall back to combining
// free individual tables so groups aren't refused while seats remain.
// Prefers fewest tables, then least wasted seats, then physically adjacent
// tables; party-area tables are used only when nothing else works.
function findTableCombination(
  config: StudioConfig,
  request: AllocationRequest,
  requestWindow: { start: Date; end: Date },
  existingResources: ResourceBlock[]
): StudioTable[] | null {
  if (isPartySessionType(request.sessionType)) return null;

  const free = config.tables.filter((t) => {
    if (!t.active || t.studio !== request.studio) return false;
    return !existingResources.some(
      (r) =>
        r.table_id === t.table_id &&
        overlaps(requestWindow.start, requestWindow.end, new Date(r.blocked_start!), new Date(r.blocked_end!))
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

export function allocateResources(
  request: AllocationRequest,
  existingBookings: Array<{ id?: string; date?: string; time?: string; session_type?: string; painters_count?: number; resources?: ResourceBlock[] | null; table_id?: string }>,
  options: { normalSessionMinutes?: number } = {}
): AllocationResult {
  const studio = request.studio;
  if (studio !== 'Wimbledon') {
    return { success: false, configuration: null, blockedStart: null, blockedEnd: null, resources: [], reason: 'Resource allocation is only enabled for Wimbledon' };
  }

  const config = getStaticStudioConfig(studio);
  if (options.normalSessionMinutes != null) {
    config.normalSessionMinutes = options.normalSessionMinutes;
  }
  const requestWindow = getRequestWindow(request, config);
  const existingResources = collectExistingResources(existingBookings, request.date, request.excludeBookingId);

  const candidates = findValidConfigurations(config, request).filter((c) =>
    configurationIsAvailable(c, requestWindow, existingResources)
  );

  const selected = candidates[0] ?? null;
  if (!selected) {
    const combo = findTableCombination(config, request, requestWindow, existingResources);
    if (combo) {
      return {
        success: true,
        configuration: null,
        blockedStart: requestWindow.start,
        blockedEnd: requestWindow.end,
        resources: combo.map((t) => ({
          table_id: t.table_id,
          blocked_start: requestWindow.start.toISOString(),
          blocked_end: requestWindow.end.toISOString(),
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
  const resources: ResourceBlock[] = selected.all_tables.map((tableId) => ({
    table_id: tableId,
    blocked_start: requestWindow.start.toISOString(),
    blocked_end: requestWindow.end.toISOString(),
  }));

  return {
    success: true,
    configuration: selected,
    blockedStart: requestWindow.start,
    blockedEnd: requestWindow.end,
    resources,
  };
}

export function formatResources(resources?: ResourceBlock[] | null): string {
  if (!resources || !resources.length) return '';
  const tableIds = resources.map((r) => r.table_id).filter(Boolean);
  return Array.from(new Set(tableIds)).join(', ');
}

export function formatConfigurationName(configuration: TableConfiguration | null): string {
  if (!configuration) return '';
  if (configuration.type === 'normal' && configuration.all_tables.length === 1) {
    return configuration.all_tables[0];
  }
  return configuration.name.replace(/_/g, ' ');
}
