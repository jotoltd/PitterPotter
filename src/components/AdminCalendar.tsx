import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { BookingInquiry } from '../types';

interface AdminCalendarProps {
  bookings: BookingInquiry[];
  selectedDate?: Date;
  onSelectDate: (date: Date) => void;
  month: Date;
  onMonthChange: (date: Date) => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const PARTY_TYPES = new Set(['birthday-party', 'baby-shower-hen', 'corporate']);

export default function AdminCalendar({
  bookings,
  selectedDate,
  onSelectDate,
  month,
  onMonthChange,
}: AdminCalendarProps) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const bookingsByDate = useMemo(() => {
    const map: Record<string, { painting: boolean; babyPrints: boolean; party: boolean }> = {};
    for (const b of bookings) {
      if (!map[b.date]) map[b.date] = { painting: false, babyPrints: false, party: false };
      if (b.sessionType === 'painting') map[b.date].painting = true;
      else if (b.sessionType === 'clay-imprints') map[b.date].babyPrints = true;
      else if (PARTY_TYPES.has(b.sessionType)) map[b.date].party = true;
    }
    return map;
  }, [bookings]);

  return (
    <div className="bg-white border border-[#1B2D3C]/20 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1B2D3C]/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="font-heading text-xl font-black text-[#1B2D3C]">
            {format(month, 'MMMM yyyy')}
          </h2>
          <div className="hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#1B2D3C]/60"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Painting</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#1B2D3C]/60"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />Baby Prints</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#1B2D3C]/60"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />Party</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onMonthChange(new Date())}
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-[#1B2D3C]/20 rounded-lg hover:bg-[#DBE7E4] transition-all text-[#1B2D3C]"
          >
            Today
          </button>
          <div className="flex items-center">
            <button
              onClick={() => onMonthChange(subMonths(month, 1))}
              className="p-2 rounded-l-lg hover:bg-[#D6E2E9] transition-colors border border-[#1B2D3C]/20"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4 text-[#1B2D3C]" />
            </button>
            <button
              onClick={() => onMonthChange(addMonths(month, 1))}
              className="p-2 rounded-r-lg hover:bg-[#D6E2E9] transition-colors border border-[#1B2D3C]/20 border-l-0"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4 text-[#1B2D3C]" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-[#1B2D3C]/10">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-[10px] font-black uppercase tracking-wider text-[#1B2D3C]/60 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-fr">
        {days.map((day) => {
          const inMonth = isSameMonth(day, month);
          const selected = selectedDate && isSameDay(day, selectedDate);
          const today = isToday(day);
          const dateKey = format(day, 'yyyy-MM-dd');
          const types = bookingsByDate[dateKey];

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`
                min-h-[3.5rem] p-1.5 text-left border-r border-b border-[#1B2D3C]/5 transition-colors
                ${!inMonth ? 'opacity-40 bg-[#F8FAFB]' : 'bg-white'}
                ${selected ? 'bg-[#DBE7E4]/60' : ''}
                ${today && !selected ? 'bg-[#D6E2E9]/20' : ''}
                hover:bg-[#F8FAFB]
              `}
            >
              <span className={`
                w-6 h-6 flex items-center justify-center text-xs font-black rounded-full
                ${today ? 'bg-[#DBE7E4] text-[#1B2D3C]' : 'text-[#1B2D3C]'}
              `}>
                {format(day, 'd')}
              </span>
              {types && (
                <div className="flex gap-0.5 mt-1 flex-wrap">
                  {types.painting && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  {types.babyPrints && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
                  {types.party && <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
