import { supabase, isSupabaseEnabled } from './supabase';

export type SlotSessionType = 'painting' | 'baby-prints' | 'party';
export type Studio = 'Putney' | 'Wimbledon';

export type TimeSlotsData = Record<Studio, Record<SlotSessionType, string[]>>;

const STORAGE_KEY = 'pp_time_slots';
const SUPABASE_SETTING_KEY = 'time_slots';

const SINGLE_STUDIO_DEFAULTS: Record<SlotSessionType, string[]> = {
  painting: ['10:00', '10:30', '12:00', '12:30', '14:00', '14:30', '16:00', '16:30'],
  'baby-prints': ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'],
  party: ['10:00-12:00', '12:30-14:30', '15:00-17:00'],
};

export const DEFAULT_SLOTS: TimeSlotsData = {
  Putney: { ...SINGLE_STUDIO_DEFAULTS },
  Wimbledon: { ...SINGLE_STUDIO_DEFAULTS },
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

function isStudioSlots(value: unknown): value is Partial<TimeSlotsData> {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.Putney !== null && typeof v.Putney === 'object') ||
    (v.Wimbledon !== null && typeof v.Wimbledon === 'object')
  );
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
          Putney: {
            painting: parsed.Putney?.painting ?? DEFAULT_SLOTS.Putney.painting,
            'baby-prints': parsed.Putney?.['baby-prints'] ?? DEFAULT_SLOTS.Putney['baby-prints'],
            party: parsed.Putney?.party ?? DEFAULT_SLOTS.Putney.party,
          },
          Wimbledon: {
            painting: parsed.Wimbledon?.painting ?? DEFAULT_SLOTS.Wimbledon.painting,
            'baby-prints': parsed.Wimbledon?.['baby-prints'] ?? DEFAULT_SLOTS.Wimbledon['baby-prints'],
            party: parsed.Wimbledon?.party ?? DEFAULT_SLOTS.Wimbledon.party,
          },
        };
      }
      if (isLegacySlots(parsed)) {
        const merged: Record<SlotSessionType, string[]> = {
          painting: Array.isArray(parsed.painting) ? parsed.painting : DEFAULT_SLOTS.Putney.painting,
          'baby-prints': Array.isArray(parsed['baby-prints']) ? parsed['baby-prints'] : DEFAULT_SLOTS.Putney['baby-prints'],
          party: Array.isArray(parsed.party) ? parsed.party : DEFAULT_SLOTS.Putney.party,
        };
        return { Putney: { ...merged }, Wimbledon: { ...merged } };
      }
    }
  } catch {}
  return {
    Putney: { ...SINGLE_STUDIO_DEFAULTS },
    Wimbledon: { ...SINGLE_STUDIO_DEFAULTS },
  };
}

function saveAllToLocalStorage(all: TimeSlotsData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export function getSlots(type: SlotSessionType, studio: Studio): string[] {
  return sortSlots(loadAll()[studio][type]);
}

export function setSlots(type: SlotSessionType, slots: string[], studio: Studio): void {
  const all = loadAll();
  all[studio][type] = sortSlots(slots);
  saveAllToLocalStorage(all);
}

export function getAllSlots(): TimeSlotsData {
  const all = loadAll();
  return {
    Putney: {
      painting: sortSlots(all.Putney.painting),
      'baby-prints': sortSlots(all.Putney['baby-prints']),
      party: sortSlots(all.Putney.party),
    },
    Wimbledon: {
      painting: sortSlots(all.Wimbledon.painting),
      'baby-prints': sortSlots(all.Wimbledon['baby-prints']),
      party: sortSlots(all.Wimbledon.party),
    },
  };
}

export function getStudioSlots(studio: Studio): Record<SlotSessionType, string[]> {
  const all = loadAll();
  return {
    painting: sortSlots(all[studio].painting),
    'baby-prints': sortSlots(all[studio]['baby-prints']),
    party: sortSlots(all[studio].party),
  };
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
          Putney: {
            painting: sortSlots(Array.isArray(parsed.Putney?.painting) ? parsed.Putney.painting : DEFAULT_SLOTS.Putney.painting),
            'baby-prints': sortSlots(Array.isArray(parsed.Putney?.['baby-prints']) ? parsed.Putney['baby-prints'] : DEFAULT_SLOTS.Putney['baby-prints']),
            party: sortSlots(Array.isArray(parsed.Putney?.party) ? parsed.Putney.party : DEFAULT_SLOTS.Putney.party),
          },
          Wimbledon: {
            painting: sortSlots(Array.isArray(parsed.Wimbledon?.painting) ? parsed.Wimbledon.painting : DEFAULT_SLOTS.Wimbledon.painting),
            'baby-prints': sortSlots(Array.isArray(parsed.Wimbledon?.['baby-prints']) ? parsed.Wimbledon['baby-prints'] : DEFAULT_SLOTS.Wimbledon['baby-prints']),
            party: sortSlots(Array.isArray(parsed.Wimbledon?.party) ? parsed.Wimbledon.party : DEFAULT_SLOTS.Wimbledon.party),
          },
        };
        saveAllToLocalStorage(merged);
        return merged;
      }
      if (isLegacySlots(parsed)) {
        const merged: Record<SlotSessionType, string[]> = {
          painting: sortSlots(Array.isArray(parsed.painting) ? parsed.painting : DEFAULT_SLOTS.Putney.painting),
          'baby-prints': sortSlots(Array.isArray(parsed['baby-prints']) ? parsed['baby-prints'] : DEFAULT_SLOTS.Putney['baby-prints']),
          party: sortSlots(Array.isArray(parsed.party) ? parsed.party : DEFAULT_SLOTS.Putney.party),
        };
        const migrated: TimeSlotsData = { Putney: { ...merged }, Wimbledon: { ...merged } };
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
