import { useState, useEffect } from 'react';
import { Images } from '../images';
import { Page } from '../types';
import Calendar from './Calendar';
import { format, getDay } from 'date-fns';
import {Clock, Calendar as CalendarIcon, ArrowRight} from 'lucide-react';
import { getRemainingCapacity, getBusyDates } from '../lib/bookings';
import { getSlots } from '../lib/timeSlots';
import { loadClosuresFromSupabase, getClosureDates, ClosureDates, isDateInHolidayRange } from '../lib/closures';
import { useToast } from './ToastContext';
import EditableText from './EditableText';
import EditableImage from './EditableImage';
import LocationGallery from './LocationGallery';

interface PutneyViewProps {
  setCurrentPage: (page: Page) => void;
  adminMode?: boolean;
}

const MAX_PAINTERS = 32;

const OPENING_HOURS = [
  { day: 'Monday', time: 'Closed (except school holidays)' },
  { day: 'Tuesday - Saturday', time: '10:00am - 6:00pm' },
  { day: 'Sunday', time: '11:00am - 5:00pm' },
];

function getTimeSlots(date: Date, closures: ClosureDates): string[] {
  const day = getDay(date);
  const dateStr = format(date, 'yyyy-MM-dd');
  const isHoliday = isDateInHolidayRange(dateStr, closures.schoolHolidays);
  if (day >= 2 || day === 0 || (day === 1 && isHoliday)) return getSlots('painting');
  return [];
}


