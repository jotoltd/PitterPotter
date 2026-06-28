import type { SupabaseClient } from 'supabase';

export type AdminSupabaseClient = SupabaseClient;

export interface StaffRecord {
  id: string;
  name: string;
  username: string;
  password_hash: string;
  role: 'super_admin' | 'admin' | 'staff';
  session_token: string | null;
  session_expires_at: string | null;
  can_update_status: boolean;
  can_edit_bookings: boolean;
  can_add_walk_ins: boolean;
  can_delete_bookings: boolean;
  created_at: string;
}
