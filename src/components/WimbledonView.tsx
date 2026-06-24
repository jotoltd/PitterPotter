import { useState } from 'react';
import { Images } from '../images';
import { Page } from '../types';
import { DayPicker } from 'react-day-picker';
import { format, getDay } from 'date-fns';
import { Clock, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import 'react-day-picker/dist/style.css';

interface WimbledonViewProps {
  setCurrentPage: (page: Page) => void;
}

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

export default function WimbledonView({ setCurrentPage }: WimbledonViewProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | undefined>(undefined);
  const [painters, setPainters] = useState<number>(1);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setTime(undefined);
  };

  const handleBookDate = () => {
    if (!date || !time) return;

    const existing = localStorage.getItem('pp_booking_draft');
    const draft = existing ? JSON.parse(existing) : {};
    draft.studio = 'Wimbledon';
    draft.date = format(date, 'yyyy-MM-dd');
    draft.time = time;
    draft.sessionType = draft.sessionType || 'painting';
    draft.paintersCount = painters;
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
        <img
          src={Images.wimbledonStudio}
          alt="Pitter Potter Wimbledon Studio Exterior"
          className="w-full h-full object-cover rounded-lg"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B2D3C]/40 via-[#1B2D3C]/20 to-[#1B2D3C]/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="font-heading text-5xl md:text-7xl font-black tracking-tight mb-4">
              Pitter Potter Wimbledon
            </h1>
            <p className="text-xl md:text-2xl font-light text-[#D6E2E9]">
              SW19 Wimbledon Studio
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 -mt-20 relative z-10 pb-20">
        <div className="bg-white shadow-sm p-8 md:p-12 space-y-8">
          <div className="space-y-4">
            <h2 className="font-heading text-3xl font-black text-[#1B2D3C]">
              Our Wimbledon Studio
            </h2>
            <p className="text-[#1B2D3C] text-sm md:text-base leading-relaxed font-medium">
              Our cozy, high-street location on Wimbledon Hill Road, ideal for baby clay imprints, seasonal pottery making, and friendly gatherings. Experience the joy of painting pottery in our welcoming studio environment.
            </p>
          </div>

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
                      className={`py-3 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                        time === slot
                          ? 'bg-[#DBE7E4] text-[#1B2D3C] border-[#DBE7E4]'
                          : 'bg-white text-[#1B2D3C] border-[#1B2D3C]/20 hover:border-[#DBE7E4]'
                      }`}
                    >
                      {slot}
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
                onChange={(e) => setPainters(parseInt(e.target.value) || 1)}
                className="w-full py-2.5 px-3 border border-[#1B2D3C]/20 bg-white text-sm font-bold text-[#1B2D3C] focus:outline-none focus:bg-[#D6E2E9]/20"
              />
            </div>

            {date && time && (
              <div className="bg-[#D6E2E9]/50 p-3 text-sm font-bold text-[#1B2D3C]">
                {format(date, 'EEEE, do MMMM yyyy')} · {time} – {parseInt(time.split(':')[0], 10) + 2}:00 · {painters} painter{painters !== 1 ? 's' : ''}
              </div>
            )}

            <button
              onClick={handleBookDate}
              disabled={!date || !time}
              className="w-full py-3.5 bg-[#DBE7E4] text-[#1B2D3C] font-bold text-xs uppercase tracking-widest hover:bg-[#D6E2E9] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
          {/* Map */}
          <div className="border-t border-[#1B2D3C]/10 pt-8 space-y-4">
            <h3 className="font-heading text-2xl font-black text-[#1B2D3C]">Find Us</h3>
            <div className="aspect-video w-full bg-[#D6E2E9]/50 overflow-hidden">
              <iframe
                title="Wimbledon Studio Location"
                src="https://maps.google.com/maps?q=52+Wimbledon+Hill+Road,+Wimbledon+SW19+7PA&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <p className="text-xs text-[#1B2D3C]/80 font-medium">52 Wimbledon Hill Road, Wimbledon SW19 7PA</p>
          </div>

          <div className="border-t border-[#1B2D3C]/10 pt-8 space-y-6">
            <h3 className="font-heading text-2xl font-black text-[#1B2D3C]">Contact & Location</h3>

            <div className="space-y-4 text-sm text-[#1B2D3C] font-semibold">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#DBE7E4] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[#1B2D3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold">Address:</p>
                  <p className="text-stone-600">52 Wimbledon Hill Road, Wimbledon SW19 7PA</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#DBE7E4] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[#1B2D3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold">Phone:</p>
                  <a href="tel:02037704499" className="text-[#1B2D3C] hover:underline font-bold">020 37704499</a>
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
