import type { AdminSupabaseClient, StaffRecord } from './types.ts';

export async function verifyStaff(
  supabase: AdminSupabaseClient,
  username: string,
  sessionToken: string,
): Promise<StaffRecord | null> {
  // Try the multi-session staff_sessions table first
  const { data: sessionRow, error: sessionError } = await supabase
    .from('staff_sessions')
    .select('staff_id')
    .eq('session_token', sessionToken)
    .maybeSingle();

  if (!sessionError && sessionRow) {
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .eq('id', sessionRow.staff_id)
      .eq('username', username)
      .maybeSingle();

    if (!staffError && staff) {
      return staff as StaffRecord;
    }
  }

  // Fallback: check staff.session_token for backward compatibility
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('username', username)
    .eq('session_token', sessionToken)
    .maybeSingle();

  if (error || !data) return null;
  return data as StaffRecord;
}
