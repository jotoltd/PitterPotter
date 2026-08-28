import { BookingInquiry, GiftCard, AuditLog, Staff } from '../../types';
import { format, parseISO } from 'date-fns';

export const SESSION_LABELS: Record<string, string> = {
  'painting': 'Painting',
  'birthday-party': 'Birthday',
  'baby-shower-hen': 'Baby Shower / Hen',
  'clay-imprints': 'Baby Prints',
  'corporate': 'Corporate',
  'exclusive-hire': 'Exclusive Hire',
};

export const SESSION_BADGE: Record<string, string> = {
  'painting': 'bg-emerald-50 text-emerald-700',
  'birthday-party': 'bg-purple-50 text-purple-700',
  'baby-shower-hen': 'bg-purple-50 text-purple-700',
  'clay-imprints': 'bg-orange-50 text-orange-700',
  'corporate': 'bg-purple-50 text-purple-700',
  'exclusive-hire': 'bg-indigo-50 text-indigo-700',
};

export const ROLE_LABEL: Record<Staff['role'], string> = {
  super_admin: 'Super Admin',
  staff: 'Staff',
};

export const AUDIT_ACTION_LABEL: Record<string, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  update_status: 'Changed status',
  login: 'Logged in',
  logout: 'Logged out',
  backup: 'Backed up',
  restore: 'Restored',
};

export const AUDIT_ENTITY_LABEL: Record<string, string> = {
  booking: 'Booking',
  staff: 'Staff member',
  gift_card: 'Gift card',
  giftcard: 'Gift card',
  page_setting: 'Page setting',
  setting: 'Setting',
  sample_data: 'Sample data',
  content: 'Content',
};

export const AUDIT_ACTION_COLOR: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-700',
  update: 'bg-amber-100 text-amber-700',
  update_status: 'bg-sky-100 text-sky-700',
  delete: 'bg-red-100 text-red-700',
  login: 'bg-[#DBE7E4] text-[#1B2D3C]',
  logout: 'bg-stone-100 text-stone-600',
  backup: 'bg-purple-100 text-purple-700',
  restore: 'bg-purple-100 text-purple-700',
};

export function formatAuditDetails(log: AuditLog): string {
  if (!log.details || typeof log.details !== 'object' || log.details === null) {
    return log.action === 'delete' ? 'Record removed' : '-';
  }
  const details = log.details as Record<string, unknown>;
  const parts: string[] = [];

  if (log.action === 'update_status' && details.status) {
    return `Status changed to ${details.status}`;
  }

  if (details.name && typeof details.name === 'string') parts.push(`Name: ${details.name}`);
  if (details.username && typeof details.username === 'string') parts.push(`Username: ${details.username}`);
  if (details.studio && typeof details.studio === 'string') parts.push(`Studio: ${details.studio}`);
  if (details.date && typeof details.date === 'string') parts.push(`Date: ${details.date}`);
  if (details.time && typeof details.time === 'string') parts.push(`Time: ${details.time}`);
  if (details.role && typeof details.role === 'string') parts.push(`Role: ${ROLE_LABEL[details.role as Staff['role']] || details.role}`);
  if (details.page_key && typeof details.page_key === 'string') parts.push(`Page: ${details.page_key}`);
  if (details.enabled !== undefined) parts.push(`Enabled: ${details.enabled ? 'Yes' : 'No'}`);
  if (details.amount !== undefined) parts.push(`Amount: £${Number(details.amount).toFixed(2)}`);
  if (details.code && typeof details.code === 'string') parts.push(`Code: ${details.code}`);
  if (details.note && typeof details.note === 'string') parts.push(details.note);
  if (details.passwordChanged) parts.push('Password changed');

  if (parts.length === 0) return Object.entries(details).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ');
  return parts.join(' · ');
}

export interface BookingAnalytics {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  popularDates: { date: string; count: number }[];
  bookingsByMonth: { month: string; count: number }[];
  studioCounts: Record<string, number>;
}

