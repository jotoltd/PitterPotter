import { BookingInquiry, Staff } from '../types';
import { supabase, isSupabaseEnabled } from './supabase';

const MAX_PAINTERS: Record<'Putney' | 'Wimbledon', number> = { Putney: 30, Wimbledon: 50 };

const functionUrl = (name: string) => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`;

export function toBookingInquiry(row: any): BookingInquiry {
  return {
    id: row.booking_id,
    studio: row.studio,
    name: row.name,
    email: row.email,
    phone: row.phone,
    date: row.date,
    time: row.time,
    paintersCount: row.painters_count,
    sessionType: row.session_type,
    notes: row.notes || undefined,
    status: row.status,
    requestDate: row.request_date,
    estimatedPrice: row.estimated_price ? Number(row.estimated_price) : undefined,
    source: row.source || undefined,
    giftCardCode: row.gift_card_code || undefined,
    giftCardDiscount: row.gift_card_discount ? Number(row.gift_card_discount) : undefined,
    finalPrice: row.final_price ? Number(row.final_price) : undefined,
  };
}

export function toBookingRow(booking: BookingInquiry): any {
  return {
    booking_id: booking.id,
    studio: booking.studio,
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    date: booking.date,
    time: booking.time,
    painters_count: booking.paintersCount,
    session_type: booking.sessionType,
    notes: booking.notes || null,
    status: booking.status,
    request_date: booking.requestDate,
    estimated_price: booking.estimatedPrice ?? null,
    source: booking.source || null,
    gift_card_code: booking.giftCardCode || null,
    gift_card_discount: booking.giftCardDiscount ?? null,
    final_price: booking.finalPrice ?? null,
  };
}

export async function loadBookings(staff?: Staff | null): Promise<BookingInquiry[]> {
  if (!isSupabaseEnabled()) return [];
  if (!staff) return [];

  const response = await fetch(functionUrl('admin-bookings'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      action: 'load',
      username: staff.username,
      sessionToken: staff.sessionToken,
    }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    console.error('Failed to load bookings:', data.error);
    throw new Error(data.error || 'Failed to load bookings');
  }
  return data as BookingInquiry[];
}

export async function getRemainingCapacity(studio: 'Putney' | 'Wimbledon', date: string, time: string): Promise<number> {
  if (!isSupabaseEnabled()) return MAX_PAINTERS[studio];
  const response = await fetch(functionUrl('get-capacity'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ studio, date, time }),
  });
  const data = await response.json();
  if (!response.ok || data.error) {
    console.error('Failed to get capacity:', data.error);
    return MAX_PAINTERS[studio];
  }
  return data.remaining ?? MAX_PAINTERS[studio];
}

export async function createPublicBooking(booking: BookingInquiry): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const { error } = await supabase!.from('bookings').insert(toBookingRow(booking));
  if (error) {
    console.error('Failed to create booking:', error);
    throw new Error('Failed to create booking');
  }
}

export async function createBooking(booking: BookingInquiry, staff?: Staff | null): Promise<void> {
  if (!isSupabaseEnabled()) return;
  if (!staff) throw new Error('Staff required');

  const response = await fetch(functionUrl('admin-bookings'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      action: 'create',
      username: staff.username,
      sessionToken: staff.sessionToken,
      booking,
    }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    console.error('Failed to create booking:', data.error);
    throw new Error(data.error || 'Failed to create booking');
  }
}

export async function updateBooking(booking: BookingInquiry, staff?: Staff | null): Promise<void> {
  if (!isSupabaseEnabled()) return;
  if (!staff) throw new Error('Staff required');

  const response = await fetch(functionUrl('admin-bookings'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      action: 'update',
      username: staff.username,
      sessionToken: staff.sessionToken,
      booking,
    }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    console.error('Failed to update booking:', data.error);
    throw new Error(data.error || 'Failed to update booking');
  }
}

export async function updateBookingStatus(id: string, status: 'pending' | 'confirmed', staff?: Staff | null): Promise<void> {
  if (!isSupabaseEnabled()) return;
  if (!staff) throw new Error('Staff required');

  const response = await fetch(functionUrl('admin-bookings'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      action: 'updateStatus',
      username: staff.username,
      sessionToken: staff.sessionToken,
      id,
      status,
    }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    console.error('Failed to update booking status:', data.error);
    throw new Error(data.error || 'Failed to update booking status');
  }
}

export async function deleteBooking(id: string, staff?: Staff | null): Promise<void> {
  if (!isSupabaseEnabled()) return;
  if (!staff) throw new Error('Staff required');

  const response = await fetch(functionUrl('admin-bookings'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      action: 'delete',
      username: staff.username,
      sessionToken: staff.sessionToken,
      id,
    }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    console.error('Failed to delete booking:', data.error);
    throw new Error(data.error || 'Failed to delete booking');
  }
}
