import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Users, Clock, CheckCircle, CalendarDays, MapPin, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Phone, Mail, FileText, Gift, AlertCircle, Plus } from 'lucide-react';
import { BookingInquiry } from '../types';
import WimbledonFloorPlan from './WimbledonFloorPlan';
import PutneyFloorPlan from './PutneyFloorPlan';

interface DashboardOverviewProps {
  bookings: BookingInquiry[];
  onAssignTable: (bookingId: string, tableId: string | null) => void;
  onConfirm?: (bookingId: string) => void;
  onBulkConfirm?: (bookingIds: string[]) => void;
  onNavigateToBookings?: () => void;
  onNavigateToAddBooking?: () => void;
}

const SESSION_LABELS: Record<string, string> = {
  'painting': 'Painting',
  'birthday-party': 'Birthday',
  'baby-shower-hen': 'Baby Shower / Hen',
  'clay-imprints': 'Clay Imprints',
  'corporate': 'Corporate',
};

const TIME_ORDER = ['10:00', '10:30', '12:00', '12:30', '14:00', '14:30', '16:00', '16:30', '10:00-12:00', '12:30-14:30', '15:00-17:00'];

const SESSION_BADGE: Record<string, string> = {
  'painting': 'bg-blue-50 text-blue-700',
  'birthday-party': 'bg-pink-50 text-pink-700',
  'baby-shower-hen': 'bg-purple-50 text-purple-700',
  'clay-imprints': 'bg-orange-50 text-orange-700',
  'corporate': 'bg-slate-100 text-slate-700',
};

function BookingRow({ b, onConfirm }: { b: BookingInquiry; onConfirm?: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${b.status === 'pending' ? 'border-amber-200 bg-amber-50/30' : 'border-[#1B2D3C]/10 bg-[#F8FAFB]'}`}>
      <div className="flex items-center justify-between px-3 py-2 gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className={`shrink-0 w-2 h-2 rounded-full ${b.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
          <span className="text-xs font-bold text-[#1B2D3C] truncate">{b.name}</span>
          <span className="text-[10px] text-[#1B2D3C]/50 font-semibold shrink-0">{b.paintersCount}p</span>
          <span className={`hidden sm:inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${SESSION_BADGE[b.sessionType] ?? 'bg-gray-100 text-gray-600'}`}>
            {SESSION_LABELS[b.sessionType] ?? b.sessionType}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {b.tableId ? (
            <span className="px-2 py-0.5 bg-[#1B2D3C] text-white text-[10px] font-bold rounded">{b.tableId}</span>
          ) : (
            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded">No table</span>
          )}
          {b.status === 'pending' && onConfirm && (
            <button
              onClick={() => onConfirm(b.id)}
              className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded transition-all cursor-pointer"
            >
              <CheckCircle className="w-3 h-3" /> Confirm
            </button>
          )}
          {b.status === 'confirmed' && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <CheckCircle className="w-3 h-3" />
            </span>
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1 rounded hover:bg-[#1B2D3C]/5 transition-all cursor-pointer"
            title="Show details"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-[#1B2D3C]/50" /> : <ChevronDown className="w-3.5 h-3.5 text-[#1B2D3C]/50" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-[#1B2D3C]/5 space-y-1.5 bg-white/60">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {b.phone && (
              <span className="flex items-center gap-1 text-[10px] text-[#1B2D3C]/70 font-semibold">
                <Phone className="w-3 h-3" />{b.phone}
              </span>
            )}
            {b.email && (
              <span className="flex items-center gap-1 text-[10px] text-[#1B2D3C]/70 font-semibold">
                <Mail className="w-3 h-3" />{b.email}
              </span>
            )}
            {b.giftCardCode && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                <Gift className="w-3 h-3" />Gift card: {b.giftCardCode}
              </span>
            )}
          </div>
          {b.notes && (
            <p className="flex items-start gap-1 text-[10px] text-[#1B2D3C]/70 font-semibold">
              <FileText className="w-3 h-3 mt-0.5 shrink-0" />{b.notes}
            </p>
          )}
          <p className="text-[9px] text-[#1B2D3C]/30 font-mono">Ref: {b.id}</p>
        </div>
      )}
    </div>
  );
}

