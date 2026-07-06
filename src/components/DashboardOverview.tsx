import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { BookingInquiry } from '../types';
import AdminCalendar from './AdminCalendar';

interface DashboardOverviewProps {
  bookings: BookingInquiry[];
  onAssignTable: (bookingId: string, tableId: string | null) => void;
  onConfirm?: (bookingId: string) => void;
  onBulkConfirm?: (bookingIds: string[]) => void;
  onNavigateToBookings?: (date?: string) => void;
  onNavigateToAddBooking?: () => void;
}

export default function DashboardOverview({ bookings, onAssignTable, onConfirm, onBulkConfirm, onNavigateToBookings, onNavigateToAddBooking }: DashboardOverviewProps) {
  const [viewDate, setViewDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  return (
    <div className="space-y-6">
      {/* Big calendar */}
      <AdminCalendar
        bookings={bookings}
        selectedDate={new Date(viewDate)}
        onSelectDate={(date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          setViewDate(dateStr);
          onNavigateToBookings?.(dateStr);
        }}
        month={calendarMonth}
        onMonthChange={setCalendarMonth}
      />
    </div>
  );
}
