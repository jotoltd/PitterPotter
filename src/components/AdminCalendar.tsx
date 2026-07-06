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
    const map = new Map<string, BookingInquiry[]>();
    for (const b of bookings) {
      const list = map.get(b.date) || [];
      list.push(b);
      map.set(b.date, list);
    }
    return map;
  }, [bookings]);

  return (
    <div className="bg-white border border-[#1B2D3C]/20 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1B2D3C]/10 flex items-center justify-between">
        <h2 className="font-heading text-xl font-black text-[#1B2D3C]">
          {format(month, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onMonthChange(subMonths(month, 1))}
            className="p-2 rounded-lg hover:bg-[#1B2D3C]/5 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5 text-[#1B2D3C]" />
          </button>
          <button
            onClick={() => onMonthChange(new Date())}
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-[#1B2D3C]/20 rounded-lg hover:bg-[#DBE7E4] transition-all text-[#1B2D3C]"
          >
            Today
          </button>
          <button
            onClick={() => onMonthChange(addMonths(month, 1))}
            className="p-2 rounded-lg hover:bg-[#1B2D3C]/5 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5 text-[#1B2D3C]" />
          </button>
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
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayBookings = bookingsByDate.get(dateStr) || [];
          const inMonth = isSameMonth(day, month);
          const selected = selectedDate && isSameDay(day, selectedDate);
          const today = isToday(day);
          const pending = dayBookings.filter((b) => b.status === 'pending').length;

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`
                min-h-[7rem] p-2 text-left border-r border-b border-[#1B2D3C]/5 transition-colors
                ${!inMonth ? 'opacity-40 bg-[#F8FAFB]' : 'bg-white'}
                ${selected ? 'bg-[#DBE7E4]/60' : ''}
                ${today && !selected ? 'bg-[#D6E2E9]/20' : ''}
                hover:bg-[#F8FAFB]
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`
                  w-7 h-7 flex items-center justify-center text-sm font-black rounded-full
                  ${today ? 'bg-[#1B2D3C] text-white' : 'text-[#1B2D3C]'}
                `}>
                  {format(day, 'd')}
                </span>
                {dayBookings.length > 0 && (
                  <span className={`
                    text-[9px] font-bold px-1.5 py-0.5 rounded-full
                    ${pending > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}
                  `}>
                    {dayBookings.length}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1 justify-center mt-1">
                {dayBookings.slice(0, 5).map((b) => (
                  <span
                    key={b.id}
                    className={`
                      w-1.5 h-1.5 rounded-full
                      ${b.status === 'pending' ? 'bg-amber-400' : 'bg-[#1B2D3C]/60'}
                    `}
                  />
                ))}
                {dayBookings.length > 5 && (
                  <span className="text-[9px] font-bold text-[#1B2D3C]/60">+{dayBookings.length - 5}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
