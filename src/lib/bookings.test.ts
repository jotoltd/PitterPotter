import { describe, it, expect } from 'vitest';
import { toBookingInquiry, toBookingRow } from './bookings';
import { BookingInquiry } from '../types';

describe('toBookingInquiry', () => {
  it('maps a database row to a BookingInquiry', () => {
    const row = {
      booking_id: 'b-123',
      studio: 'Putney',
      name: 'Alice',
      email: 'alice@example.com',
      phone: '07123456789',
      date: '2025-06-01',
      time: '10:00',
      painters_count: 3,
      session_type: 'painting',
      status: 'confirmed',
      source: 'online',
      request_date: '2025-05-01T10:00:00Z',
    };

    const result = toBookingInquiry(row);

    expect(result).toEqual({
      id: 'b-123',
      studio: 'Putney',
      name: 'Alice',
      email: 'alice@example.com',
      phone: '07123456789',
      date: '2025-06-01',
      time: '10:00',
      paintersCount: 3,
      sessionType: 'painting',
      status: 'confirmed',
      source: 'online',
      requestDate: '2025-05-01T10:00:00Z',
    });
  });
});

describe('toBookingRow', () => {
  it('maps a BookingInquiry to a database row', () => {
    const booking: BookingInquiry = {
      id: 'b-456',
      studio: 'Wimbledon',
      name: 'Bob',
      email: 'bob@example.com',
      phone: '07987654321',
      date: '2025-07-15',
      time: '14:00',
      paintersCount: 2,
      sessionType: 'painting',
      status: 'pending',
      source: 'walk-in',
      requestDate: '2025-06-01T12:00:00Z',
    };

    const result = toBookingRow(booking);

    expect(result).toEqual({
      booking_id: 'b-456',
      studio: 'Wimbledon',
      name: 'Bob',
      email: 'bob@example.com',
      phone: '07987654321',
      date: '2025-07-15',
      time: '14:00',
      painters_count: 2,
      session_type: 'painting',
      status: 'pending',
      source: 'walk-in',
      request_date: '2025-06-01T12:00:00Z',
      notes: null,
      estimated_price: null,
      final_price: null,
      gift_card_code: null,
      gift_card_discount: null,
    });
  });
});
