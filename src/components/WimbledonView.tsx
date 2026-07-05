import { useState, useEffect } from 'react';
import { Images } from '../images';
import { Page } from '../types';
import { DayPicker } from 'react-day-picker';
import { format, getDay } from 'date-fns';
import {Clock, Calendar as CalendarIcon, ArrowRight, ChevronLeft, ChevronRight, X} from 'lucide-react';
import 'react-day-picker/dist/style.css';
import { getRemainingCapacity, getBusyDates } from '../lib/bookings';
import { useToast } from './ToastContext';
import EditableText from './EditableText';
import EditableImage from './EditableImage';

interface WimbledonViewProps {
  setCurrentPage: (page: Page) => void;
  adminMode?: boolean;
}

const MAX_PAINTERS = 65;

const OPENING_HOURS = [
  { day: 'Monday', time: 'Closed (except school holidays)' },
  { day: 'Tuesday - Saturday', time: '10:00am - 6:00pm' },
  { day: 'Sunday', time: '11:00am - 5:00pm' },
];

function getTimeSlots(date: Date): string[] {
  const day = getDay(date);
  // Tue - Sun: 10am - 6pm, 2-hour sessions starting every 30 mins
  if (day >= 2 || day === 0) {
    return ['10:00', '10:30', '12:00', '12:30', '14:00', '14:30', '16:00', '16:30'];
  }
  return [];
}


