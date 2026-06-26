import { useState, useEffect } from 'react';
import { Images } from '../images';
import { Page } from '../types';
import { DayPicker } from 'react-day-picker';
import { format, getDay } from 'date-fns';
import {Clock, Calendar as CalendarIcon, ArrowRight, ChevronLeft, ChevronRight, X} from 'lucide-react';
import 'react-day-picker/dist/style.css';
import { getRemainingCapacity } from '../lib/bookings';

interface PutneyViewProps {
  setCurrentPage: (page: Page) => void;
}

const MAX_PAINTERS = 30;

const OPENING_HOURS = [
  { day: 'Monday', time: 'Closed (except school holidays)' },
  { day: 'Tuesday - Saturday', time: '10:00am - 6:00pm' },
  { day: 'Sunday', time: '11:00am - 5:00pm' },
];

function getTimeSlots(date: Date): string[] {
  const day = getDay(date);
  // Tue - Sun: 10am - 6pm, 4 x 2-hour slots
  if (day >= 2 || day === 0) {
    return ['10:00', '12:00', '14:00', '16:00'];
  }
  return [];
}


export default function PutneyView({ setCurrentPage }: PutneyViewProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mobileGalleryIndex, setMobileGalleryIndex] = useState(0);

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | undefined>(undefined);
  const [painters, setPainters] = useState<number | ''>(1);
  const [slotCapacity, setSlotCapacity] = useState<Record<string, number>>({});

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
      remaining: await getRemainingCapacity('Putney', dateStr, slot),
    }))).then((results) => {
      const map: Record<string, number> = {};
      results.forEach(({ slot, remaining }) => {
        map[slot] = remaining;
      });
      setSlotCapacity(map);
    });
  }, [date]);

  const handleBookDate = async () => {
    if (!date || !time) return;

    const existing = localStorage.getItem('pp_booking_draft');
    const remaining = await getRemainingCapacity('Putney', format(date, 'yyyy-MM-dd'), time);
    const paintersCount = painters === '' ? 1 : painters;
    if (paintersCount > remaining) {
      alert(`This session only has room for ${remaining} more painter${remaining === 1 ? "" : "s"}. Please choose a different time or reduce the number of painters.`);
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

  const timeSlots = date ? getTimeSlots(date) : [];

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Hero Section */}
      <section className="relative h-[60vh] overflow-hidden">
        <img
          src={Images.putneyStudio}
          alt="Pitter Potter Putney Studio Exterior"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B2D3C]/40 via-[#1B2D3C]/20 to-[#1B2D3C]/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-[#1B2D3C] px-4 bg-[#DBE7E4]/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl">
            <img
              src={Images.logo}
              alt="Pitter Potter Logo"
              className="h-16 sm:h-20 w-auto object-contain mx-auto mb-4"
            />
            <p className="text-xl md:text-2xl font-light text-[#1B2D3C]">
              Putney SW15
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 -mt-20 relative z-10 pb-20">
        <div className="bg-white shadow-sm p-8 md:p-12 space-y-8">
          {/* Desktop grid */}
          <div className="hidden md:grid grid-cols-3 gap-4">
            {Images.putneyGallery.map((src, idx) => (
              <div key={idx} className="aspect-[4/3] overflow-hidden rounded-lg">
                <button
                  onClick={() => setLightboxIndex(idx)}
                  className="w-full h-full cursor-pointer"
                >
                  <img
                    src={src}
                    alt="Our Putney Studio gallery {idx + 1}"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
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
                <img
                  src={Images.putneyGallery[mobileGalleryIndex]}
                  alt="Our Putney Studio gallery {mobileGalleryIndex + 1}"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => setMobileGalleryIndex((mobileGalleryIndex - 1 + Images.putneyGallery.length) % Images.putneyGallery.length)}
                className="p-2 bg-[#DBE7E4] text-[#1B2D3C] rounded-lg hover:bg-[#D6E2E9] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-bold text-[#1B2D3C]">
                {mobileGalleryIndex + 1} / {Images.putneyGallery.length}
              </span>
              <button
                onClick={() => setMobileGalleryIndex((mobileGalleryIndex + 1) % Images.putneyGallery.length)}
                className="p-2 bg-[#DBE7E4] text-[#1B2D3C] rounded-lg hover:bg-[#D6E2E9] transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="font-heading text-3xl font-black text-[#1B2D3C]">
              Our Putney Studio
            </h2>
            <p className="text-[#1B2D3C] text-sm md:text-base leading-relaxed font-medium">
              Our bright, airy flagship studio on Upper Richmond Road, perfect for individuals, families, and creative birthday parties. Step inside and bring unglazed pottery to vibrant life with our premium glazes and expert guidance.
            </p>
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
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + Images.putneyGallery.length) % Images.putneyGallery.length); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <img
                src={Images.putneyGallery[lightboxIndex]}
                alt={"Gallery image " + (lightboxIndex + 1)}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % Images.putneyGallery.length); }}
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
              <h3 className="font-heading text-xl font-black text-[#1B2D3C]">Book a Session</h3>
            </div>

            <div className="bg-[#FFFFFF] p-3 flex items-start justify-center">
              <DayPicker
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                disabled={{ dayOfWeek: [1] }}
                weekStartsOn={1}
              />
            </div>

            {timeSlots.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]">Available 2-hour slots</span>
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
                      <span className="block text-[9px] font-normal normal-case tracking-normal">
                        {slotCapacity[slot] ?? MAX_PAINTERS} left
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]">Number of Painters</label>
              <input
                type="number"
                min={1}
                max={20}
                value={painters}
                onChange={(e) => setPainters(e.target.value === '' ? '' : Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="w-full py-2.5 px-3 border border-[#1B2D3C]/20 bg-white text-sm font-bold text-[#1B2D3C] focus:outline-none focus:bg-[#D6E2E9]/20"
              />
            </div>

            {date && time && (
              <div className="bg-[#D6E2E9]/50 p-3 text-sm font-bold text-[#1B2D3C]">
                <p>{format(date, 'EEEE, do MMMM yyyy')} · {time} – {parseInt(time.split(':')[0], 10) + 2}:00 · {painters === '' ? 1 : painters} painter{(painters === '' ? 1 : painters) !== 1 ? 's' : ''}</p>
                <p className="text-[10px] font-normal mt-1">
                  {(slotCapacity[time] ?? MAX_PAINTERS)} spaces remaining for this session
                </p>
              </div>
            )}

            <button
              onClick={handleBookDate}
              disabled={!date || !time}
              className="w-full py-3.5 bg-[#1B2D3C] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#486581] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Book This Session <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage('book')}
              className="w-full py-3 bg-white text-[#1B2D3C] font-bold text-xs uppercase tracking-widest border border-[#1B2D3C]/20 hover:bg-[#FFFFFF] transition-all cursor-pointer"
            >
              Choose a Different Studio
            </button>
          </div>
          <div className="border-t border-[#1B2D3C]/10 pt-8 space-y-6">
            <h3 className="font-heading text-2xl font-black text-[#1B2D3C]">Contact & Location</h3>

            <div className="aspect-video w-full bg-[#D6E2E9]/50 overflow-hidden rounded-lg">
              <iframe
                title="Putney Studio Location"
                src="https://maps.google.com/maps?q=234+Upper+Richmond+Road%2C+Putney+SW15+6TG&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0"
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
                  <p className="font-bold">Address:</p>
                  <p className="text-stone-600">234 Upper Richmond Road, Putney SW15 6TG</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#1B2D3C] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold">Phone:</p>
                  <a href="tel:02087881635" className="text-[#1B2D3C] hover:underline font-bold">020 87881635</a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#1B2D3C]/10 pt-8 space-y-6">
            <h3 className="font-heading text-2xl font-black text-[#1B2D3C]">Opening Hours</h3>
            <div className="divide-y divide-[#1B2D3C]/10 text-sm text-[#1B2D3C] font-medium">
              {OPENING_HOURS.map(({ day, time }) => (
                <div key={day} className="flex justify-between py-2.5">
                  <span className="font-bold">{day}</span>
                  <span className={time.includes('Closed') ? 'text-stone-500' : ''}>{time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
