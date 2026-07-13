import { supabase, isSupabaseEnabled } from './supabase';

export type SlotSessionType = 'painting' | 'baby-prints' | 'party';

const STORAGE_KEY = 'pp_time_slots';
const SUPABASE_SETTING_KEY = 'time_slots';

export const DEFAULT_SLOTS: Record<SlotSessionType, string[]> = {
  painting: ['10:00', '10:30', '12:00', '12:30', '14:00', '14:30', '16:00', '16:30'],
  'baby-prints': ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'],
  party: ['10:00-12:00', '12:30-14:30', '15:00-17:00'],
};

function loadAll(): Record<SlotSessionType, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Record<SlotSessionType, string[]>>;
      return {
        painting: parsed.painting ?? DEFAULT_SLOTS.painting,
        'baby-prints': parsed['baby-prints'] ?? DEFAULT_SLOTS['baby-prints'],
        party: parsed.party ?? DEFAULT_SLOTS.party,
      };
    }
  } catch {}
  return { ...DEFAULT_SLOTS };
}

function saveAllToLocalStorage(all: Record<SlotSessionType, string[]>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export function getSlots(type: SlotSessionType): string[] {
  return loadAll()[type];
}

export function setSlots(type: SlotSessionType, slots: string[]): void {
  const all = loadAll();
  all[type] = slots;
  saveAllToLocalStorage(all);
}

export function getAllSlots(): Record<SlotSessionType, string[]> {
  return loadAll();
}

export async function loadSlotsFromSupabase(): Promise<Record<SlotSessionType, string[]>> {
  try {
    if (!isSupabaseEnabled() || !supabase) return loadAll();

    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', SUPABASE_SETTING_KEY)
      .maybeSingle();

    if (data?.value) {
      const parsed = JSON.parse(data.value) as Partial<Record<SlotSessionType, string[]>>;
      const merged: Record<SlotSessionType, string[]> = {
        painting: Array.isArray(parsed.painting) ? parsed.painting : DEFAULT_SLOTS.painting,
        'baby-prints': Array.isArray(parsed['baby-prints']) ? parsed['baby-prints'] : DEFAULT_SLOTS['baby-prints'],
        party: Array.isArray(parsed.party) ? parsed.party : DEFAULT_SLOTS.party,
      };
      saveAllToLocalStorage(merged);
      return merged;
    }
  } catch {}
  return loadAll();
}

export async function saveSlotsToSupabase(
  all: Record<SlotSessionType, string[]>,
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