export default function DashboardOverview({ bookings, onAssignTable, onConfirm, onBulkConfirm, onNavigateToBookings, onNavigateToAddBooking }: DashboardOverviewProps) {
  const [viewDate, setViewDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [floorStudio, setFloorStudio] = useState<'Putney' | 'Wimbledon'>('Putney');
  const [floorTime, setFloorTime] = useState('');
  const [bulkConfirming, setBulkConfirming] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  const todayBookings = useMemo(() => bookings.filter(b => b.date === viewDate), [bookings, viewDate]);
  const putneyToday = useMemo(() => todayBookings.filter(b => b.studio === 'Putney'), [todayBookings]);
  const wimbledonToday = useMemo(() => todayBookings.filter(b => b.studio === 'Wimbledon'), [todayBookings]);

  const totalPainters = todayBookings.reduce((s, b) => s + b.paintersCount, 0);
  const pendingToday = todayBookings.filter(b => b.status === 'pending');
  const confirmedCount = todayBookings.filter(b => b.status === 'confirmed').length;
  const unassignedCount = todayBookings.filter(b => !b.tableId).length;

  const slotsByStudio = useMemo(() => {
    const group: Record<'Putney' | 'Wimbledon', Record<string, BookingInquiry[]>> = { Putney: {}, Wimbledon: {} };
    todayBookings.forEach(b => {
      if (!group[b.studio][b.time]) group[b.studio][b.time] = [];
      group[b.studio][b.time].push(b);
    });
    return group;
  }, [todayBookings]);

  const allTimesForStudio = (studio: 'Putney' | 'Wimbledon') =>
    TIME_ORDER.filter(t => slotsByStudio[studio][t]);

  const shiftDate = (days: number) => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + days);
    setViewDate(format(d, 'yyyy-MM-dd'));
  };

  const floorTimesForDate = [...new Set(
    bookings.filter(b => b.studio === floorStudio && b.date === viewDate).map(b => b.time)
  )].sort();

  const handleBulkConfirm = async () => {
    if (!onBulkConfirm || pendingToday.length === 0) return;
    setBulkConfirming(true);
    await onBulkConfirm(pendingToday.map(b => b.id));
    setBulkConfirming(false);
  };

  return (
    <div className="space-y-8">

      {/* Date nav */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => shiftDate(-1)} className="p-2 border border-[#1B2D3C]/20 rounded-lg hover:bg-[#DBE7E4] transition-all cursor-pointer">
            <ChevronLeft className="w-4 h-4 text-[#1B2D3C]" />
          </button>
          <div className="text-center">
            <p className="font-heading font-black text-[#1B2D3C] text-lg">
              {viewDate === today ? 'Today' : format(new Date(viewDate), 'EEEE')}
            </p>
            <p className="text-xs text-[#1B2D3C]/60 font-semibold">{format(new Date(viewDate), 'do MMMM yyyy')}</p>
          </div>
          <button onClick={() => shiftDate(1)} className="p-2 border border-[#1B2D3C]/20 rounded-lg hover:bg-[#DBE7E4] transition-all cursor-pointer">
            <ChevronRight className="w-4 h-4 text-[#1B2D3C]" />
          </button>
          {viewDate !== today && (
            <button onClick={() => setViewDate(today)} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-[#1B2D3C]/20 rounded-lg hover:bg-[#DBE7E4] transition-all cursor-pointer text-[#1B2D3C]">
              Today
            </button>
          )}
        </div>
        <input
          type="date"
          value={viewDate}
          onChange={e => setViewDate(e.target.value)}
          className="px-3 py-2 border border-[#1B2D3C]/20 text-xs font-bold text-[#1B2D3C] rounded-lg focus:outline-none bg-white"
        />
      </div>

      {/* Pending action banner */}
      {pendingToday.length > 0 && (
        <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-sm font-bold text-amber-800">
              {pendingToday.length} pending booking{pendingToday.length !== 1 ? 's' : ''} need{pendingToday.length === 1 ? 's' : ''} confirmation for {viewDate === today ? 'today' : format(new Date(viewDate), 'do MMM')}
            </p>
          </div>
          {onBulkConfirm && (
            <button
              onClick={handleBulkConfirm}
              disabled={bulkConfirming}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              {bulkConfirming ? 'Confirming…' : `Confirm All ${pendingToday.length}`}
            </button>
          )}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#1B2D3C]/20 rounded-xl p-4 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]/50">Bookings</p>
          <p className="text-3xl font-black text-[#1B2D3C]">{todayBookings.length}</p>
          <p className="text-[10px] text-[#1B2D3C]/50 font-semibold">{putneyToday.length} Putney · {wimbledonToday.length} Wimbledon</p>
        </div>
        <div className="bg-white border border-[#1B2D3C]/20 rounded-xl p-4 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]/50">Painters</p>
          <p className="text-3xl font-black text-[#1B2D3C]">{totalPainters}</p>
          <p className="text-[10px] text-[#1B2D3C]/50 font-semibold">across all sessions</p>
        </div>
        <div className={`border rounded-xl p-4 space-y-1 ${pendingToday.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-[#1B2D3C]/20'}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600/80">Pending</p>
          <p className="text-3xl font-black text-amber-600">{pendingToday.length}</p>
          <p className="text-[10px] text-[#1B2D3C]/50 font-semibold">{confirmedCount} confirmed</p>
        </div>
        <div className={`border rounded-xl p-4 space-y-1 ${unassignedCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-[#1B2D3C]/20'}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]/50">No Table</p>
          <p className={`text-3xl font-black ${unassignedCount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{unassignedCount}</p>
          <p className="text-[10px] text-[#1B2D3C]/50 font-semibold">{todayBookings.length - unassignedCount} assigned</p>
        </div>
      </div>

      {/* Time slot tables — two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(['Putney', 'Wimbledon'] as const).map(studio => {
          const studioBookings = studio === 'Putney' ? putneyToday : wimbledonToday;
          const studioPending = studioBookings.filter(b => b.status === 'pending').length;
          return (
            <div key={studio} className="bg-white border border-[#1B2D3C]/20 rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-[#1B2D3C] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-white/70" />
                  <h3 className="font-heading font-black text-white text-sm">{studio} Studio</h3>
                  {studioPending > 0 && (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-black bg-amber-400 text-white rounded-full">
                      {studioPending} pending
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-white/70">
                  {studioBookings.length} booking{studioBookings.length !== 1 ? 's' : ''} · {studioBookings.reduce((s, b) => s + b.paintersCount, 0)} painters
                </span>
              </div>

              {allTimesForStudio(studio).length === 0 ? (
                <div className="px-5 py-10 text-center space-y-3">
                  <CalendarDays className="w-8 h-8 text-[#1B2D3C]/15 mx-auto" />
                  <p className="text-xs text-[#1B2D3C]/40 font-semibold">No bookings for {studio} on this date</p>
                  {onNavigateToAddBooking && (
                    <button onClick={onNavigateToAddBooking} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold border border-[#1B2D3C]/20 rounded-lg hover:bg-[#DBE7E4] transition-all cursor-pointer text-[#1B2D3C]">
                      <Plus className="w-3 h-3" /> Add booking
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-[#1B2D3C]/5">
                  {allTimesForStudio(studio).map(time => {
                    const slotBookings = slotsByStudio[studio][time] || [];
                    const painters = slotBookings.reduce((s, b) => s + b.paintersCount, 0);
                    const slotPending = slotBookings.filter(b => b.status === 'pending').length;
                    return (
                      <div key={time} className="px-4 py-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-[#1B2D3C]/40" />
                            <span className="text-xs font-black text-[#1B2D3C]">{time}</span>
                            {slotPending > 0 && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded-full">{slotPending} pending</span>
                            )}
                          </div>
                          <span className="text-[10px] font-semibold text-[#1B2D3C]/40">{painters}p · {slotBookings.length} booking{slotBookings.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="space-y-1.5">
                          {slotBookings.map(b => (
                            <BookingRow key={b.id} b={b} onConfirm={onConfirm} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state for whole day */}
      {todayBookings.length === 0 && (
        <div className="bg-white border border-[#1B2D3C]/10 rounded-xl px-8 py-14 text-center space-y-4">
          <CalendarDays className="w-12 h-12 text-[#1B2D3C]/10 mx-auto" />
          <p className="text-sm font-bold text-[#1B2D3C]/40">No bookings for {viewDate === today ? 'today' : format(new Date(viewDate), 'EEEE do MMMM')}</p>
          <div className="flex items-center justify-center gap-3">
            {onNavigateToAddBooking && (
              <button onClick={onNavigateToAddBooking} className="flex items-center gap-2 px-4 py-2 bg-[#1B2D3C] text-white text-xs font-bold rounded-lg hover:bg-[#1B2D3C]/80 transition-all cursor-pointer">
                <Plus className="w-4 h-4" /> Add Booking
              </button>
            )}
            {onNavigateToBookings && (
              <button onClick={onNavigateToBookings} className="flex items-center gap-2 px-4 py-2 border border-[#1B2D3C]/20 text-[#1B2D3C] text-xs font-bold rounded-lg hover:bg-[#DBE7E4] transition-all cursor-pointer">
                View All Bookings
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floor plan section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-heading font-black text-[#1B2D3C] text-base uppercase tracking-wider flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Floor Plan — {format(new Date(viewDate), 'do MMM')}
          </h2>
          <div className="flex gap-2">
            {(['Putney', 'Wimbledon'] as const).map(s => (
              <button
                key={s}
                onClick={() => { setFloorStudio(s); setFloorTime(''); }}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer rounded-lg ${
                  floorStudio === s ? 'bg-[#1B2D3C] text-white border-[#1B2D3C]' : 'bg-white text-[#1B2D3C] border-[#1B2D3C]/20 hover:border-[#1B2D3C]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {floorTimesForDate.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFloorTime('')}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border rounded-lg transition-all cursor-pointer ${
                floorTime === '' ? 'bg-[#1B2D3C] text-white border-[#1B2D3C]' : 'bg-white text-[#1B2D3C] border-[#1B2D3C]/20 hover:border-[#1B2D3C]'
              }`}
            >
              All slots
            </button>
            {floorTimesForDate.map(t => (
              <button
                key={t}
                onClick={() => setFloorTime(t)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border rounded-lg transition-all cursor-pointer ${
                  floorTime === t ? 'bg-[#1B2D3C] text-white border-[#1B2D3C]' : 'bg-white text-[#1B2D3C] border-[#1B2D3C]/20 hover:border-[#1B2D3C]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {floorStudio === 'Putney' ? (
          <PutneyFloorPlan bookings={bookings} selectedDate={viewDate} selectedTime={floorTime || undefined} readOnly showTablePanel />
        ) : (
          <WimbledonFloorPlan bookings={bookings} selectedDate={viewDate} selectedTime={floorTime || undefined} readOnly showTablePanel />
        )}
      </div>

      {/* Upcoming 7 days */}
      <div className="bg-white border border-[#1B2D3C]/20 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#1B2D3C]/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#1B2D3C]" />
            <h3 className="font-heading font-black text-[#1B2D3C] text-sm">Next 7 Days</h3>
          </div>
          {onNavigateToBookings && (
            <button onClick={onNavigateToBookings} className="text-[10px] font-bold text-[#1B2D3C]/50 hover:text-[#1B2D3C] underline transition-all cursor-pointer">
              View all →
            </button>
          )}
        </div>
        <div className="divide-y divide-[#1B2D3C]/5">
          {Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() + i);
            const dateStr = format(d, 'yyyy-MM-dd');
            const dayBookings = bookings.filter(b => b.date === dateStr);
            const painters = dayBookings.reduce((s, b) => s + b.paintersCount, 0);
            const pending = dayBookings.filter(b => b.status === 'pending').length;
            return (
              <button
                key={dateStr}
                onClick={() => setViewDate(dateStr)}
                className={`w-full px-5 py-3 flex items-center justify-between hover:bg-[#F8FAFB] transition-all cursor-pointer text-left ${viewDate === dateStr ? 'bg-[#DBE7E4]/40 border-l-2 border-[#1B2D3C]' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14">
                    <p className="text-xs font-black text-[#1B2D3C]">{i === 0 ? 'Today' : format(d, 'EEE')}</p>
                    <p className="text-[10px] text-[#1B2D3C]/50 font-semibold">{format(d, 'd MMM')}</p>
                  </div>
                  {dayBookings.length > 0 ? (
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#1B2D3C]">
                        <Users className="w-3 h-3" />{dayBookings.length}
                      </span>
                      <span className="text-[10px] font-semibold text-[#1B2D3C]/50">{painters} painters</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-[#1B2D3C]/25 font-semibold">No bookings</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {pending > 0 && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">{pending} pending</span>
                  )}
                  {dayBookings.length > 0 && pending === 0 && (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
