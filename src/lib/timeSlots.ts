export type SlotSessionType = 'painting' | 'baby-prints' | 'party';

const STORAGE_KEY = 'pp_time_slots';

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

export function getSlots(type: SlotSessionType): string[] {
  return loadAll()[type];
}

export function setSlots(type: SlotSessionType, slots: string[]): void {
  const all = loadAll();
  all[type] = slots;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getAllSlots(): Record<SlotSessionType, string[]> {
  return loadAll();
}