export default function PutneyView({ setCurrentPage, adminMode = false }: PutneyViewProps) {
  const { showToast } = useToast();

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | undefined>(undefined);
  const [painters, setPainters] = useState<number | ''>(1);
  const [slotCapacity, setSlotCapacity] = useState<Record<string, number>>({});
  const [busyDates, setBusyDates] = useState<Date[]>([]);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [closures, setClosures] = useState<ClosureDates>(getClosureDates());

  useEffect(() => {
    loadClosuresFromSupabase().then(setClosures);
  }, []);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setTime(undefined);
  };

  useEffect(() => {
    if (!date) {
      setSlotCapacity({});
      return;
    }
    const slots = getTimeSlots(date, closures);
    const dateStr = format(date, 'yyyy-MM-dd');
    Promise.all(slots.map(async (slot) => ({
      slot,
      remaining: await getRemainingCapacity('Putney', dateStr, slot, 'painting'),
    }))).then((results) => {
      const map: Record<string, number> = {};
      results.forEach(({ slot, remaining }) => {
        map[slot] = remaining;
      });
      setSlotCapacity(map);
    });
  }, [date]);

  useEffect(() => {
    getBusyDates('Putney', calendarMonth.getFullYear(), calendarMonth.getMonth()).then((dates) => {
      setBusyDates(dates.map((d) => new Date(d)));
    });
  }, [calendarMonth]);

  const handleBookDate = async () => {
    if (!date || !time) return;

    const existing = localStorage.getItem('pp_booking_draft');
    const remaining = await getRemainingCapacity('Putney', format(date, 'yyyy-MM-dd'), time);
    const paintersCount = painters === '' ? 1 : painters;
    if (paintersCount > remaining) {
      showToast(`This session only has room for ${remaining} more seat${remaining === 1 ? "" : "s"}. Please choose a different time or reduce the number of seats.`, 'error');
      return;
    }

    const draft = existing ? JSON.parse(existing) : {};
    draft.studio = 'Putney';
    draft.date = format(date, 'yyyy-MM-dd');
    draft.time = time;
    draft.sessionType = draft.sessionType || 'painting';
    draft.paintersCount = painters === '' ? 1 : painters;
    draft.currentStep = 1;
    localStorage.setItem('pp_booking_draft', JSON.stringify(draft));
    localStorage.setItem('pp_selected_studio', 'Putney');

    setCurrentPage('contact');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closedDatesAsDate = closures.closedDates.map(d => new Date(d + 'T00:00:00'));
  const timeSlots = date ? getTimeSlots(date, closures) : [];

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Hero Section */}
      <section className="relative h-[60vh] overflow-hidden">
        <EditableImage
          contentKey="putney_hero_image"
          page="putney"
          defaultSrc={Images.putneyStudio}
          alt="Pitter Potter Putney Studio Exterior"
          className="w-full h-full object-cover"
          adminMode={adminMode}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B2D3C]/40 via-[#1B2D3C]/20 to-[#1B2D3C]/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-[#1B2D3C] px-4 bg-[#DBE7E4]/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl">
            <EditableImage
              contentKey="putney_hero_logo"
              page="putney"
              defaultSrc={Images.logo}
              alt="Pitter Potter Logo"
              className="h-16 sm:h-20 w-auto object-contain mx-auto mb-4"
              adminMode={adminMode}
            />
            <p className="text-xl md:text-2xl font-light text-[#1B2D3C]">
              <EditableText contentKey="putney_subtitle" page="putney" defaultValue="Putney SW15" adminMode={adminMode} className="text-xl md:text-2xl font-light text-[#1B2D3C]" />
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 -mt-20 relative z-10 pb-20">
        <div className="bg-white shadow-sm p-8 md:p-12 space-y-8">
          <LocationGallery location="putney" defaultImages={Images.putneyGallery} adminMode={adminMode} />
          <div className="space-y-4">
            <EditableText contentKey="putney_title" page="putney" defaultValue="Our Putney Studio" adminMode={adminMode} className="font-heading text-3xl font-black text-[#1B2D3C] block" />
            <EditableText contentKey="putney_description" page="putney" defaultValue="Our bright, airy flagship studio on Upper Richmond Road, perfect for individuals, families, and creative birthday parties. Step inside and bring unglazed pottery to vibrant life with our premium glazes and expert guidance." adminMode={adminMode} className="text-[#1B2D3C] text-sm md:text-base leading-relaxed font-medium" />
          </div>

                    {/* Booking Calendar Section */}
          <div className="border-t border-[#1B2D3C]/10 pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#1B2D3C]" />
              <h3 className="font-heading text-xl font-black text-[#1B2D3C]">
                <EditableText contentKey="putney_book_heading" page="putney" defaultValue="Book a Session" adminMode={adminMode} className="font-heading text-xl text-[#1B2D3C]" />
              </h3>
            </div>

            <div className="bg-[#FFFFFF] p-3 flex items-start justify-center">
              <Calendar
                selected={date}
                onSelect={handleDateSelect}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                disabled={[...busyDates, ...closedDatesAsDate]}
                minDate={new Date()}
                dayOfWeekDisabled={[1]}
                schoolHolidayDates={closures.schoolHolidays}
                marks={busyDates}
              />
            </div>

            {timeSlots.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]"><EditableText contentKey="putney_slots_label" page="putney" defaultValue="Available 2-hour slots" adminMode={adminMode} className="text-[10px] uppercase tracking-widest text-[#1B2D3C]" /></span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setTime(slot)}
                      disabled={(slotCapacity[slot] ?? MAX_PAINTERS) === 0}
                      className={`py-3 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                        time === slot
                          ? 'bg-[#1B2D3C] text-white border-[#1B2D3C]'
                          : (slotCapacity[slot] ?? MAX_PAINTERS) === 0
                            ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                            : 'bg-white text-[#1B2D3C] border-[#1B2D3C]/20 hover:border-[#1B2D3C]'
                      }`}
                    >
                      {slot}
                      {(slotCapacity[slot] ?? MAX_PAINTERS) === 0 && (
                        <span className="block text-[9px] font-normal normal-case tracking-normal mt-0.5">Full</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]"><EditableText contentKey="putney_painters_label" page="putney" defaultValue="Number of Seats" adminMode={adminMode} className="text-[10px] uppercase tracking-widest text-[#1B2D3C]" /></label>
              <div className="flex items-center border border-[#1B2D3C]/20 bg-white overflow-hidden">
                <button type="button" onClick={() => setPainters(p => Math.max(1, (p === '' ? 1 : p) - 1))} className="px-4 py-3 text-lg font-black text-[#1B2D3C] hover:bg-[#D6E2E9]/40 transition-all cursor-pointer select-none">−</button>
                <span className="flex-1 text-center text-sm font-black text-[#1B2D3C]">{painters === '' ? 1 : painters}</span>
                <button type="button" onClick={() => setPainters(p => Math.min(MAX_PAINTERS, (p === '' ? 1 : p) + 1))} className="px-4 py-3 text-lg font-black text-[#1B2D3C] hover:bg-[#D6E2E9]/40 transition-all cursor-pointer select-none">+</button>
              </div>
            </div>

            {date && time && (
              <div className="bg-[#D6E2E9]/50 p-3 text-sm font-bold text-[#1B2D3C]">
                <p>{format(date, 'EEEE, do MMMM yyyy')} · {time} – {parseInt(time.split(':')[0], 10) + 2}:00 · {painters === '' ? 1 : painters} seat{(painters === '' ? 1 : painters) !== 1 ? 's' : ''}</p>
              </div>
            )}

            <button
              onClick={handleBookDate}
              disabled={!date || !time}
              className="w-full py-3.5 bg-[#1B2D3C] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#486581] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <EditableText contentKey="putney_book_button" page="putney" defaultValue="Book This Session" adminMode={adminMode} className="text-xs uppercase tracking-widest text-white" /> <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage('book')}
              className="w-full py-3 bg-white text-[#1B2D3C] font-bold text-xs uppercase tracking-widest border border-[#1B2D3C]/20 hover:bg-[#FFFFFF] transition-all cursor-pointer"
            >
              <EditableText contentKey="putney_choose_studio_button" page="putney" defaultValue="Choose a Different Studio" adminMode={adminMode} className="text-xs uppercase tracking-widest" />
            </button>
          </div>
          <div className="border-t border-[#1B2D3C]/10 pt-8 space-y-6">
            <h3 className="font-heading text-2xl font-black text-[#1B2D3C]">
              <EditableText contentKey="putney_contact_heading" page="putney" defaultValue="Contact & Location" adminMode={adminMode} className="font-heading text-2xl text-[#1B2D3C]" />
            </h3>

            <div className="aspect-video w-full bg-[#D6E2E9]/50 overflow-hidden rounded-lg">
              <iframe
                title="Putney Studio Location"
                src="https://maps.google.com/maps?q=Pitter+Potter+Putney&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="space-y-4 text-sm text-[#1B2D3C] font-semibold">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#1B2D3C] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold"><EditableText contentKey="putney_address_label" page="putney" defaultValue="Address:" adminMode={adminMode} className="text-sm text-[#1B2D3C]" /></p>
                  <p className="text-stone-600"><EditableText contentKey="putney_address" page="putney" defaultValue="234 Upper Richmond Road, London, SW15 6TG" adminMode={adminMode} className="text-sm text-stone-600" /></p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#1B2D3C] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold"><EditableText contentKey="putney_phone_label" page="putney" defaultValue="Phone:" adminMode={adminMode} className="text-sm text-[#1B2D3C]" /></p>
                  <a href="tel:02087881635" className="text-[#1B2D3C] hover:underline font-bold"><EditableText contentKey="putney_phone" page="putney" defaultValue="020 8788 1635" adminMode={adminMode} className="text-sm text-[#1B2D3C]" /></a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#1B2D3C]/10 pt-8 space-y-6">
            <h3 className="font-heading text-2xl font-black text-[#1B2D3C]">
              <EditableText contentKey="putney_hours_heading" page="putney" defaultValue="Opening Hours" adminMode={adminMode} className="font-heading text-2xl text-[#1B2D3C]" />
            </h3>
            <div className="divide-y divide-[#1B2D3C]/10 text-sm text-[#1B2D3C] font-medium">
              {OPENING_HOURS.map(({ day, time }, index) => (
                <div key={`${day}-${index}`} className="flex justify-between py-2.5">
                  <span className="font-bold"><EditableText contentKey={`putney_hours_${day.toLowerCase().replace(/[^a-z]/g, '_')}`} page="putney" defaultValue={day} adminMode={adminMode} className="text-sm text-[#1B2D3C]" /></span>
                  <span className={time.includes('Closed') ? 'text-stone-500' : ''}><EditableText contentKey={`putney_hours_${day.toLowerCase().replace(/[^a-z]/g, '_')}_time`} page="putney" defaultValue={time} adminMode={adminMode} className="text-sm text-[#1B2D3C]" /></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