export default function WimbledonView({ setCurrentPage, adminMode = false }: WimbledonViewProps) {
  const { showToast } = useToast();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mobileGalleryIndex, setMobileGalleryIndex] = useState(0);

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | undefined>(undefined);
  const [painters, setPainters] = useState<number | ''>(1);
  const [slotCapacity, setSlotCapacity] = useState<Record<string, number>>({});
  const [busyDates, setBusyDates] = useState<Date[]>([]);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setTime(undefined);
  };

  useEffect(() => {
    if (!date) {
      setSlotCapacity({});
      return;
    }
    const slots = getTimeSlots(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    Promise.all(slots.map(async (slot) => ({
      slot,
      remaining: await getRemainingCapacity('Wimbledon', dateStr, slot, 'painting'),
    }))).then((results) => {
      const map: Record<string, number> = {};
      results.forEach(({ slot, remaining }) => {
        map[slot] = remaining;
      });
      setSlotCapacity(map);
    });
  }, [date]);

  useEffect(() => {
    getBusyDates('Wimbledon', calendarMonth.getFullYear(), calendarMonth.getMonth()).then((dates) => {
      setBusyDates(dates.map((d) => new Date(d)));
    });
  }, [calendarMonth]);

  const handleBookDate = async () => {
    if (!date || !time) return;

    const existing = localStorage.getItem('pp_booking_draft');
    const remaining = await getRemainingCapacity('Wimbledon', format(date, 'yyyy-MM-dd'), time);
    const paintersCount = painters === '' ? 1 : painters;
    if (paintersCount > remaining) {
      showToast(`This session only has room for ${remaining} more painter${remaining === 1 ? "" : "s"}. Please choose a different time or reduce the number of painters.`, 'error');
      return;
    }

    const draft = existing ? JSON.parse(existing) : {};
    draft.studio = 'Wimbledon';
    draft.date = format(date, 'yyyy-MM-dd');
    draft.time = time;
    draft.sessionType = draft.sessionType || 'painting';
    draft.paintersCount = painters === '' ? 1 : painters;
    draft.currentStep = 1;
    localStorage.setItem('pp_booking_draft', JSON.stringify(draft));
    localStorage.setItem('pp_selected_studio', 'Wimbledon');

    setCurrentPage('contact');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const timeSlots = date ? getTimeSlots(date) : [];

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Hero Section */}
      <section className="relative h-[60vh] overflow-hidden">
        <EditableImage
          contentKey="wimbledon_hero_image"
          page="wimbledon"
          defaultSrc={Images.wimbledonStudio}
          alt="Pitter Potter Wimbledon Studio Exterior"
          className="w-full h-full object-cover rounded-lg"
          adminMode={adminMode}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B2D3C]/40 via-[#1B2D3C]/20 to-[#1B2D3C]/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-[#1B2D3C] px-4 bg-[#DBE7E4]/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl">
            <EditableImage
              contentKey="wimbledon_hero_logo"
              page="wimbledon"
              defaultSrc={Images.logo}
              alt="Pitter Potter Logo"
              className="h-16 sm:h-20 w-auto object-contain mx-auto mb-4"
              adminMode={adminMode}
            />
            <p className="text-xl md:text-2xl font-light text-[#1B2D3C]">
              <EditableText contentKey="wimbledon_subtitle" page="wimbledon" defaultValue="Wimbledon SW19" adminMode={adminMode} className="text-xl md:text-2xl font-light text-[#1B2D3C]" />
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-4xl mx-auto px-4 pt-16 -mt-20 relative z-10">
        <div className="bg-white shadow-sm p-8 md:p-12 space-y-8">
          {/* Desktop grid */}
          <div className="hidden md:grid grid-cols-3 gap-4">
            {Images.wimbledonGallery.map((src, idx) => (
              <div key={idx} className="aspect-[4/3] overflow-hidden rounded-lg">
                <button
                  onClick={() => setLightboxIndex(idx)}
                  className="w-full h-full cursor-pointer"
                >
                  <EditableImage
                    contentKey={`wimbledon_gallery_${idx}`}
                    page="wimbledon"
                    defaultSrc={src}
                    alt={`Our Wimbledon Studio gallery ${idx + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    adminMode={adminMode}
                  />
                </button>
              </div>
            ))}
          </div>

          {/* Mobile carousel */}
          <div className="md:hidden relative">
            <div className="aspect-[4/3] overflow-hidden rounded-lg">
              <button
                onClick={() => setLightboxIndex(mobileGalleryIndex)}
                className="w-full h-full cursor-pointer"
              >
                <EditableImage
                  contentKey={`wimbledon_gallery_mobile_${mobileGalleryIndex}`}
                  page="wimbledon"
                  defaultSrc={Images.wimbledonGallery[mobileGalleryIndex]}
                  alt={`Our Wimbledon Studio gallery ${mobileGalleryIndex + 1}`}
                  className="w-full h-full object-cover"
                  adminMode={adminMode}
                />
              </button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => setMobileGalleryIndex((mobileGalleryIndex - 1 + Images.wimbledonGallery.length) % Images.wimbledonGallery.length)}
                className="p-2 bg-[#DBE7E4] text-[#1B2D3C] rounded-lg hover:bg-[#D6E2E9] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-bold text-[#1B2D3C]">
                {mobileGalleryIndex + 1} / {Images.wimbledonGallery.length}
              </span>
              <button
                onClick={() => setMobileGalleryIndex((mobileGalleryIndex + 1) % Images.wimbledonGallery.length)}
                className="p-2 bg-[#DBE7E4] text-[#1B2D3C] rounded-lg hover:bg-[#D6E2E9] transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <EditableText contentKey="wimbledon_title" page="wimbledon" defaultValue="Our Wimbledon Studio" adminMode={adminMode} className="font-heading text-3xl font-black text-[#1B2D3C] block" />
            <EditableText contentKey="wimbledon_description" page="wimbledon" defaultValue="Our cozy, high-street studio on Wimbledon Hill Road, ideal for baby clay imprints, friendly gatherings, and relaxed creative sessions." adminMode={adminMode} className="text-[#1B2D3C] text-sm md:text-base leading-relaxed font-medium" />
          </div>

          {lightboxIndex !== null && (
            <div
              className="fixed inset-0 z-50 bg-[#1B2D3C]/90 flex items-center justify-center p-4"
              onClick={() => setLightboxIndex(null)}
            >
              <button
                onClick={() => setLightboxIndex(null)}
                className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + Images.wimbledonGallery.length) % Images.wimbledonGallery.length); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <EditableImage
                contentKey={`wimbledon_lightbox_${lightboxIndex}`}
                page="wimbledon"
                defaultSrc={Images.wimbledonGallery[lightboxIndex]}
                alt={`Gallery image ${lightboxIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
                adminMode={adminMode}
              />
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % Images.wimbledonGallery.length); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          )}

                    {/* Booking Calendar Section */}
          <div className="border-t border-[#1B2D3C]/10 pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#1B2D3C]" />
              <h3 className="font-heading text-xl font-black text-[#1B2D3C]">
                <EditableText contentKey="wimbledon_book_heading" page="wimbledon" defaultValue="Book a Session" adminMode={adminMode} className="font-heading text-xl text-[#1B2D3C]" />
              </h3>
            </div>

            <div className="bg-[#FFFFFF] p-3 flex items-start justify-center">
              <DayPicker
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                disabled={[{ dayOfWeek: [1] }, { before: new Date() }, ...busyDates]}
                weekStartsOn={1}
              />
            </div>

            {timeSlots.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]"><EditableText contentKey="wimbledon_slots_label" page="wimbledon" defaultValue="Available 2-hour slots" adminMode={adminMode} className="text-[10px] uppercase tracking-widest text-[#1B2D3C]" /></span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {timeSlots.map((slot) => {
                    const remaining = slotCapacity[slot] ?? MAX_PAINTERS;
                    const isFull = remaining === 0;
                    return (
                      <button
                        key={slot}
                        onClick={() => !isFull && setTime(slot)}
                        disabled={isFull}
                        className={`py-3 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                          time === slot
                            ? 'bg-[#1B2D3C] text-white border-[#1B2D3C]'
                            : isFull
                              ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                              : 'bg-white text-[#1B2D3C] border-[#1B2D3C]/20 hover:border-[#1B2D3C]'
                        }`}
                      >
                        {slot}
                        <span className="block text-[9px] font-normal normal-case tracking-normal mt-0.5">
                          {isFull ? 'Full' : `${remaining} spaces`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]"><EditableText contentKey="wimbledon_painters_label" page="wimbledon" defaultValue="Number of Painters" adminMode={adminMode} className="text-[10px] uppercase tracking-widest text-[#1B2D3C]" /></label>
              <div className="flex items-center border border-[#1B2D3C]/20 bg-white overflow-hidden">
                <button type="button" onClick={() => setPainters(p => Math.max(1, (p === '' ? 1 : p) - 1))} className="px-4 py-3 text-lg font-black text-[#1B2D3C] hover:bg-[#D6E2E9]/40 transition-all cursor-pointer select-none">−</button>
                <span className="flex-1 text-center text-sm font-black text-[#1B2D3C]">{painters === '' ? 1 : painters}</span>
                <button type="button" onClick={() => setPainters(p => Math.min(MAX_PAINTERS, (p === '' ? 1 : p) + 1))} className="px-4 py-3 text-lg font-black text-[#1B2D3C] hover:bg-[#D6E2E9]/40 transition-all cursor-pointer select-none">+</button>
              </div>
            </div>

            {date && time && (
              <div className="bg-[#D6E2E9]/50 p-3 text-sm font-bold text-[#1B2D3C]">
                <p>{format(date, 'EEEE, do MMMM yyyy')} · {time} – {parseInt(time.split(':')[0], 10) + 2}:00 · {painters === '' ? 1 : painters} painter{(painters === '' ? 1 : painters) !== 1 ? 's' : ''}</p>
                <p className="text-[10px] font-normal mt-1 text-emerald-700">
                  {(slotCapacity[time] ?? MAX_PAINTERS)} {(slotCapacity[time] ?? MAX_PAINTERS) === 1 ? 'space' : 'spaces'} available
                </p>
              </div>
            )}

            <button
              onClick={handleBookDate}
              disabled={!date || !time}
              className="w-full py-3.5 bg-[#DBE7E4] text-[#1B2D3C] font-bold text-xs uppercase tracking-widest hover:bg-[#D6E2E9] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <EditableText contentKey="wimbledon_book_button" page="wimbledon" defaultValue="Book This Session" adminMode={adminMode} className="text-xs uppercase tracking-widest" /> <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage('book')}
              className="w-full py-3 bg-white text-[#1B2D3C] font-bold text-xs uppercase tracking-widest border border-[#1B2D3C]/20 hover:bg-[#FFFFFF] transition-all cursor-pointer"
            >
              <EditableText contentKey="wimbledon_choose_studio_button" page="wimbledon" defaultValue="Choose a Different Studio" adminMode={adminMode} className="text-xs uppercase tracking-widest" />
            </button>
          </div>
          <div className="border-t border-[#1B2D3C]/10 pt-8 space-y-6">
            <h3 className="font-heading text-2xl font-black text-[#1B2D3C]">
              <EditableText contentKey="wimbledon_contact_heading" page="wimbledon" defaultValue="Contact & Location" adminMode={adminMode} className="font-heading text-2xl text-[#1B2D3C]" />
            </h3>

            <div className="aspect-video w-full bg-[#D6E2E9]/50 overflow-hidden rounded-lg">
              <iframe
                title="Wimbledon Studio Location"
                src="https://maps.google.com/maps?q=52+Wimbledon+Hill+Road%2C+Wimbledon+SW19+7PA&t=&z=15&ie=UTF8&iwloc=near&output=embed"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="space-y-4 text-sm text-[#1B2D3C] font-semibold">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#DBE7E4] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[#1B2D3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold"><EditableText contentKey="wimbledon_address_label" page="wimbledon" defaultValue="Address:" adminMode={adminMode} className="text-sm text-[#1B2D3C]" /></p>
                  <p className="text-stone-600"><EditableText contentKey="wimbledon_address" page="wimbledon" defaultValue="52 Wimbledon Hill Road, Wimbledon SW19 7PA" adminMode={adminMode} className="text-sm text-stone-600" /></p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#DBE7E4] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[#1B2D3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold"><EditableText contentKey="wimbledon_phone_label" page="wimbledon" defaultValue="Phone:" adminMode={adminMode} className="text-sm text-[#1B2D3C]" /></p>
                  <a href="tel:02037704499" className="text-[#1B2D3C] hover:underline font-bold"><EditableText contentKey="wimbledon_phone" page="wimbledon" defaultValue="020 37704499" adminMode={adminMode} className="text-sm text-[#1B2D3C]" /></a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#1B2D3C]/10 pt-8 space-y-6">
            <h3 className="font-heading text-2xl font-black text-[#1B2D3C]">
              <EditableText contentKey="wimbledon_hours_heading" page="wimbledon" defaultValue="Opening Hours" adminMode={adminMode} className="font-heading text-2xl text-[#1B2D3C]" />
            </h3>
            <div className="divide-y divide-[#1B2D3C]/10 text-sm text-[#1B2D3C] font-medium">
              {OPENING_HOURS.map(({ day, time }) => (
                <div key={day} className="flex justify-between py-2.5">
                  <span className="font-bold"><EditableText contentKey={`wimbledon_hours_${day.toLowerCase().replace(/[^a-z]/g, '_')}`} page="wimbledon" defaultValue={day} adminMode={adminMode} className="text-sm text-[#1B2D3C]" /></span>
                  <span className={time.includes('Closed') ? 'text-stone-500' : ''}><EditableText contentKey={`wimbledon_hours_${day.toLowerCase().replace(/[^a-z]/g, '_')}_time`} page="wimbledon" defaultValue={time} adminMode={adminMode} className="text-sm text-[#1B2D3C]" /></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
