import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { X, Users, CheckCircle, MapPin, Phone, Mail, Gift, FileText, CalendarDays } from 'lucide-react';
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

const SESSION_LABELS: Record<string, string> = {
  'painting': 'Painting',
  'birthday-party': 'Birthday Party',
  'baby-shower-hen': 'Baby Shower / Hen',
  'clay-imprints': 'Clay Imprints',
  'corporate': 'Corporate',
};

const SESSION_BADGE: Record<string, string> = {
  'painting': 'bg-blue-100 text-blue-800',
  'birthday-party': 'bg-pink-100 text-pink-800',
  'baby-shower-hen': 'bg-purple-100 text-purple-800',
  'clay-imprints': 'bg-orange-100 text-orange-800',
  'corporate': 'bg-slate-100 text-slate-800',
};

function BookingModal({
  date,
  dayBookings,
  onClose,
  onConfirm,
  onNavigateToAddBooking,
}: {
  date: string;
  dayBookings: BookingInquiry[];
  onClose: () => void;
  onConfirm?: (id: string) => void;
  onNavigateToAddBooking?: () => void;
}) {
  const totalSeats = dayBookings.reduce((s, b) => s + b.paintersCount, 0);
  const pending = dayBookings.filter(b => b.status === 'pending').length;
  const confirmed = dayBookings.filter(b => b.status === 'confirmed').length;
  const cancelled = dayBookings.filter(b => b.status === 'cancelled').length;
  const putney = dayBookings.filter(b => b.studio === 'Putney');
  const wimbledon = dayBookings.filter(b => b.studio === 'Wimbledon');

  const sorted = [...dayBookings].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B2D3C]/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1B2D3C]/10">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-[#1B2D3C]" />
            <div>
              <h2 className="font-heading text-lg font-black text-[#1B2D3C]">
                {format(new Date(date), 'EEEE do MMMM yyyy')}
              </h2>
              <p className="text-[10px] font-bold text-[#1B2D3C]/50 uppercase tracking-wider">
                {dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''} · {totalSeats} seats
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#1B2D3C]/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-[#1B2D3C]" />
          </button>
        </div>

        {/* Summary chips */}
        <div className="grid grid-cols-4 gap-3 px-5 py-4 border-b border-[#1B2D3C]/10">
          <div className="text-center p-2 rounded-lg bg-[#F8FAFB] border border-[#1B2D3C]/10">
            <p className="text-lg font-black text-[#1B2D3C]">{dayBookings.length}</p>
            <p className="text-[9px] font-bold text-[#1B2D3C]/50 uppercase">Bookings</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-[#F8FAFB] border border-[#1B2D3C]/10">
            <p className="text-lg font-black text-[#1B2D3C]">{totalSeats}</p>
            <p className="text-[9px] font-bold text-[#1B2D3C]/50 uppercase">Seats</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-lg font-black text-amber-600">{pending}</p>
            <p className="text-[9px] font-bold text-amber-600/70 uppercase">Pending</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-emerald-50 border border-emerald-200">
            <p className="text-lg font-black text-emerald-600">{confirmed}</p>
            <p className="text-[9px] font-bold text-emerald-600/70 uppercase">Confirmed</p>
          </div>
        </div>

        {/* Studio breakdown */}
        {(putney.length > 0 || wimbledon.length > 0) && (
          <div className="flex items-center gap-4 px-5 py-3 border-b border-[#1B2D3C]/10 text-[10px] font-bold text-[#1B2D3C]/70">
            {putney.length > 0 && (
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Putney: {putney.length}</span>
            )}
            {wimbledon.length > 0 && (
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Wimbledon: {wimbledon.length}</span>
            )}
            {cancelled > 0 && (
              <span className="ml-auto text-stone-400">{cancelled} cancelled</span>
            )}
          </div>
        )}

        {/* Booking list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {sorted.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <CalendarDays className="w-10 h-10 text-[#1B2D3C]/15 mx-auto" />
              <p className="text-sm font-bold text-[#1B2D3C]/40">No bookings for this date</p>
              {onNavigateToAddBooking && (
                <button
                  onClick={() => { onClose(); onNavigateToAddBooking(); }}
                  className="px-4 py-2 bg-[#1B2D3C] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-[#486581] transition-colors"
                >
                  Add booking
                </button>
              )}
            </div>
          ) : (
            sorted.map(b => (
              <div key={b.id} className={`border rounded-xl p-4 ${b.status === 'pending' ? 'border-amber-200 bg-amber-50/30' : b.status === 'cancelled' ? 'border-stone-200 bg-stone-50/50' : 'border-[#1B2D3C]/10 bg-[#F8FAFB]'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading text-sm font-black text-[#1B2D3C]">{b.time}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${SESSION_BADGE[b.sessionType] || 'bg-gray-100 text-gray-700'}`}>
                        {SESSION_LABELS[b.sessionType] || b.sessionType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${b.status === 'pending' ? 'bg-amber-100 text-amber-700' : b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>
                        {b.status}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-[#1B2D3C] mt-1">{b.name}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-semibold text-[#1B2D3C]/70">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {b.paintersCount} seats</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {b.studio}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] font-semibold text-[#1B2D3C]/70">
                      {b.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{b.phone}</span>}
                      {b.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{b.email}</span>}
                      {b.giftCardCode && <span className="flex items-center gap-1 text-emerald-700"><Gift className="w-3 h-3" />{b.giftCardCode}</span>}
                    </div>
                    {b.notes && (
                      <p className="flex items-start gap-1 mt-2 text-[10px] text-[#1B2D3C]/70 font-semibold">
                        <FileText className="w-3 h-3 mt-0.5 shrink-0" />{b.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {b.tableId && (
                      <span className="px-2 py-1 bg-[#1B2D3C] text-white text-[9px] font-bold rounded">{b.tableId}</span>
                    )}
                    {b.status === 'pending' && onConfirm && (
                      <button
                        onClick={() => onConfirm(b.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold rounded transition-colors"
                      >
                        <CheckCircle className="w-3 h-3" /> Confirm
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardOverview({ bookings, onConfirm, onNavigateToAddBooking }: DashboardOverviewProps) {
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [modalDate, setModalDate] = useState<string | null>(null);

  const dayBookings = useMemo(() => {
    if (!modalDate) return [];
    return bookings.filter(b => b.date === modalDate);
  }, [bookings, modalDate]);

  return (
    <div className="space-y-6">
      <AdminCalendar
        bookings={bookings}
        selectedDate={modalDate ? new Date(modalDate) : undefined}
        onSelectDate={(date) => setModalDate(format(date, 'yyyy-MM-dd'))}
        month={calendarMonth}
        onMonthChange={setCalendarMonth}
      />

      {modalDate && (
        <BookingModal
          date={modalDate}
          dayBookings={dayBookings}
          onClose={() => setModalDate(null)}
          onConfirm={onConfirm}
          onNavigateToAddBooking={onNavigateToAddBooking}
        />
      )}
    </div>
  );
}
