import { useState, useEffect } from 'react';
import { Page, BookingInquiry } from '../types';
import { DayPicker } from 'react-day-picker';
import { format, getDay } from 'date-fns';
import { Clock, Calendar as CalendarIcon, ArrowRight, Users, MapPin, Gift, Heart, Briefcase } from 'lucide-react';
import 'react-day-picker/dist/style.css';
import { getRemainingCapacity, createPublicBooking } from '../lib/bookings';

type PartyType = 'birthday' | 'baby-shower-hen' | 'corporate';
type Studio = 'Putney' | 'Wimbledon';

interface PartyBookingViewProps {
  partyType: PartyType;
  studio: Studio;
  setCurrentPage: (page: Page) => void;
}

const PARTY_INFO: Record<PartyType, { title: string; price: string; description: string; icon: typeof Gift }> = {
  birthday: {
    title: 'Birthday Party',
    price: '£28.95 per head',
    description: 'A painting party at Pitter Potter is a fun and creative way of celebrating birthdays. We provide the space, materials and help to ensure everything runs smoothly. Included in the cost is the studio fee and an item of pottery up to the value of £22.95.',
    icon: Gift,
  },
  'baby-shower-hen': {
    title: 'Baby Shower / Hen Party',
    price: '£28.95 per head',
    description: 'For the bride, groom or parents to be who are seeking a creative alternative to a traditional celebration. Get everyone to paint a piece for the happy couple or the new addition to the family.',
    icon: Heart,
  },
  corporate: {
    title: 'Corporate Event',
    price: 'Custom Packages',
    description: 'Whether it\'s a team-building exercise or an end-of-year alternative to a Christmas party, Pitter Potter provides a relaxing and meditative activity for your business.',
    icon: Briefcase,
  },
};

const MAX_PAINTERS: Record<Studio, number> = { Putney: 30, Wimbledon: 25 };

function getTimeSlots(date: Date): string[] {
  const day = getDay(date);
  if (day >= 2 || day === 0) {
    return ['10:00', '12:00', '14:00', '16:00'];
  }
  return [];
}

