import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Users, CheckCircle, CalendarDays, MapPin, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Phone, Mail, FileText, Gift, AlertCircle, Plus } from 'lucide-react';
import { BookingInquiry } from '../types';
import AdminCalendar from './AdminCalendar';

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
          <span className="text-[10px] text-[#1B2D3C]/50 font-semibold shrink-0">{b.paintersCount}s</span>
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

// Table definitions for daily sheet view
const PUTNEY_MAIN_TABLES = ['T1','T2','T3','T4','T5','T6'];
const PUTNEY_PARTY_TABLES = ['T7','T8','T9','T10'];
const WIMBLEDON_MAIN_TABLES = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10'];
const WIMBLEDON_PARTY1_TABLES = ['T11','T12'];
const WIMBLEDON_PARTY2_TABLES = ['T13','T14','T15','T16','T17'];

function TableCard({ tableId, bookings, onConfirm }: { tableId: string; bookings: BookingInquiry[]; onConfirm?: (id: string) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const isEmpty = bookings.length === 0;
  const hasPending = bookings.some(b => b.status === 'pending');

  return (
    <div className={`border-2 rounded-lg min-h-[90px] flex flex-col transition-all ${
      isEmpty ? 'border-[#1B2D3C]/15 bg-white' : hasPending ? 'border-amber-300 bg-amber-50/40' : 'border-[#1B2D3C]/30 bg-white'
    }`}>
      {/* Table label */}
      <div className={`px-2.5 py-1.5 border-b flex items-center justify-between ${
        isEmpty ? 'border-[#1B2D3C]/10' : 'border-[#1B2D3C]/15'
      }`}>
        <span className="text-[10px] font-black uppercase tracking-wider text-[#1B2D3C]/50">{tableId}</span>
        {!isEmpty && (
          <span className={`w-1.5 h-1.5 rounded-full ${hasPending ? 'bg-amber-400' : 'bg-emerald-500'}`} />
        )}
      </div>
      {/* Bookings */}
      <div className="flex-1 p-2 space-y-1.5">
        {isEmpty ? (
          <p className="text-[10px] text-[#1B2D3C]/20 font-semibold text-center pt-2">—</p>
        ) : (
          bookings.map(b => (
            <div key={b.id} className="space-y-0.5">
              <button
                onClick={() => setExpanded(prev => prev === b.id ? null : b.id)}
                className="w-full text-left"
              >
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[10px] font-black text-[#1B2D3C] leading-tight truncate">{b.time} {b.name}</span>
                  <span className={`shrink-0 text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                    hasPending && b.status === 'pending' ? 'border-amber-400 text-amber-700' : 'border-[#1B2D3C]/40 text-[#1B2D3C]'
                  }`}>{b.paintersCount}</span>
                </div>
              </button>
              {expanded === b.id && (
                <div className="bg-white/80 border border-[#1B2D3C]/10 rounded p-2 space-y-1">
                  {b.phone && <p className="text-[9px] text-[#1B2D3C]/60 font-semibold">{b.phone}</p>}
                  {b.email && <p className="text-[9px] text-[#1B2D3C]/60 font-semibold truncate">{b.email}</p>}
                  {b.notes && <p className="text-[9px] text-[#1B2D3C]/70 italic">{b.notes}</p>}
                  {b.status === 'pending' && onConfirm && (
                    <button onClick={() => { onConfirm(b.id); setExpanded(null); }}
                      className="mt-1 w-full flex items-center justify-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black rounded transition-all cursor-pointer">
                      <CheckCircle className="w-2.5 h-2.5" /> Confirm
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DailySheet({
  studio,
  studioBookings,
  onConfirm,
  onNavigateToAddBooking,
}: {
  studio: 'Putney' | 'Wimbledon';
  studioBookings: BookingInquiry[];
  onConfirm?: (id: string) => void;
  onNavigateToAddBooking?: () => void;
}) {
  const studioPending = studioBookings.filter(b => b.status === 'pending').length;

  const bookingsByTable = useMemo(() => {
    const map = new Map<string, BookingInquiry[]>();
    studioBookings.forEach(b => {
      if (b.tableId) {
        b.tableId.split(',').map(t => t.trim()).filter(Boolean).forEach(tid => {
          if (!map.has(tid)) map.set(tid, []);
          map.get(tid)!.push(b);
        });
      }
    });
    return map;
  }, [studioBookings]);

  const unassigned = studioBookings.filter(b => !b.tableId);
  const mainTables = studio === 'Putney' ? PUTNEY_MAIN_TABLES : WIMBLEDON_MAIN_TABLES;
  const partyTables = studio === 'Putney'
    ? [{ label: 'Party Area', tables: PUTNEY_PARTY_TABLES }]
    : [{ label: 'Party Area 1', tables: WIMBLEDON_PARTY1_TABLES }, { label: 'Party Area 2', tables: WIMBLEDON_PARTY2_TABLES }];

  return (
    <div className="bg-white border border-[#1B2D3C]/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-[#1B2D3C] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-white/70" />
          <h3 className="font-heading font-black text-white text-sm">{studio} Studio</h3>
          {studioPending > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-black bg-amber-400 text-white rounded-full">
              {studioPending} awaiting
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold text-white/70">
          {studioBookings.length} booking{studioBookings.length !== 1 ? 's' : ''} · {studioBookings.reduce((s, b) => s + b.paintersCount, 0)} seats
        </span>
      </div>

      <div className="p-4 space-y-5">
        {studioBookings.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <CalendarDays className="w-8 h-8 text-[#1B2D3C]/15 mx-auto" />
            <p className="text-xs text-[#1B2D3C]/40 font-semibold">No bookings for {studio} on this date</p>
            {onNavigateToAddBooking && (
              <button onClick={onNavigateToAddBooking} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold border border-[#1B2D3C]/20 rounded-lg hover:bg-[#DBE7E4] transition-all cursor-pointer text-[#1B2D3C]">
                <Plus className="w-3 h-3" /> Add booking
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Main tables grid */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#1B2D3C]/30 mb-2">Main Area</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {mainTables.map(tid => (
                  <TableCard key={tid} tableId={tid} bookings={bookingsByTable.get(tid) || []} onConfirm={onConfirm} />
                ))}
              </div>
            </div>

            {/* Party areas */}
            {partyTables.map(({ label, tables }) => (
              <div key={label} className="border-t border-dashed border-[#1B2D3C]/15 pt-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#1B2D3C]/30 mb-2">{label}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {tables.map(tid => (
                    <TableCard key={tid} tableId={tid} bookings={bookingsByTable.get(tid) || []} onConfirm={onConfirm} />
                  ))}
                </div>
              </div>
            ))}

            {/* Unassigned bookings */}
            {unassigned.length > 0 && (
              <div className="border-t border-dashed border-amber-200 pt-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-600/70 mb-2">No Table Assigned ({unassigned.length})</p>
                <div className="space-y-1.5">
                  {unassigned.map(b => (
                    <BookingRow key={b.id} b={b} onConfirm={onConfirm} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function DashboardOverview({ bookings, onAssignTable, onConfirm, onBulkConfirm, onNavigateToBookings, onNavigateToAddBooking }: DashboardOverviewProps) {
  const [viewDate, setViewDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [bulkConfirming, setBulkConfirming] = useState(false);
  const [nameSearch, setNameSearch] = useState('');

  const today = format(new Date(), 'yyyy-MM-dd');

  const todayBookings = useMemo(() => {
    const byDate = bookings.filter(b => b.date === viewDate);
    if (!nameSearch.trim()) return byDate;
    return byDate.filter(b => b.name.toLowerCase().includes(nameSearch.toLowerCase()));
  }, [bookings, viewDate, nameSearch]);
  const putneyToday = useMemo(() => todayBookings.filter(b => b.studio === 'Putney'), [todayBookings]);
  const wimbledonToday = useMemo(() => todayBookings.filter(b => b.studio === 'Wimbledon'), [todayBookings]);

  const totalSeats = todayBookings.reduce((s, b) => s + b.paintersCount, 0);
  const pendingToday = todayBookings.filter(b => b.status === 'pending');
  const confirmedCount = todayBookings.filter(b => b.status === 'confirmed').length;
  const unassignedCount = todayBookings.filter(b => !b.tableId).length;

  const shiftDate = (days: number) => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + days);
    setViewDate(format(d, 'yyyy-MM-dd'));
  };

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
              {pendingToday.length} booking{pendingToday.length !== 1 ? 's' : ''} awaiting confirmation for {viewDate === today ? 'today' : format(new Date(viewDate), 'do MMM')}
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
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]/50">Seats</p>
          <p className="text-3xl font-black text-[#1B2D3C]">{totalSeats}</p>
          <p className="text-[10px] text-[#1B2D3C]/50 font-semibold">across all sessions</p>
        </div>
        <div className={`border rounded-xl p-4 space-y-1 ${pendingToday.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-[#1B2D3C]/20'}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600/80">Awaiting</p>
          <p className="text-3xl font-black text-amber-600">{pendingToday.length}</p>
          <p className="text-[10px] text-[#1B2D3C]/50 font-semibold">{confirmedCount} confirmed</p>
        </div>
        <div className={`border rounded-xl p-4 space-y-1 ${unassignedCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-[#1B2D3C]/20'}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]/50">No Table</p>
          <p className={`text-3xl font-black ${unassignedCount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{unassignedCount}</p>
          <p className="text-[10px] text-[#1B2D3C]/50 font-semibold">{todayBookings.length - unassignedCount} assigned</p>
        </div>
      </div>

      {/* Big calendar */}
      <AdminCalendar
        bookings={bookings}
        selectedDate={new Date(viewDate)}
        onSelectDate={(date) => setViewDate(format(date, 'yyyy-MM-dd'))}
        month={calendarMonth}
        onMonthChange={setCalendarMonth}
      />

      {/* Name search */}
      <div className="relative max-w-xs">
        <input
          type="text"
          placeholder="Find by name…"
          value={nameSearch}
          onChange={e => setNameSearch(e.target.value)}
          className="w-full pl-3 pr-7 py-2 border border-[#1B2D3C]/20 text-xs font-semibold text-[#1B2D3C] rounded-lg focus:outline-none focus:border-[#1B2D3C]/40 bg-white"
        />
        {nameSearch && (
          <button onClick={() => setNameSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#1B2D3C]/30 hover:text-[#1B2D3C] cursor-pointer text-base leading-none">×</button>
        )}
      </div>

      {/* Both studios — always shown */}
      <DailySheet
        studio="Putney"
        studioBookings={putneyToday}
        onConfirm={onConfirm}
        onNavigateToAddBooking={onNavigateToAddBooking}
      />
      <DailySheet
        studio="Wimbledon"
        studioBookings={wimbledonToday}
        onConfirm={onConfirm}
        onNavigateToAddBooking={onNavigateToAddBooking}
      />

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
                      <span className="text-[10px] font-semibold text-[#1B2D3C]/50">{painters} seats</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-[#1B2D3C]/25 font-semibold">No bookings</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {pending > 0 && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">{pending} awaiting</span>
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
