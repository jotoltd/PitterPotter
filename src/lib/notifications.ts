import { AppNotification, NotificationType } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function fetchNotifications(staff: { username: string; sessionToken?: string }, limit = 50): Promise<AppNotification[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ action: 'list', username: staff.username, sessionToken: staff.sessionToken, limit }),
  });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  const data = await res.json();
  return (data.notifications || []).map((n: Record<string, unknown>) => ({
    id: n.id as string,
    type: n.type as NotificationType,
    title: n.title as string,
    message: n.message as string,
    entity_type: n.entity_type as string | undefined,
    entity_id: n.entity_id as string | undefined,
    studio: n.studio as string | undefined,
    read_at: n.read_at as string | null | undefined,
    created_at: n.created_at as string,
  }));
}

export async function fetchUnreadCount(staff: { username: string; sessionToken?: string }): Promise<number> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return 0;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ action: 'unreadCount', username: staff.username, sessionToken: staff.sessionToken }),
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count || 0;
}

export async function markNotificationRead(staff: { username: string; sessionToken?: string }, id: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  await fetch(`${SUPABASE_URL}/functions/v1/admin-notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ action: 'markRead', username: staff.username, sessionToken: staff.sessionToken, id }),
  });
}

export async function markAllNotificationsRead(staff: { username: string; sessionToken?: string }): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  await fetch(`${SUPABASE_URL}/functions/v1/admin-notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ action: 'markAllRead', username: staff.username, sessionToken: staff.sessionToken }),
  });
}
