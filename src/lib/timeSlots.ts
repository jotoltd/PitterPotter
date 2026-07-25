import { supabase, isSupabaseEnabled } from './supabase';

export type SlotSessionType = 'painting' | 'baby-prints' | 'party';
export type Studio = 'Putney' | 'Wimbledon';
export type DayType = 'weekday' | 'weekend';

export type StudioSlots = Record<SlotSessionType, Record<DayType, string[]>>;
export type TimeSlotsData = Record<Studio, StudioSlots>;

const STORAGE_KEY = 'pp_time_slots';
const SUPABASE_SETTING_KEY = 'time_slots';

const SINGLE_STUDIO_DEFAULTS: StudioSlots = {
  painting: {
    weekday: ['10:00', '10:30', '12:00', '12:30', '14:00', '14:30', '16:00', '16:30'],
    weekend: ['10:00', '10:30', '12:00', '12:30', '14:00', '14:30', '16:00', '16:30'],
  },
  'baby-prints': {
    weekday: ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'],
    weekend: ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'],
  },
  party: {
    weekday: ['10:00-12:00', '12:30-14:30', '15:00-17:00'],
    weekend: ['10:00-12:00', '12:30-14:30', '15:00-17:00'],
  },
};

export const DEFAULT_SLOTS: TimeSlotsData = {
  Putney: JSON.parse(JSON.stringify(SINGLE_STUDIO_DEFAULTS)),
  Wimbledon: JSON.parse(JSON.stringify(SINGLE_STUDIO_DEFAULTS)),
};

function isLegacySlots(value: unknown): value is Partial<Record<SlotSessionType, string[]>> {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.painting) ||
    Array.isArray(v['baby-prints']) ||
    Array.isArray(v.party)
  );
}

function isDayTypeSlots(value: unknown): value is Partial<Record<DayType, string[]>> {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.weekday) || Array.isArray(v.weekend);
}

function isStudioSlots(value: unknown): value is Partial<TimeSlotsData> {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.Putney !== null && typeof v.Putney === 'object') ||
    (v.Wimbledon !== null && typeof v.Wimbledon === 'object')
  );
}

function migrateOldSessionSlots(slots: unknown, defaults: string[]): Record<DayType, string[]> {
  if (Array.isArray(slots)) {
    return { weekday: sortSlots(slots), weekend: sortSlots(slots) };
  }
  if (isDayTypeSlots(slots)) {
    return {
      weekday: sortSlots(Array.isArray(slots.weekday) ? slots.weekday : defaults),
      weekend: sortSlots(Array.isArray(slots.weekend) ? slots.weekend : defaults),
    };
  }
  return { weekday: sortSlots(defaults), weekend: sortSlots(defaults) };
}

function migrateOldStudioSlots(studio: Partial<Record<SlotSessionType, unknown>> | undefined, defaults: StudioSlots): StudioSlots {
  return {
    painting: migrateOldSessionSlots(studio?.painting, defaults.painting.weekday),
    'baby-prints': migrateOldSessionSlots(studio?.['baby-prints'], defaults['baby-prints'].weekday),
    party: migrateOldSessionSlots(studio?.party, defaults.party.weekday),
  };
}

export function sortSlots(slots: string[]): string[] {
  const parseStart = (s: string) => {
    const start = s.split('-')[0]?.trim() ?? s;
    const [h, m] = start.split(':').map(Number);
    if (!Number.isNaN(h) && !Number.isNaN(m)) return h * 60 + m;
    return Infinity;
  };
  return [...slots].sort((a, b) => parseStart(a) - parseStart(b));
}

function loadAll(): TimeSlotsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isStudioSlots(parsed)) {
        return {
          Putney: migrateOldStudioSlots(parsed.Putney, DEFAULT_SLOTS.Putney),
          Wimbledon: migrateOldStudioSlots(parsed.Wimbledon, DEFAULT_SLOTS.Wimbledon),
        };
      }
      if (isLegacySlots(parsed)) {
        const merged: StudioSlots = {
          painting: migrateOldSessionSlots(parsed.painting, DEFAULT_SLOTS.Putney.painting.weekday),
          'baby-prints': migrateOldSessionSlots(parsed['baby-prints'], DEFAULT_SLOTS.Putney['baby-prints'].weekday),
          party: migrateOldSessionSlots(parsed.party, DEFAULT_SLOTS.Putney.party.weekday),
        };
        return { Putney: JSON.parse(JSON.stringify(merged)), Wimbledon: JSON.parse(JSON.stringify(merged)) };
      }
    }
  } catch {}
  return JSON.parse(JSON.stringify(DEFAULT_SLOTS));
}

function saveAllToLocalStorage(all: TimeSlotsData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export function getSlots(type: SlotSessionType, studio: Studio, dayType: DayType = 'weekday'): string[] {
  return sortSlots(loadAll()[studio][type][dayType]);
}

export function setSlots(type: SlotSessionType, dayType: DayType, slots: string[], studio: Studio): void {
  const all = loadAll();
  all[studio][type][dayType] = sortSlots(slots);
  saveAllToLocalStorage(all);
}

export function getAllSlots(): TimeSlotsData {
  const all = loadAll();
  return JSON.parse(JSON.stringify(all));
}

export function getStudioSlots(studio: Studio): StudioSlots {
  const all = loadAll();
  return JSON.parse(JSON.stringify(all[studio]));
}

export async function loadSlotsFromSupabase(): Promise<TimeSlotsData> {
  try {
    if (!isSupabaseEnabled() || !supabase) return loadAll();

    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', SUPABASE_SETTING_KEY)
      .maybeSingle();

    if (data?.value) {
      const parsed = JSON.parse(data.value);
      if (isStudioSlots(parsed)) {
        const merged: TimeSlotsData = {
          Putney: migrateOldStudioSlots(parsed.Putney, DEFAULT_SLOTS.Putney),
          Wimbledon: migrateOldStudioSlots(parsed.Wimbledon, DEFAULT_SLOTS.Wimbledon),
        };
        saveAllToLocalStorage(merged);
        return merged;
      }
      if (isLegacySlots(parsed)) {
        const studioSlots: StudioSlots = {
          painting: migrateOldSessionSlots(parsed.painting, DEFAULT_SLOTS.Putney.painting.weekday),
          'baby-prints': migrateOldSessionSlots(parsed['baby-prints'], DEFAULT_SLOTS.Putney['baby-prints'].weekday),
          party: migrateOldSessionSlots(parsed.party, DEFAULT_SLOTS.Putney.party.weekday),
        };
        const migrated: TimeSlotsData = { Putney: JSON.parse(JSON.stringify(studioSlots)), Wimbledon: JSON.parse(JSON.stringify(studioSlots)) };
        saveAllToLocalStorage(migrated);
        return migrated;
      }
    }
  } catch {}
  return loadAll();
}

export async function saveSlotsToSupabase(
  all: TimeSlotsData,
  username: string,
  sessionToken: string,
): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return;

  const res = await fetch(`${supabaseUrl}/functions/v1/admin-settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({
      action: 'update',
      username,
      sessionToken,
      key: SUPABASE_SETTING_KEY,
      value: JSON.stringify(all),
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to save time slots');
  }
  saveAllToLocalStorage(all);
}