export function getBookingAnalytics(inquiries: BookingInquiry[]): BookingAnalytics {
  const total = inquiries.length;
  const confirmed = inquiries.filter((b) => b.status === 'confirmed').length;
  const pending = inquiries.filter((b) => b.status === 'pending').length;
  const cancelled = inquiries.filter((b) => b.status === 'cancelled').length;

  const dateCounts: Record<string, number> = {};
  inquiries.forEach((b) => {
    if (!b.date) return;
    const key = new Date(b.date).toISOString().split('T')[0];
    dateCounts[key] = (dateCounts[key] || 0) + 1;
  });
  const popularDates = Object.entries(dateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([date, count]) => ({ date, count }));

  const monthlyCounts: Record<string, number> = {};
  inquiries.forEach((b) => {
    if (!b.date) return;
    const key = new Date(b.date).toISOString().slice(0, 7);
    monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
  });
  const bookingsByMonth = Object.entries(monthlyCounts)
    .sort()
    .map(([month, count]) => ({ month, count }));

  const studioCounts: Record<string, number> = {};
  inquiries.forEach((b) => {
    const key = b.studio || 'Unknown';
    studioCounts[key] = (studioCounts[key] || 0) + 1;
  });

  return { total, confirmed, pending, cancelled, popularDates, bookingsByMonth, studioCounts };
}

export interface GiftCardAnalytics {
  total: number;
  totalRevenue: number;
  activeBalance: number;
  redeemed: number;
  expired: number;
  active: number;
}

export function getGiftCardAnalytics(giftCards: GiftCard[]): GiftCardAnalytics {
  const total = giftCards.length;
  const totalRevenue = giftCards.reduce((sum, c) => sum + c.amount, 0);
  const activeBalance = giftCards.filter((c) => c.status === 'active').reduce((sum, c) => sum + c.balance, 0);
  const redeemed = giftCards.filter((c) => c.status === 'redeemed').length;
  const expired = giftCards.filter((c) => c.status === 'expired').length;
  const active = giftCards.filter((c) => c.status === 'active').length;
  return { total, totalRevenue, activeBalance, redeemed, expired, active };
}

export function exportBookingsCSV(inquiries: BookingInquiry[]) {
  const headers = ['Reference', 'Name', 'Email', 'Phone', 'Studio', 'Date', 'Time', 'Seats', 'Session Type', 'Status', 'Request Date', 'Notes', 'Final Price'];
  const rows = inquiries.map((inq) => [
    inq.id, inq.name, inq.email, inq.phone, inq.studio, inq.date, inq.time,
    inq.paintersCount, inq.sessionType, inq.status, inq.requestDate || '',
    inq.notes || '', inq.finalPrice || '',
  ]);
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportGiftCardsCSV(giftCards: GiftCard[]) {
  const headers = ['Code', 'Amount', 'Balance', 'Recipient Name', 'Recipient Email', 'Sender Name', 'Status', 'Purchase Date', 'Expiry Date'];
  const rows = giftCards.map((card) => [
    card.code, card.amount, card.balance, card.recipientName, card.recipientEmail,
    card.senderName, card.status, card.purchaseDate, card.expiryDate,
  ]);
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gift_cards_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCollectionStatsCSV(inquiries: BookingInquiry[]) {
  const completed = inquiries.filter(b => b.status === 'completed');
  const headers = ['Reference', 'Name', 'Studio', 'Date', 'Time', 'Painters', 'Collection Status', 'Photos', 'Collected At', 'Phone', 'Email'];
  const rows = completed.map((b) => [
    b.id, b.name, b.studio, b.date, b.time, b.paintersCount,
    b.collectionStatus ?? 'painted',
    b.photos?.length ?? 0,
    b.collectedAt ? format(parseISO(b.collectedAt), 'dd/MM/yyyy HH:mm') : '',
    b.phone ?? '', b.email ?? '',
  ]);
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `collection_stats_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export const BACKUP_TABLE_OPTIONS = [
  { label: 'Staff', value: 'staff' },
  { label: 'Staff Sessions', value: 'staff_sessions' },
  { label: 'Bookings', value: 'bookings' },
  { label: 'Gift Cards', value: 'gift_cards' },
  { label: 'Settings', value: 'settings' },
  { label: 'CMS Content', value: 'content' },
  { label: 'Capacity', value: 'capacity' },
  { label: 'Audit Logs', value: 'audit_logs' },
  { label: 'Page Visibility', value: 'page_settings' },
];
