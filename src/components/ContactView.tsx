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
                  const el = document.getElementById('phone-booking-section');
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
        </div>

      </div>
    </div>
  );
}
