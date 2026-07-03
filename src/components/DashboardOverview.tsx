import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Users, Clock, CheckCircle, CalendarDays, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { BookingInquiry } from '../types';
import WimbledonFloorPlan from './WimbledonFloorPlan';
import PutneyFloorPlan from './PutneyFloorPlan';

interface DashboardOverviewProps {
  bookings: BookingInquiry[];
  onAssignTable: (bookingId: string, tableId: string | null) => void;
}

const SESSION_LABELS: Record<string, string> = {
  'painting': 'Painting',
  'birthday-party': 'Birthday',
  'baby-shower-hen': 'Baby Shower / Hen',
  'clay-imprints': 'Clay Imprints',
  'corporate': 'Corporate',
};

const TIME_ORDER = ['10:00', '10:30', '12:00', '12:30', '14:00', '14:30', '16:00', '16:30', '10:00-12:00', '12:30-14:30', '15:00-17:00'];

export default function DashboardOverview({ bookings, onAssignTable }: DashboardOverviewProps) {
  const [viewDate, setViewDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [floorStudio, setFloorStudio] = useState<'Putney' | 'Wimbledon'>('Putney');
  const [floorTime, setFloorTime] = useState('');

  const today = format(new Date(), 'yyyy-MM-dd');

  const todayBookings = useMemo(() => bookings.filter(b => b.date === viewDate), [bookings, viewDate]);
  const putneyToday = useMemo(() => todayBookings.filter(b => b.studio === 'Putney'), [todayBookings]);
  const wimbledonToday = useMemo(() => todayBookings.filter(b => b.studio === 'Wimbledon'), [todayBookings]);

  const totalPainters = todayBookings.reduce((s, b) => s + b.paintersCount, 0);
  const pendingCount = todayBookings.filter(b => b.status === 'pending').length;
  const confirmedCount = todayBookings.filter(b => b.status === 'confirmed').length;
  const unassignedCount = todayBookings.filter(b => !b.tableId).length;

  // Group by studio + time slot
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

  return (
    <div className="space-y-8">

      {/* Date nav */}
      <div className="flex items-center justify-between">
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
        <div className="bg-white border border-[#1B2D3C]/20 rounded-xl p-4 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600/80">Pending</p>
          <p className="text-3xl font-black text-amber-600">{pendingCount}</p>
          <p className="text-[10px] text-[#1B2D3C]/50 font-semibold">{confirmedCount} confirmed</p>
        </div>
        <div className="bg-white border border-[#1B2D3C]/20 rounded-xl p-4 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]/50">Unassigned Tables</p>
          <p className={`text-3xl font-black ${unassignedCount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{unassignedCount}</p>
          <p className="text-[10px] text-[#1B2D3C]/50 font-semibold">{todayBookings.length - unassignedCount} assigned</p>
        </div>
      </div>

      {/* Time slot tables — two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(['Putney', 'Wimbledon'] as const).map(studio => (
          <div key={studio} className="bg-white border border-[#1B2D3C]/20 rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-[#1B2D3C] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-white/70" />
                <h3 className="font-heading font-black text-white text-sm">{studio} Studio</h3>
              </div>
              <span className="text-[10px] font-bold text-white/70">
                {studio === 'Putney' ? putneyToday.length : wimbledonToday.length} booking{(studio === 'Putney' ? putneyToday.length : wimbledonToday.length) !== 1 ? 's' : ''}
                {' · '}
                {(studio === 'Putney' ? putneyToday : wimbledonToday).reduce((s, b) => s + b.paintersCount, 0)} painters
              </span>
            </div>

            {allTimesForStudio(studio).length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-[#1B2D3C]/40 font-semibold">No bookings for this date</div>
            ) : (
              <div className="divide-y divide-[#1B2D3C]/5">
                {allTimesForStudio(studio).map(time => {
                  const slotBookings = slotsByStudio[studio][time] || [];
                  const painters = slotBookings.reduce((s, b) => s + b.paintersCount, 0);
                  return (
                    <div key={time} className="px-5 py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#1B2D3C]/50" />
                          <span className="text-xs font-black text-[#1B2D3C]">{time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#1B2D3C]/50">{painters} painter{painters !== 1 ? 's' : ''}</span>
                          <span className="text-[10px] font-bold text-[#1B2D3C]/50">{slotBookings.length} booking{slotBookings.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {slotBookings.map(b => (
                          <div key={b.id} className="flex items-center justify-between bg-[#F8FAFB] border border-[#1B2D3C]/10 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`shrink-0 w-2 h-2 rounded-full ${b.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                              <span className="text-xs font-bold text-[#1B2D3C] truncate">{b.name}</span>
                              <span className="text-[10px] text-[#1B2D3C]/50 font-semibold shrink-0">{b.paintersCount}p</span>
                              <span className="text-[10px] text-[#1B2D3C]/50 font-semibold shrink-0 hidden sm:block">{SESSION_LABELS[b.sessionType] ?? b.sessionType}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {b.tableId ? (
                                <span className="px-2 py-0.5 bg-[#1B2D3C] text-white text-[10px] font-bold rounded">{b.tableId}</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded">No table</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

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

        {/* Time filter for floor plan */}
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
          <PutneyFloorPlan
            bookings={bookings}
            selectedDate={viewDate}
            selectedTime={floorTime || undefined}
            readOnly
            showTablePanel
          />
        ) : (
          <WimbledonFloorPlan
            bookings={bookings}
            selectedDate={viewDate}
            selectedTime={floorTime || undefined}
            readOnly
            showTablePanel
          />
        )}
      </div>

      {/* Upcoming 7 days mini summary */}
      <div className="bg-white border border-[#1B2D3C]/20 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#1B2D3C]/10 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-[#1B2D3C]" />
          <h3 className="font-heading font-black text-[#1B2D3C] text-sm">Next 7 Days</h3>
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
                className={`w-full px-5 py-3 flex items-center justify-between hover:bg-[#F8FAFB] transition-all cursor-pointer text-left ${viewDate === dateStr ? 'bg-[#DBE7E4]/50' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14">
                    <p className="text-xs font-black text-[#1B2D3C]">{i === 0 ? 'Today' : format(d, 'EEE')}</p>
                    <p className="text-[10px] text-[#1B2D3C]/50 font-semibold">{format(d, 'd MMM')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#1B2D3C]">
                      <Users className="w-3 h-3" />{dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-[10px] font-semibold text-[#1B2D3C]/50">{painters} painters</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pending > 0 && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">{pending} pending</span>
                  )}
                  {dayBookings.length === 0 && (
                    <span className="text-[10px] text-[#1B2D3C]/30 font-semibold">No bookings</span>
                  )}
                  {dayBookings.length > 0 && pending === 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                      <CheckCircle className="w-3 h-3" /> All confirmed
                    </span>
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