export default function PartyBookingView({ partyType, studio, setCurrentPage }: PartyBookingViewProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | undefined>(undefined);
  const [guests, setGuests] = useState<number | ''>(8);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [slotCapacity, setSlotCapacity] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [error, setError] = useState('');

  const info = PARTY_INFO[partyType];
  const IconComponent = info.icon;

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
      remaining: await getRemainingCapacity(studio, dateStr, slot),
    }))).then((results) => {
      const map: Record<string, number> = {};
      results.forEach(({ slot, remaining }) => {
        map[slot] = remaining;
      });
      setSlotCapacity(map);
    });
  }, [date, studio]);

  const handleSubmit = async () => {
    setError('');
    if (!date || !time || !name || !phone) {
      const missing = [
        !date && 'Date',
        !time && 'Time',
        !name && 'Name',
        !phone && 'Phone',
      ].filter(Boolean).join(', ');
      setError(`Please fill in the required fields: ${missing}`);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setError('Please enter a valid email address or leave it blank');
      return;
    }

    const guestCount = guests === '' ? 1 : guests;
    const remaining = await getRemainingCapacity(studio, format(date, 'yyyy-MM-dd'), time);
    if (guestCount > remaining) {
      setError(`This session only has room for ${remaining} more guest${remaining === 1 ? '' : 's'}. Please choose a different time or reduce the group size.`);
      return;
    }

    const sessionTypeMap: Record<PartyType, 'birthday-party' | 'baby-shower-hen' | 'corporate'> = {
      birthday: 'birthday-party',
      'baby-shower-hen': 'baby-shower-hen',
      corporate: 'corporate',
    };

    const bookingId = `PP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    const booking: BookingInquiry = {
      id: bookingId,
      studio,
      name,
      email,
      phone,
      date: format(date, 'yyyy-MM-dd'),
      time,
      paintersCount: guestCount,
      sessionType: sessionTypeMap[partyType],
      notes: `[${info.title}] ${notes}`.trim(),
      status: 'pending',
      source: 'online',
      requestDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    };

    setSubmitting(true);
    try {
      await createPublicBooking(booking);
      setBookingRef(bookingId);
      setSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit booking. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const timeSlots = date ? getTimeSlots(date) : [];

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="p-4 bg-[#D6E2E9] rounded-full inline-block">
            <IconComponent className="w-8 h-8 text-[#1B2D3C]" />
          </div>
          <h2 className="font-heading text-2xl font-black text-[#1B2D3C]">Booking Request Sent!</h2>
          <p className="text-sm text-[#1B2D3C]/70 font-medium">
            Your {info.title.toLowerCase()} booking at our {studio} studio has been submitted.
            We'll be in touch shortly to confirm your event.
          </p>
          <div className="bg-[#D6E2E9]/30 p-4 rounded-lg text-left space-y-2 text-xs font-semibold text-[#1B2D3C]">
            <p><span className="font-bold">Reference:</span> {bookingRef}</p>
            <p><span className="font-bold">Event:</span> {info.title}</p>
            <p><span className="font-bold">Studio:</span> {studio}</p>
            <p><span className="font-bold">Date:</span> {date && format(date, 'EEEE, do MMMM yyyy')}</p>
            <p><span className="font-bold">Time:</span> {time}</p>
            <p><span className="font-bold">Guests:</span> {guests === '' ? 1 : guests}</p>
            <p><span className="font-bold">Name:</span> {name}</p>
            <p><span className="font-bold">Phone:</span> {phone}</p>
          </div>
          <button
            onClick={() => setCurrentPage('home')}
            className="w-full py-3 bg-[#1B2D3C] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#486581] transition-all cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Header */}
      <section className="bg-[#D6E2E9]/30 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-[#D6E2E9] text-[#1B2D3C] border border-[#1B2D3C]/20 rounded-lg">
              <IconComponent className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-black text-[#1B2D3C]">
            {info.title}
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#1B2D3C]/70">
            <MapPin className="w-4 h-4" />
            <span>{studio} Studio</span>
          </div>
          <p className="text-[#1B2D3C] font-black text-lg">{info.price}</p>
          <p className="text-[#1B2D3C]/85 text-xs sm:text-sm font-medium leading-relaxed max-w-xl mx-auto">
            {info.description}
          </p>
        </div>
      </section>

      {/* Booking Form */}
      <section className="max-w-2xl mx-auto px-4 py-12 space-y-8 pb-20">
        {/* Calendar */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#1B2D3C]" />
            <h3 className="font-heading text-xl font-black text-[#1B2D3C]">Choose a Date</h3>
          </div>
          <div className="bg-[#FFFFFF] border border-[#1B2D3C]/10 rounded-lg p-3 flex items-start justify-center">
            <DayPicker
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              disabled={{ dayOfWeek: [1], before: new Date() }}
              weekStartsOn={1}
            />
          </div>
        </div>

        {/* Time Slots */}
        {timeSlots.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#1B2D3C]" />
              <h3 className="font-heading text-lg font-black text-[#1B2D3C]">Choose a Time Slot</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setTime(slot)}
                  disabled={(slotCapacity[slot] ?? MAX_PAINTERS[studio]) === 0}
                  className={`py-3 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer rounded-lg ${
                    time === slot
                      ? 'bg-[#1B2D3C] text-white border-[#1B2D3C]'
                      : (slotCapacity[slot] ?? MAX_PAINTERS[studio]) === 0
                        ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                        : 'bg-white text-[#1B2D3C] border-[#1B2D3C]/20 hover:border-[#1B2D3C]'
                  }`}
                >
                  {slot}
                  <span className="block text-[9px] font-normal normal-case tracking-normal">
                    {slotCapacity[slot] ?? MAX_PAINTERS[studio]} spots left
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Guests */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#1B2D3C]" />
            <h3 className="font-heading text-lg font-black text-[#1B2D3C]">Number of Guests</h3>
          </div>
          <input
            type="number"
            min={1}
            max={30}
            value={guests}
            onChange={(e) => setGuests(e.target.value === '' ? '' : Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
            className="w-full py-2.5 px-3 border border-[#1B2D3C]/20 bg-white text-sm font-bold text-[#1B2D3C] rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20"
          />
        </div>

        {/* Summary */}
        {date && time && (
          <div className="bg-[#D6E2E9]/50 p-4 rounded-lg text-sm font-bold text-[#1B2D3C] space-y-1">
            <p>{info.title} · {studio} Studio</p>
            <p>{format(date, 'EEEE, do MMMM yyyy')} · {time} – {parseInt(time.split(':')[0], 10) + 2}:00</p>
            <p>{guests === '' ? 1 : guests} guest{(guests === '' ? 1 : guests) !== 1 ? 's' : ''}</p>
            <p className="text-[10px] font-normal text-[#1B2D3C]/60">
              {(slotCapacity[time] ?? MAX_PAINTERS[studio])} spaces remaining for this session
            </p>
          </div>
        )}

        {/* Contact Details */}
        <div className="space-y-4 border-t border-[#1B2D3C]/10 pt-8">
          <h3 className="font-heading text-lg font-black text-[#1B2D3C]">Your Details</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#1B2D3C]/20 text-sm text-[#1B2D3C] font-bold rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#1B2D3C]/20 text-sm text-[#1B2D3C] font-bold rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Phone *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#1B2D3C]/20 text-sm text-[#1B2D3C] font-bold rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20"
                placeholder="07xxx xxxxxx"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Additional Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 border border-[#1B2D3C]/20 text-sm text-[#1B2D3C] font-medium rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20 resize-none"
                placeholder="Any special requests, dietary requirements, age of birthday child, etc."
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!date || !time || !name || !phone || submitting}
          className="w-full py-3.5 bg-[#1B2D3C] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#486581] transition-all cursor-pointer flex items-center justify-center gap-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : <>{info.title === 'Corporate Event' ? 'Submit Enquiry' : 'Book Party'} <ArrowRight className="w-4 h-4" /></>}
        </button>

        <button
          onClick={() => setCurrentPage('parties')}
          className="w-full py-3 bg-white text-[#1B2D3C] font-bold text-xs uppercase tracking-widest border border-[#1B2D3C]/20 hover:bg-[#D6E2E9]/20 transition-all cursor-pointer rounded-lg"
        >
          Back to Parties & Events
        </button>
      </section>
    </div>
  );
}
