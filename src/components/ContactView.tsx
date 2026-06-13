import { useState, useEffect, FormEvent } from 'react';
import { Mail, Phone, MapPin, Clock, Calendar as CalendarIcon, Users, MessageSquare, CheckCircle2, Ticket, X, Sparkles, Database } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { BookingInquiry, Page } from '../types';
import 'react-day-picker/dist/style.css';

interface ContactViewProps {
  initialPainters?: number;
}

export default function ContactView({ initialPainters = 1 }: ContactViewProps) {
  // Form State
  const [studio, setStudio] = useState<'Putney' | 'Wimbledon'>('Putney');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);
  const [time, setTime] = useState('11:30');
  const [sessionType, setSessionType] = useState<'painting' | 'birthday-party' | 'baby-shower-hen' | 'clay-imprints' | 'corporate'>('painting');
  const [paintersCount, setPaintersCount] = useState<number>(initialPainters);
  const [notes, setNotes] = useState('');

  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Save draft to localStorage
  const saveDraft = () => {
    const draft = {
      studio,
      name,
      email,
      phone,
      date: date ? format(date, 'yyyy-MM-dd') : '',
      time,
      sessionType,
      paintersCount,
      notes,
      currentStep,
    };
    localStorage.setItem('pp_booking_draft', JSON.stringify(draft));
  };

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem('pp_booking_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setStudio(parsed.studio || 'Putney');
        setName(parsed.name || '');
        setEmail(parsed.email || '');
        setPhone(parsed.phone || '');
        if (parsed.date) setDate(new Date(parsed.date));
        setTime(parsed.time || '11:30');
        setSessionType(parsed.sessionType || 'painting');
        setPaintersCount(parsed.paintersCount || 1);
        setNotes(parsed.notes || '');
        setCurrentStep(parsed.currentStep || 1);
      } catch (err) {
        console.error('Failed to load draft:', err);
      }
    }
  }, []);

  // Clear draft
  const clearDraft = () => {
    localStorage.removeItem('pp_booking_draft');
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      saveDraft();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      saveDraft();
    }
  };

  const canProceedToStep = (step: number) => {
    if (step === 2) return studio !== '';
    if (step === 3) return name && email && phone;
    if (step === 4) return date && time && paintersCount > 0;
    return true;
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setShowCalendar(false);
  };

  // Check availability for selected date/time
  const checkAvailability = (date: Date | undefined, time: string) => {
    if (!date) return { available: true, message: '' };
    const saved = localStorage.getItem('pp_inquiries');
    if (!saved) return { available: true, message: '' };
    const inquiries = JSON.parse(saved);
    const dateStr = format(date, 'yyyy-MM-dd');
    const conflicts = inquiries.filter((inq: BookingInquiry) => 
      inq.date === dateStr && inq.time === time
    );
    if (conflicts.length >= 4) {
      return { available: false, message: 'This time slot is fully booked' };
    }
    return { available: true, message: `${4 - conflicts.length} slots available` };
  };

  const availability = checkAvailability(date, time);

  // Response simulation state
  const [submittedInquiry, setSubmittedInquiry] = useState<BookingInquiry | null>(null);
  const [storedInquiries, setStoredInquiries] = useState<BookingInquiry[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Load drafts and stored items from localStorage
  useEffect(() => {
    // Check if there was an estimator or design board draft
    const draftNotes = localStorage.getItem('pp_draft_notes');
    const draftPainters = localStorage.getItem('pp_draft_painters');
    const draftStudio = localStorage.getItem('pp_selected_studio');
    if (draftStudio === 'Putney' || draftStudio === 'Wimbledon') {
      setStudio(draftStudio);
      localStorage.removeItem('pp_selected_studio');
    }
    if (draftNotes) {
      setNotes((prev) => prev ? `${prev}\n\n${draftNotes}` : draftNotes);
      localStorage.removeItem('pp_draft_notes');
    }
    if (draftPainters) {
      setPaintersCount(parseInt(draftPainters));
      localStorage.removeItem('pp_draft_painters');
    }

    // Load existing inquiries to let users review their bookings
    const saved = localStorage.getItem('pp_inquiries');
    if (saved) {
      try {
        setStoredInquiries(JSON.parse(saved));
      } catch (err) {
        console.error('Error parsing inquiries', err);
      }
    }
  }, []);

  // Calculate estimated total on the form
  const getCalculatedPrice = () => {
    if (sessionType === 'painting') {
      return (paintersCount * 5.95); // studio fee only, pottery is paid on day
    } else if (sessionType === 'birthday-party' || sessionType === 'baby-shower-hen') {
      return (paintersCount * 28.95);
    } else if (sessionType === 'clay-imprints') {
      return (paintersCount * 15.00); // flat baseline placeholder for custom imprint assistance
    }
    return 0; // Custom corporate pricing
  };

  const currentEstimate = getCalculatedPrice();

  // Handling submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !date) {
      alert('Please fill out all required fields marked with *');
      return;
    }

    const newInquiry: BookingInquiry = {
      id: `PP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      studio,
      name,
      email,
      phone,
      date: format(date, 'yyyy-MM-dd'),
      time,
      paintersCount,
      sessionType,
      notes: notes || undefined,
      status: 'pending',
      requestDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      estimatedPrice: currentEstimate > 0 ? currentEstimate : undefined,
    };

    const updated = [newInquiry, ...storedInquiries];
    setStoredInquiries(updated);
    localStorage.setItem('pp_inquiries', JSON.stringify(updated));
    setSubmittedInquiry(newInquiry);
    setShowSuccessModal(true);

    // Simulate confirmation email
    console.log('📧 Confirmation Email Sent:');
    console.log(`To: ${email}`);
    console.log(`Subject: Booking Confirmation - Reference: ${newInquiry.id}`);
    console.log(`Body: Thank you ${name}! Your booking for ${format(date, 'PPP')} at ${time} has been received. We'll confirm your table within 24 hours.`);

    // Clear form inputs and draft
    clearDraft();
    setName('');
    setEmail('');
    setPhone('');
    setNotes('');
  };

  const deleteInquiry = (id: string) => {
    const updated = storedInquiries.filter(i => i.id !== id);
    setStoredInquiries(updated);
    localStorage.setItem('pp_inquiries', JSON.stringify(updated));
  };

  const simulateConfirmation = (id: string) => {
    const updated = storedInquiries.map(i => {
      if (i.id === id) {
        return { ...i, status: 'confirmed' as const };
      }
      return i;
    });
    setStoredInquiries(updated);
    localStorage.setItem('pp_inquiries', JSON.stringify(updated));
  };

  return (
    <div id="contact-view" className="space-y-16 pb-20 pt-6">
      {/* Title Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center space-y-4 max-w-3xl">
        <span className="text-xs tracking-widest text-[#74919e] font-black uppercase block">Secure Your Easel</span>
        <h1 className="font-heading text-4xl md:text-5xl font-black italic text-[#1B2D3C] tracking-tight">Studio Contact & Booking</h1>
        <p className="text-[#1B2D3C]/85 text-xs sm:text-sm font-medium leading-relaxed">
          Planning a weekend painting trip, inquiring for a group birthday, or looking for clay imprints? Give us a call, drop an email, or submit a session inquiry form below.
        </p>
      </div>

      {/* Main Grid: Info Cards (Left) & Form (Right) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Branch Info Columns - Left */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Putney Branch */}
          <div className="bg-white p-6 border-2 border-[#1B2D3C]  space-y-4 relative overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#74919e]" />
            <div className="inline-flex py-1 px-3.5 bg-[#F0F4F8] border border-[#1B2D3C] text-[#74919e] text-[10px] font-bold uppercase tracking-wider rounded-none">
              Putney Studio
            </div>
            <div className="space-y-3.5 text-xs text-stone-600 font-semibold">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-5 h-5 text-[#74919e] shrink-0 mt-0.5" />
                <span className="leading-relaxed">234 Upper Richmond Road, Putney SW15 6TG</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-5 h-5 text-[#74919e]" />
                <a href="tel:02087881635" className="text-[#1B2D3C] hover:text-[#74919e] font-black text-sm">
                  020 87881635
                </a>
              </div>
            </div>
          </div>

          {/* Wimbledon Branch */}
          <div className="bg-white p-6 border-2 border-[#1B2D3C]  space-y-4 relative overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#74919e]/75" />
            <div className="inline-flex py-1 px-3.5 bg-[#F0F4F8] border border-[#1B2D3C]/75 text-[#74919e]/75 text-[10px] font-bold uppercase tracking-wider rounded-none">
              Wimbledon Studio
            </div>
            <div className="space-y-3.5 text-xs text-stone-600 font-semibold">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-5 h-5 text-[#74919e]/75 shrink-0 mt-0.5" />
                <span className="leading-relaxed">52 Wimbledon Hill Road, Wimbledon SW19 7PA</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-5 h-5 text-[#74919e]/75" />
                <a href="tel:02037704499" className="text-[#1B2D3C] hover:text-[#74919e]/75 font-black text-sm">
                  020 37704499
                </a>
              </div>
            </div>
          </div>

          {/* Opening & General Contact info */}
          <div className="bg-[#D9E2EC]/50 p-6 border-2 border-[#1B2D3C]  space-y-4 rounded-lg">
            <div className="flex items-center gap-2 border-b-2 border-[#1B2D3C] pb-2">
              <Clock className="w-4.5 h-4.5 text-[#74919e]" />
              <h3 className="font-heading font-black text-[#1B2D3C] text-sm md:text-base uppercase tracking-wider">Studio Timings</h3>
            </div>
            <ul className="text-xs text-[#1B2D3C] leading-relaxed space-y-2 font-semibold">
              <li className="flex justify-between">
                <span>Monday:</span>
                <span className="font-bold">Closed (except school holidays)</span>
              </li>
              <li className="flex justify-between">
                <span>Tuesday - Saturday:</span>
                <span className="font-bold">10:00am - 6:00pm</span>
              </li>
              <li className="flex justify-between">
                <span>Sunday:</span>
                <span className="font-bold">11:00am - 5:00pm</span>
              </li>
            </ul>

            <div className="pt-4 border-t border-[#1B2D3C]/30 text-xs text-stone-500 space-y-1.5 font-semibold">
              <p className="font-black text-[#1B2D3C] uppercase tracking-wider text-[10px]">General Questions & Inquiries:</p>
              <div className="flex items-center gap-1.5">
                <Mail size={13} className="text-[#74919e]" />
                <a href="mailto:info@pitterpotter.co.uk" className="text-stone-600 hover:text-[#74919e] underline">
                  info@pitterpotter.co.uk
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Booking Link Card - Right */}
        <div id="booking-form-section" className="lg:col-span-8 bg-white p-6 md:p-8 border-2 border-[#1B2D3C]  space-y-6 rounded-2xl">
          <div className="border-b-2 border-[#1B2D3C]/20 pb-4">
            <h2 className="font-heading text-2xl font-black italic text-[#1B2D3C]">Book Your Studio Session</h2>
            <p className="text-xs text-stone-500 mt-1 leading-normal font-semibold">
              Ready to secure your painting session? Click below to book through our online booking system.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-[#D9E2EC]/50 p-6 border-2 border-[#1B2D3C] space-y-4">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-6 h-6 text-[#74919e]" />
                <h3 className="font-heading text-lg font-black text-[#1B2D3C]">Online Booking</h3>
              </div>
              <p className="text-xs text-[#1B2D3C] leading-relaxed font-medium">
                For the quickest booking experience, use our online booking system to select your preferred date, time, and studio location.
              </p>
              <button
                onClick={() => {
                  const el = document.getElementById('booking-form-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-block w-full py-3.5 bg-[#74919e] text-white font-bold text-xs uppercase tracking-widest border-2 border-[#1B2D3C] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-center cursor-pointer"
              >
                Book Online Now
              </button>
            </div>

            <div id="phone-booking-section" className="bg-[#F0F4F8] p-6 border-2 border-[#1B2D3C] space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-6 h-6 text-[#74919e]" />
                <h3 className="font-heading text-lg font-black text-[#1B2D3C]">Book by Phone</h3>
              </div>
              <p className="text-xs text-[#1B2D3C] leading-relaxed font-medium">
                Prefer to speak with us? Call our studios directly to book your session.
              </p>
              <div className="space-y-2">
                <a href="tel:02087881635" className="block py-2 px-4 bg-white border-2 border-[#1B2D3C] text-center text-xs font-bold text-[#1B2D3C] hover:bg-[#D9E2EC] transition-all">
                  Putney: 020 87881635
                </a>
                <a href="tel:02037704499" className="block py-2 px-4 bg-white border-2 border-[#1B2D3C] text-center text-xs font-bold text-[#1B2D3C] hover:bg-[#D9E2EC] transition-all">
                  Wimbledon: 020 37704499
                </a>
              </div>
            </div>
          </div>

          {/* Multi-Step Booking Form */}
          <form onSubmit={handleSubmit} className="space-y-6 pt-6 border-t-2 border-[#1B2D3C]/20">
            {/* Step 1: Studio & Session Type */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-widest">
                    1. Select Studio *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setStudio('Putney')}
                      className={`py-3 px-4 border-2 text-xs font-bold uppercase tracking-wider transition-all ${
                        studio === 'Putney'
                          ? 'bg-[#74919e] text-white border-[#1B2D3C]'
                          : 'bg-white text-[#1B2D3C] border-[#1B2D3C] hover:bg-[#D9E2EC]/30'
                      }`}
                    >
                      Putney
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudio('Wimbledon')}
                      className={`py-3 px-4 border-2 text-xs font-bold uppercase tracking-wider transition-all ${
                        studio === 'Wimbledon'
                          ? 'bg-[#74919e] text-white border-[#1B2D3C]'
                          : 'bg-white text-[#1B2D3C] border-[#1B2D3C] hover:bg-[#D9E2EC]/30'
                      }`}
                    >
                      Wimbledon
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-widest">
                    2. Session Type *
                  </label>
                  <select
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value as any)}
                    className="w-full py-3 px-4 border-2 border-[#1B2D3C] bg-white text-xs font-bold text-[#1B2D3C] focus:outline-none focus:bg-[#D9E2EC]/20"
                  >
                    <option value="painting">Painting Session</option>
                    <option value="birthday-party">Birthday Party</option>
                    <option value="baby-shower-hen">Baby Shower / Hen Party</option>
                    <option value="clay-imprints">Clay Imprints</option>
                    <option value="corporate">Corporate Event</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={!canProceedToStep(2)}
                  className="w-full py-3 bg-[#74919e] text-white font-bold text-xs uppercase tracking-widest border-2 border-[#1B2D3C] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Contact Details
                </button>
              </div>
            )}

            {/* Step 2: Contact Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-widest">
                    3. Your Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full py-3 px-4 border-2 border-[#1B2D3C] bg-white text-xs font-bold text-[#1B2D3C] focus:outline-none focus:bg-[#D9E2EC]/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-widest">
                    4. Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full py-3 px-4 border-2 border-[#1B2D3C] bg-white text-xs font-bold text-[#1B2D3C] focus:outline-none focus:bg-[#D9E2EC]/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-widest">
                    5. Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07xxx xxx xxx"
                    className="w-full py-3 px-4 border-2 border-[#1B2D3C] bg-white text-xs font-bold text-[#1B2D3C] focus:outline-none focus:bg-[#D9E2EC]/20"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 py-3 bg-white text-[#1B2D3C] font-bold text-xs uppercase tracking-widest border-2 border-[#1B2D3C] hover:bg-[#D9E2EC]/30 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    disabled={!canProceedToStep(3)}
                    className="flex-1 py-3 bg-[#74919e] text-white font-bold text-xs uppercase tracking-widest border-2 border-[#1B2D3C] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue to Date
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Date & Time */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-widest">
                    6. Select Date *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full py-3 px-4 border-2 border-[#1B2D3C] bg-white text-xs font-bold text-[#1B2D3C] text-left focus:outline-none focus:bg-[#D9E2EC]/20 flex justify-between items-center"
                  >
                    {date ? format(date, 'PPP') : 'Click to select date'}
                    <CalendarIcon className="w-4 h-4" />
                  </button>
                  {showCalendar && (
                    <div className="absolute z-50 bg-white border-2 border-[#1B2D3C] p-4 shadow-lg">
                      <DayPicker
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        disabled={{ dayOfWeek: [1] }}
                        className="rdp"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-widest">
                    7. Select Time *
                  </label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full py-3 px-4 border-2 border-[#1B2D3C] bg-white text-xs font-bold text-[#1B2D3C] focus:outline-none focus:bg-[#D9E2EC]/20"
                  >
                    <option value="10:00">10:00am</option>
                    <option value="11:30">11:30am</option>
                    <option value="13:00">1:00pm</option>
                    <option value="14:30">2:30pm</option>
                    <option value="16:00">4:00pm</option>
                  </select>
                  {date && (
                    <p className={`text-xs font-semibold ${availability.available ? 'text-emerald-600' : 'text-red-600'}`}>
                      {availability.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-widest">
                    8. Number of Painters *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={paintersCount}
                    onChange={(e) => setPaintersCount(parseInt(e.target.value) || 1)}
                    className="w-full py-3 px-4 border-2 border-[#1B2D3C] bg-white text-xs font-bold text-[#1B2D3C] focus:outline-none focus:bg-[#D9E2EC]/20"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 py-3 bg-white text-[#1B2D3C] font-bold text-xs uppercase tracking-widest border-2 border-[#1B2D3C] hover:bg-[#D9E2EC]/30 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    disabled={!canProceedToStep(4)}
                    className="flex-1 py-3 bg-[#74919e] text-white font-bold text-xs uppercase tracking-widest border-2 border-[#1B2D3C] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Review & Submit
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="bg-[#D9E2EC]/50 p-4 border-2 border-[#1B2D3C] space-y-2">
                  <h4 className="font-heading text-sm font-black text-[#1B2D3C] uppercase tracking-wider">Booking Summary</h4>
                  <div className="text-xs text-[#1B2D3C] space-y-1 font-semibold">
                    <p><strong>Studio:</strong> {studio}</p>
                    <p><strong>Session:</strong> {sessionType.replace('-', ' ')}</p>
                    <p><strong>Date:</strong> {date ? format(date, 'PPP') : 'Not selected'}</p>
                    <p><strong>Time:</strong> {time}</p>
                    <p><strong>Painters:</strong> {paintersCount}</p>
                    <p><strong>Name:</strong> {name}</p>
                    <p><strong>Email:</strong> {email}</p>
                    <p><strong>Phone:</strong> {phone}</p>
                    {currentEstimate > 0 && (
                      <p className="text-[#74919e] font-black"><strong>Estimated Total:</strong> £{currentEstimate.toFixed(2)}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-widest">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests or dietary requirements..."
                    rows={3}
                    className="w-full py-3 px-4 border-2 border-[#1B2D3C] bg-white text-xs font-bold text-[#1B2D3C] focus:outline-none focus:bg-[#D9E2EC]/20"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 py-3 bg-white text-[#1B2D3C] font-bold text-xs uppercase tracking-widest border-2 border-[#1B2D3C] hover:bg-[#D9E2EC]/30 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#74919e] text-white font-bold text-xs uppercase tracking-widest border-2 border-[#1B2D3C] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    Submit Booking Request
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

      </div>

      {/* Success Modal */}
      {showSuccessModal && submittedInquiry && (
        <div className="fixed inset-0 bg-[#1B2D3C]/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-[#1B2D3C] p-8 max-w-md w-full space-y-4">
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
              <h3 className="font-heading text-2xl font-black italic text-[#1B2D3C] mb-2">Booking Received!</h3>
              <p className="text-xs text-[#1B2D3C] font-semibold leading-relaxed">
                Thank you {name}! Your booking request for {format(new Date(submittedInquiry.date), 'PPP')} at {submittedInquiry.time} has been received.
              </p>
              <p className="text-xs text-[#1B2D3C] font-semibold leading-relaxed mt-2">
                Reference: <span className="font-black text-[#74919e]">{submittedInquiry.id}</span>
              </p>
              <p className="text-xs text-stone-500 font-semibold leading-relaxed mt-2">
                We'll confirm your table within 24 hours via email.
              </p>
            </div>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                setCurrentStep(1);
                setName('');
                setEmail('');
                setPhone('');
                setDate(undefined);
                setNotes('');
              }}
              className="w-full py-3 bg-[#74919e] text-white font-bold text-xs uppercase tracking-widest border-2 border-[#1B2D3C] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
