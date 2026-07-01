import { useState } from 'react';
import WimbledonFloorPlan, { useTableAnalytics } from './WimbledonFloorPlan';
import { BookingInquiry } from '../types';
import { format } from 'date-fns';

type Studio = 'Wimbledon' | 'Putney';

const TIME_SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '10:00-12:00', '12:30-14:30', '15:00-17:00'];

interface FloorPlanViewProps {
  bookings?: BookingInquiry[];
}

export default function FloorPlanView({ bookings = [] }: FloorPlanViewProps) {
  const [studio, setStudio] = useState<Studio>('Wimbledon');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showAnalytics, setShowAnalytics] = useState(false);

  const analytics = useTableAnalytics(bookings.filter(b => b.studio === 'Wimbledon'));

  const occupiedDates = new Set(
    bookings.filter(b => b.studio === studio).map(b => b.date)
  );

  const timeSlotsForDate = selectedDate
    ? [...new Set(bookings.filter(b => b.studio === studio && b.date === selectedDate).map(b => b.time))]
    : [];

  const allTimeSlots = [...new Set([...TIME_SLOTS, ...timeSlotsForDate])].sort();

  const dayBookings = selectedDate ? bookings.filter(b => b.studio === studio && b.date === selectedDate) : [];
  const timeBookings = selectedDate && selectedTime ? dayBookings.filter(b => b.time === selectedTime) : [];
  const assignedCount = timeBookings.filter(b => b.tableId).length;
  const totalCount = timeBookings.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading text-lg font-black text-[#1B2D3C] uppercase tracking-wider">Floor Plans</h2>
        <div className="flex gap-2">
          {(['Wimbledon', 'Putney'] as Studio[]).map((s) => (
            <button
              key={s}
              onClick={() => setStudio(s)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                studio === s
                  ? 'bg-[#1B2D3C] text-white border-[#1B2D3C]'
                  : 'bg-white text-[#1B2D3C] border-[#1B2D3C]/20 hover:border-[#1B2D3C]'
              }`}
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => setShowAnalytics(v => !v)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              showAnalytics
                ? 'bg-[#1B2D3C] text-white border-[#1B2D3C]'
                : 'bg-white text-[#1B2D3C] border-[#1B2D3C]/20 hover:border-[#1B2D3C]'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {showAnalytics && studio === 'Wimbledon' && (
        <div className="bg-[#F8FAFB] border border-[#1B2D3C]/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-black text-[#1B2D3C] text-sm uppercase tracking-wider">Table Usage Analytics</h3>
            <span className="text-[10px] font-bold text-[#1B2D3C]/70">{analytics.totalAssignments} total assignments</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {analytics.tableStats.map(stat => (
              <div key={stat.tableId} className="bg-white border border-[#1B2D3C]/10 rounded-lg p-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#1B2D3C]">
                  <span>{stat.tableId}</span>
                  <span className="text-[#1B2D3C]/50">{stat.bookingsCount} bookings</span>
                </div>
                <p className="text-[10px] text-[#1B2D3C]/60 font-semibold mt-1">{stat.paintersCount} painters seated</p>
              </div>
            ))}
            {analytics.tableStats.length === 0 && (
              <p className="text-xs text-[#1B2D3C]/50 font-semibold col-span-full">No table assignments yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Date + Time Pickers */}
      <div className="flex flex-wrap gap-4 items-end bg-[#F8FAFB] border border-[#1B2D3C]/10 rounded-xl p-4">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => { setSelectedDate(e.target.value); setSelectedTime(''); }}
            className="px-3 py-2 border border-[#1B2D3C]/20 text-xs font-bold text-[#1B2D3C] rounded-lg focus:outline-none bg-white"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]">Time Slot</label>
          <select
            value={selectedTime}
            onChange={e => setSelectedTime(e.target.value)}
            className="px-3 py-2 border border-[#1B2D3C]/20 text-xs font-bold text-[#1B2D3C] rounded-lg focus:outline-none bg-white cursor-pointer"
          >
            <option value="">All slots</option>
            {allTimeSlots.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        {selectedDate && (
          <div className="flex gap-3 text-xs font-bold">
            <span className="px-2 py-1 bg-white border border-[#1B2D3C]/20 rounded text-[#1B2D3C]">
              {selectedTime
                ? `${totalCount} booking${totalCount !== 1 ? 's' : ''} at ${selectedTime}`
                : `${dayBookings.length} booking${dayBookings.length !== 1 ? 's' : ''} on ${selectedDate}`}
            </span>
            {selectedTime && (
              <span className={`px-2 py-1 rounded ${assignedCount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {assignedCount} table{assignedCount !== 1 ? 's' : ''} assigned
              </span>
            )}
            <span className="px-2 py-1 bg-white border border-[#1B2D3C]/20 rounded text-[#1B2D3C]">
              {occupiedDates.has(selectedDate) ? '● Bookings exist' : '○ No bookings'}
            </span>
          </div>
        )}
      </div>

      {studio === 'Wimbledon' && (
        <WimbledonFloorPlan
          bookings={bookings}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          readOnly
          showTablePanel
        />
      )}
      {studio === 'Putney' && (
        <div className="bg-white border border-[#1B2D3C]/20 rounded-xl p-12 text-center text-[#1B2D3C]/40 text-sm font-bold">
          Putney floor plan coming soon
        </div>
      )}
    </div>
  );
}
