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
  isBefore,
  getDay,
  addMonths,
  subMonths,
} from 'date-fns';

interface CalendarProps {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  month: Date;
  onMonthChange: (date: Date) => void;
  disabled?: Date[];
  weekStartsOn?: 0 | 1;
  marks?: Date[];
  minDate?: Date;
  dayOfWeekDisabled?: number[];
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function Calendar({
  selected,
  onSelect,
  month,
  onMonthChange,
  disabled = [],
  weekStartsOn = 1,
  marks = [],
  minDate,
  dayOfWeekDisabled = [],
}: CalendarProps) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn });
    return eachDayOfInterval({ start, end });
  }, [month, weekStartsOn]);

  const isDisabled = (day: Date) => {
    if (minDate && isBefore(day, minDate)) return true;
    if (dayOfWeekDisabled.includes(getDay(day))) return true;
    if (disabled.some((d) => isSameDay(d, day))) return true;
    return false;
  };

  const hasMark = (day: Date) => marks.some((d) => isSameDay(d, day));

  return (
    <div className="w-full max-w-md mx-auto select-none">
      <div className="flex items-center justify-between mb-4 px-2">
        <button
          onClick={() => onMonthChange(subMonths(month, 1))}
          className="p-2 rounded-full hover:bg-[#1B2D3C]/5 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-[#1B2D3C]" />
        </button>
        <h2 className="font-heading text-2xl font-black text-[#1B2D3C]">
          {format(month, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => onMonthChange(addMonths(month, 1))}
          className="p-2 rounded-full hover:bg-[#1B2D3C]/5 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-[#1B2D3C]" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-[#1B2D3C]/60 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const disabledDay = isDisabled(day);
          const selectedDay = selected && isSameDay(day, selected);
          const today = isToday(day);
          const inMonth = isSameMonth(day, month);
          const mark = hasMark(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => !disabledDay && onSelect(day)}
              disabled={disabledDay}
              className={`
                relative flex flex-col items-center justify-center py-2 rounded-full transition-colors
                ${disabledDay ? 'text-[#1B2D3C]/20 cursor-not-allowed' : 'text-[#1B2D3C] cursor-pointer hover:bg-[#1B2D3C]/5'}
                ${!inMonth ? 'opacity-0 pointer-events-none' : ''}
                ${selectedDay ? 'bg-[#1B2D3C] text-white hover:bg-[#1B2D3C]' : ''}
                ${today && !selectedDay ? 'font-black' : 'font-medium'}
              `}
            >
              <span className={`
                w-8 h-8 flex items-center justify-center text-sm rounded-full
                ${today && !selectedDay ? 'bg-[#1B2D3C] text-white' : ''}
              `}>
                {format(day, 'd')}
              </span>
              {mark && (
                <span className={`mt-0.5 w-1 h-1 rounded-full ${selectedDay ? 'bg-white' : 'bg-[#1B2D3C]/60'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
