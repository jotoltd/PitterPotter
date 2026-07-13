import { supabase, isSupabaseEnabled } from './supabase';

const STORAGE_KEY_HOLIDAYS = 'pp_school_holidays';
const STORAGE_KEY_CLOSED = 'pp_closed_dates';
const SUPABASE_KEY_HOLIDAYS = 'school_holidays';
const SUPABASE_KEY_CLOSED = 'closed_dates';

export interface ClosureDates {
  schoolHolidays: string[];
  closedDates: string[];
}

function loadFromStorage(): ClosureDates {
  try {
    const h = localStorage.getItem(STORAGE_KEY_HOLIDAYS);
    const c = localStorage.getItem(STORAGE_KEY_CLOSED);
    return {
      schoolHolidays: h ? JSON.parse(h) : [],
      closedDates: c ? JSON.parse(c) : [],
    };
  } catch {
    return { schoolHolidays: [], closedDates: [] };
  }
}

function saveToStorage(data: ClosureDates): void {
  try {
    localStorage.setItem(STORAGE_KEY_HOLIDAYS, JSON.stringify(data.schoolHolidays));
    localStorage.setItem(STORAGE_KEY_CLOSED, JSON.stringify(data.closedDates));
  } catch {}
}

export function getClosureDates(): ClosureDates {
  return loadFromStorage();
}

export async function loadClosuresFromSupabase(): Promise<ClosureDates> {
  try {
    if (!isSupabaseEnabled() || !supabase) return loadFromStorage();

    const { data } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', [SUPABASE_KEY_HOLIDAYS, SUPABASE_KEY_CLOSED]);

    if (data && data.length > 0) {
      const map: Record<string, string> = {};
      data.forEach((row: { key: string; value: string }) => { map[row.key] = row.value; });

      const result: ClosureDates = {
        schoolHolidays: map[SUPABASE_KEY_HOLIDAYS] ? JSON.parse(map[SUPABASE_KEY_HOLIDAYS]) : [],
        closedDates: map[SUPABASE_KEY_CLOSED] ? JSON.parse(map[SUPABASE_KEY_CLOSED]) : [],
      };
      saveToStorage(result);
      return result;
    }
  } catch {}
  return loadFromStorage();
}

export async function saveClosuresToSupabase(
  data: ClosureDates,
  username: string,
  sessionToken: string,
): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return;

  const save = async (key: string, value: string) => {
    const res = await fetch(`${supabaseUrl}/functions/v1/admin-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ action: 'update', username, sessionToken, key, value }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Failed to save ${key}`);
    }
  };

  await Promise.all([
    save(SUPABASE_KEY_HOLIDAYS, JSON.stringify(data.schoolHolidays)),
    save(SUPABASE_KEY_CLOSED, JSON.stringify(data.closedDates)),
  ]);
  saveToStorage(data);
}

export function isSchoolHoliday(dateStr: string, schoolHolidays: string[]): boolean {
  return schoolHolidays.includes(dateStr);
}

export function isClosedDate(dateStr: string, closedDates: string[]): boolean {
  return closedDates.includes(dateStr);
}
