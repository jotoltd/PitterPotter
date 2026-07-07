import { useState, useEffect, FormEvent } from 'react';
import { Mail, Phone, MapPin, Clock, CheckCircle2, Copy, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from './ToastContext';
import { format } from 'date-fns';
import { BookingInquiry, GiftCard } from '../types';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { getRemainingCapacity, createPublicBooking } from '../lib/bookings';
import EditableText from './EditableText';


interface ContactViewProps {
  initialPainters?: number;
  adminMode?: boolean;
}

export default function ContactView({ initialPainters = 1, adminMode = false }: ContactViewProps) {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  // Booking details from previous stage
  const [studio, setStudio] = useState<'Putney' | 'Wimbledon'>('Putney');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('10:00');

  // Contact details (last stage)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [sessionType, setSessionType] = useState<'painting' | 'birthday-party' | 'baby-shower-hen' | 'clay-imprints' | 'corporate'>('painting');
  const [paintersCount, setPaintersCount] = useState<number>(initialPainters);

  const [submittedInquiry, setSubmittedInquiry] = useState<BookingInquiry | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [giftCardCode, setGiftCardCode] = useState('');
  const [appliedGiftCard, setAppliedGiftCard] = useState<GiftCard | null>(null);
  const [giftCardError, setGiftCardError] = useState('');

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem('pp_booking_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setStudio(parsed.studio || 'Putney');
        if (parsed.date) setDate(new Date(parsed.date));
        setTime(parsed.time || '10:00');
        setName(parsed.name || '');
        setEmail(parsed.email || '');
        setPhone(parsed.phone || '');
        setPaintersCount(parsed.paintersCount || 1);
        if (parsed.sessionType) setSessionType(parsed.sessionType);
        // If date already chosen on studio page, skip straight to contact details
        if (parsed.date) setStep(2);
      } catch (err) {
        console.error('Failed to load draft:', err);
      }
    }
  }, []);

  const SESSION_TYPE_LABELS: Record<string, string> = {
    'painting': 'Painting Session',
    'birthday-party': 'Birthday Party',
    'baby-shower-hen': 'Baby Shower / Hen Party',
    'clay-imprints': 'Clay Imprints',
    'corporate': 'Corporate Event',
  };

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
    };
    localStorage.setItem('pp_booking_draft', JSON.stringify(draft));
  };

  const clearDraft = () => {
    localStorage.removeItem('pp_booking_draft');
  };

  const estimatedPrice = paintersCount * 5.95;
  const giftCardDiscount = appliedGiftCard ? Math.min(appliedGiftCard.balance, estimatedPrice) : 0;
  const finalPrice = Math.max(0, estimatedPrice - giftCardDiscount);

  const applyGiftCard = async () => {
    setGiftCardError('');
    setAppliedGiftCard(null);
    if (!giftCardCode.trim()) return;

    const code = giftCardCode.trim();

    if (isSupabaseEnabled()) {
      try {
        const { data, error } = await supabase!
          .from('gift_cards')
          .select('*')
          .eq('code', code)
          .eq('status', 'active')
          .gt('balance', 0)
          .single();

        if (error || !data) {
          setGiftCardError('Invalid or expired gift card code.');
          return;
        }

        if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
          setGiftCardError('This gift card has expired.');
          return;
        }

        setAppliedGiftCard({
          id: data.id,
          code: data.code,
          amount: Number(data.amount),
          balance: Number(data.balance),
          recipientName: data.recipient_name,
          recipientEmail: data.recipient_email,
          senderName: data.sender_name,
          message: data.message,
          purchaseDate: new Date(data.purchase_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          status: data.status,
        });
        return;
      } catch (err) {
        console.error('Supabase gift card lookup failed:', err);
      }
    }

    const cards: GiftCard[] = JSON.parse(localStorage.getItem('pp_gift_cards') || '[]');
    const card = cards.find((c) => c.code === code && c.status === 'active' && c.balance > 0);

    if (!card) {
      setGiftCardError('Invalid or expired gift card code.');
      return;
    }

    setAppliedGiftCard(card);
  };

  const removeGiftCard = () => {
    setAppliedGiftCard(null);
    setGiftCardError('');
    setGiftCardCode('');
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!date) { setError('Please select a date and time to continue.'); return; }
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 2) {
      if (!name || !phone) {
        setError(`Please fill in: ${[!name && 'Name', !phone && 'Phone'].filter(Boolean).join(', ')}`);
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && !emailRegex.test(email)) { setError('Please enter a valid email address'); return; }
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !phone || !date) {
      const missing = [
        !name && 'Name',
        !email && 'Email',
        !phone && 'Phone',
        !date && 'Date',
      ].filter(Boolean).join(', ');
      setError(`Please fill in the required fields: ${missing}`);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setSubmitting(true);

    const remaining = await getRemainingCapacity(studio, format(date, 'yyyy-MM-dd'), time);
    if (paintersCount > remaining) {
      setError(`This session only has room for ${remaining} more seat${remaining === 1 ? '' : 's'}. Please choose a different time or reduce the number of people.`);
      return;
    }

    const currentEstimatedPrice = paintersCount * 5.95;
    const currentGiftCardDiscount = appliedGiftCard ? Math.min(appliedGiftCard.balance, currentEstimatedPrice) : 0;
    const currentFinalPrice = Math.max(0, currentEstimatedPrice - currentGiftCardDiscount);

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
      status: ['birthday-party', 'baby-shower-hen', 'corporate'].includes(sessionType) ? 'pending' : 'confirmed',
      source: 'online',
      requestDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      estimatedPrice: currentEstimatedPrice > 0 ? currentEstimatedPrice : undefined,
      giftCardCode: appliedGiftCard ? appliedGiftCard.code : undefined,
      giftCardDiscount: currentGiftCardDiscount > 0 ? currentGiftCardDiscount : undefined,
      finalPrice: currentFinalPrice > 0 ? currentFinalPrice : undefined,
    };

    if (appliedGiftCard && currentGiftCardDiscount > 0) {
      if (isSupabaseEnabled()) {
        try {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/redeem-gift-card`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              code: appliedGiftCard.code,
              amount: currentEstimatedPrice,
            }),
          });

          const data = await response.json();
          if (!response.ok || data.error) {
            console.error('Gift card redeem error:', data.error);
          }
        } catch (err) {
          console.error('Gift card redeem failed:', err);
        }
      }

      const newBalance = Math.max(0, appliedGiftCard.balance - currentGiftCardDiscount);
      const newStatus = newBalance <= 0 ? 'redeemed' : 'active';
      const cards: GiftCard[] = JSON.parse(localStorage.getItem('pp_gift_cards') || '[]');
      const updatedCards = cards.map((c) => {
        if (c.code === appliedGiftCard.code) {
          return { ...c, balance: newBalance, status: newStatus };
        }
        return c;
      });
      localStorage.setItem('pp_gift_cards', JSON.stringify(updatedCards));
    }

    try {
      await createPublicBooking(newInquiry);
      setSubmittedInquiry(newInquiry);
      setShowSuccessModal(true);
      clearDraft();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save booking. Please try again.';
      setError(message);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);

  };

  const STEPS = ['Session', 'Your Details', 'Review'];

  return (
    <div id="contact-view" className="pb-20 pt-6">
      {/* Title + Step Progress */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mb-8">
        <h1 className="font-heading text-3xl md:text-4xl font-black italic tracking-tight text-[#1B2D3C] text-center mb-6">
          <EditableText contentKey="contact_title" page="contact" defaultValue="Book a Session" adminMode={adminMode} className="font-heading text-3xl md:text-4xl italic text-[#1B2D3C]" />
        </h1>
        {/* Step indicator */}
        <div className="flex items-center gap-0">
          {STEPS.map((label, i) => {
            const num = i + 1;
            const isActive = step === num;
            const isDone = step > num;
            return (
              <div key={num} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                    isDone ? 'bg-[#1B2D3C] border-[#1B2D3C] text-white'
                    : isActive ? 'bg-white border-[#1B2D3C] text-[#1B2D3C]'
                    : 'bg-white border-[#1B2D3C]/20 text-[#1B2D3C]/30'
                  }`}>
                    {isDone ? '✓' : num}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isActive ? 'text-[#1B2D3C]' : isDone ? 'text-[#1B2D3C]/60' : 'text-[#1B2D3C]/30'
                  }`}>{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all ${
                    step > num ? 'bg-[#1B2D3C]' : 'bg-[#1B2D3C]/15'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Info Cards (Left) & Form (Right) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Selected Studio Info - Left */}
        <div className="lg:col-span-4 space-y-8">

          <div className="bg-white p-6 border border-[#1B2D3C]/20 space-y-4 relative overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#DBE7E4]" />
            <div className="inline-flex py-1 px-3.5 bg-[#FFFFFF] border border-[#1B2D3C] text-[#1B2D3C] text-[10px] font-bold uppercase tracking-wider rounded-lg">
              <EditableText contentKey={`contact_${studio.toLowerCase()}_selected_badge`} page="contact" defaultValue={`${studio} Studio`} adminMode={adminMode} className="text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]" />
            </div>
            <div className="space-y-3.5 text-xs text-stone-600 font-semibold">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-5 h-5 text-[#1B2D3C] shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <EditableText contentKey={`contact_${studio.toLowerCase()}_full_address`} page="contact" defaultValue={studio === 'Putney' ? '234 Upper Richmond Road, Putney SW15 6TG' : '52 Wimbledon Hill Road, Wimbledon SW19 7PA'} adminMode={adminMode} className="text-xs text-stone-600 leading-relaxed" />
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-5 h-5 text-[#1B2D3C]" />
                <a href={studio === 'Putney' ? 'tel:02087881635' : 'tel:02037704499'} className="text-[#1B2D3C] hover:text-[#1B2D3C] font-black text-sm">
                  <EditableText contentKey={`contact_${studio.toLowerCase()}_full_phone`} page="contact" defaultValue={studio === 'Putney' ? '020 87881635' : '020 37704499'} adminMode={adminMode} className="text-sm text-[#1B2D3C] font-black" />
                </a>
              </div>
            </div>

            <div className="aspect-video w-full bg-[#D6E2E9]/50 overflow-hidden rounded-lg">
              <iframe
                title={`${studio} Studio Location`}
                src={studio === 'Putney'
                  ? 'https://maps.google.com/maps?q=234+Upper+Richmond+Road%2C+Putney+SW15+6TG&t=&z=15&ie=UTF8&iwloc=&output=embed'
                  : 'https://maps.google.com/maps?q=52+Wimbledon+Hill+Road%2C+Wimbledon+SW19+7PA&t=&z=15&ie=UTF8&iwloc=&output=embed'
                }
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* Opening & General Contact info */}
          <div className="bg-[#D6E2E9]/50 p-6 border border-[#1B2D3C]/20 space-y-4 rounded-lg">
            <div className="flex items-center gap-2 border-b-2 border-[#1B2D3C] pb-2">
              <Clock className="w-4.5 h-4.5 text-[#1B2D3C]" />
              <h3 className="font-heading font-black text-[#1B2D3C] text-sm md:text-base uppercase tracking-wider"><EditableText contentKey="contact_timings_heading" page="contact" defaultValue="Studio Timings" adminMode={adminMode} className="font-heading text-sm md:text-base uppercase tracking-wider text-[#1B2D3C]" /></h3>
            </div>
            <ul className="text-xs text-[#1B2D3C] leading-relaxed space-y-2 font-semibold">
              <li className="flex justify-between">
                <span><EditableText contentKey="contact_hours_monday" page="contact" defaultValue="Monday:" adminMode={adminMode} className="text-xs text-[#1B2D3C]" /></span>
                <span className="font-bold"><EditableText contentKey="contact_hours_monday_time" page="contact" defaultValue="Closed (except school holidays)" adminMode={adminMode} className="text-xs text-[#1B2D3C] font-bold" /></span>
              </li>
              <li className="flex justify-between">
                <span><EditableText contentKey="contact_hours_tue_sat" page="contact" defaultValue="Tuesday - Saturday:" adminMode={adminMode} className="text-xs text-[#1B2D3C]" /></span>
                <span className="font-bold"><EditableText contentKey="contact_hours_tue_sat_time" page="contact" defaultValue="10:00am - 6:00pm" adminMode={adminMode} className="text-xs text-[#1B2D3C] font-bold" /></span>
              </li>
              <li className="flex justify-between">
                <span><EditableText contentKey="contact_hours_sunday" page="contact" defaultValue="Sunday:" adminMode={adminMode} className="text-xs text-[#1B2D3C]" /></span>
                <span className="font-bold"><EditableText contentKey="contact_hours_sunday_time" page="contact" defaultValue="11:00am - 5:00pm" adminMode={adminMode} className="text-xs text-[#1B2D3C] font-bold" /></span>
              </li>
            </ul>

            <div className="pt-4 border-t border-[#1B2D3C]/30 text-xs text-stone-500 space-y-1.5 font-semibold">
              <p className="font-black text-[#1B2D3C] uppercase tracking-wider text-[10px]"><EditableText contentKey="contact_inquiries_label" page="contact" defaultValue="General Questions & Inquiries:" adminMode={adminMode} className="text-[10px] uppercase tracking-wider text-[#1B2D3C]" /></p>
              <div className="flex items-center gap-1.5">
                <Mail size={13} className="text-[#1B2D3C]" />
                <a href="mailto:info@pitterpotter.co.uk" className="text-stone-600 hover:text-[#1B2D3C] underline">
                  <EditableText contentKey="contact_email" page="contact" defaultValue="info@pitterpotter.co.uk" adminMode={adminMode} className="text-xs text-stone-600" />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Booking Form - Right */}
        <div id="booking-form-section" className="lg:col-span-8 bg-white p-6 md:p-8 border border-[#1B2D3C]/20 space-y-6 rounded-2xl">

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg">
                {error}
              </div>
            )}

            {/* ── STEP 1: Session ── */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="border-b-2 border-[#1B2D3C]/10 pb-3">
                  <h2 className="font-heading text-xl font-black text-[#1B2D3C]"><EditableText contentKey="contact_step1_title" page="contact" defaultValue="Session details" adminMode={adminMode} className="font-heading text-xl text-[#1B2D3C]" /></h2>
                  <p className="text-xs text-stone-500 mt-1 font-semibold"><EditableText contentKey="contact_step1_subtitle" page="contact" defaultValue="Pick your studio and session type. For date &amp; time, visit your studio page first." adminMode={adminMode} className="text-xs text-stone-500" /></p>
                </div>

                {/* Studio */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]">Studio *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['Putney', 'Wimbledon'] as const).map((loc) => (
                      <button key={loc} type="button" onClick={() => setStudio(loc)}
                        className={`p-4 border-2 text-left transition-all cursor-pointer rounded-xl ${
                          studio === loc ? 'border-[#1B2D3C] bg-[#1B2D3C] text-white' : 'border-[#1B2D3C]/20 bg-white text-[#1B2D3C] hover:border-[#1B2D3C]/60'
                        }`}>
                        <p className="font-heading font-black italic text-base">{loc} Studio</p>
                        <p className={`text-[11px] font-semibold mt-0.5 ${studio === loc ? 'text-white/70' : 'text-[#1B2D3C]/50'}`}>
                          {loc === 'Putney' ? '234 Upper Richmond Rd' : '52 Wimbledon Hill Rd'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Session Type */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]">Session Type *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(['painting', 'birthday-party', 'baby-shower-hen', 'clay-imprints', 'corporate'] as const).map((type) => (
                      <button key={type} type="button" onClick={() => setSessionType(type)}
                        className={`py-2.5 px-3 border-2 text-left text-xs font-bold transition-all rounded-lg cursor-pointer ${
                          sessionType === type ? 'border-[#1B2D3C] bg-[#1B2D3C] text-white' : 'border-[#1B2D3C]/20 bg-white text-[#1B2D3C] hover:border-[#1B2D3C]/60'
                        }`}>
                        {SESSION_TYPE_LABELS[type]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seats */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]">How many seats? *</label>
                  <div className="flex items-center border border-[#1B2D3C]/20 bg-white overflow-hidden rounded-lg max-w-[180px]">
                    <button type="button" onClick={() => setPaintersCount(p => Math.max(1, p - 1))} className="px-5 py-3 text-lg font-black text-[#1B2D3C] hover:bg-[#D6E2E9]/40 transition-all cursor-pointer select-none">−</button>
                    <span className="flex-1 text-center text-sm font-black text-[#1B2D3C]">{paintersCount}</span>
                    <button type="button" onClick={() => setPaintersCount(p => p + 1)} className="px-5 py-3 text-lg font-black text-[#1B2D3C] hover:bg-[#D6E2E9]/40 transition-all cursor-pointer select-none">+</button>
                  </div>
                </div>
                {/* Date/time summary from draft */}
                {date && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs font-semibold text-emerald-800 space-y-0.5">
                    <p className="font-black">Session pre-selected ✓</p>
                    <p>{format(date, 'EEEE, do MMMM yyyy')} · {time} – {parseInt(time.split(':')[0], 10) + 2}:00</p>
                    <p className="text-emerald-600 text-[11px]">Selected from {studio} studio page</p>
                  </div>
                )}
                {!date && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs font-semibold text-amber-800">
                    <p className="font-black">No date selected yet</p>
                    <p className="text-amber-600 text-[11px] mt-0.5">Go to your studio page to pick a date and time slot first.</p>
                  </div>
                )}

                <button type="button" onClick={handleNext}
                  className="w-full py-4 bg-[#1B2D3C] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#486581] transition-all cursor-pointer flex items-center justify-center gap-2">
                  Continue to Your Details <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ── STEP 2: Contact Details ── */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="border-b-2 border-[#1B2D3C]/10 pb-3">
                  <h2 className="font-heading text-xl font-black text-[#1B2D3C]"><EditableText contentKey="contact_step2_title" page="contact" defaultValue="Your details" adminMode={adminMode} className="font-heading text-xl text-[#1B2D3C]" /></h2>
                  <p className="text-xs text-stone-500 mt-1 font-semibold"><EditableText contentKey="contact_step2_subtitle" page="contact" defaultValue="We'll use these to confirm your booking." adminMode={adminMode} className="text-xs text-stone-500" /></p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-widest">Full Name *</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full py-3 px-4 border border-[#1B2D3C]/20 rounded-lg bg-white text-sm font-bold text-[#1B2D3C] focus:outline-none focus:border-[#1B2D3C]/60" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-widest">Phone Number *</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="07xxx xxx xxx"
                      className="w-full py-3 px-4 border border-[#1B2D3C]/20 rounded-lg bg-white text-sm font-bold text-[#1B2D3C] focus:outline-none focus:border-[#1B2D3C]/60" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-widest">Email Address *</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full py-3 px-4 border border-[#1B2D3C]/20 rounded-lg bg-white text-sm font-bold text-[#1B2D3C] focus:outline-none focus:border-[#1B2D3C]/60" />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => { setStep(1); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="flex items-center gap-2 px-5 py-3 border border-[#1B2D3C]/20 text-[#1B2D3C] text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#D6E2E9]/40 transition-all cursor-pointer">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button type="button" onClick={handleNext}
                    className="flex-1 py-4 bg-[#1B2D3C] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#486581] transition-all cursor-pointer flex items-center justify-center gap-2">
                    Review Booking <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Review & Gift Card & Submit ── */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="border-b-2 border-[#1B2D3C]/10 pb-3">
                  <h2 className="font-heading text-xl font-black text-[#1B2D3C]"><EditableText contentKey="contact_step3_title" page="contact" defaultValue="Review &amp; confirm" adminMode={adminMode} className="font-heading text-xl text-[#1B2D3C]" /></h2>
                  <p className="text-xs text-stone-500 mt-1 font-semibold"><EditableText contentKey="contact_step3_subtitle" page="contact" defaultValue="Check everything looks right before submitting." adminMode={adminMode} className="text-xs text-stone-500" /></p>
                </div>

                {/* Summary card */}
                <div className="bg-[#D6E2E9]/40 border border-[#1B2D3C]/15 rounded-xl p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-semibold text-[#1B2D3C]">
                    <div><span className="text-[10px] font-black uppercase tracking-wider text-[#1B2D3C]/50 block mb-0.5">Studio</span>{studio}</div>
                    <div><span className="text-[10px] font-black uppercase tracking-wider text-[#1B2D3C]/50 block mb-0.5">Session</span>{SESSION_TYPE_LABELS[sessionType]}</div>
                    <div><span className="text-[10px] font-black uppercase tracking-wider text-[#1B2D3C]/50 block mb-0.5">Date</span>{date ? format(date, 'EEE d MMM yyyy') : '—'}</div>
                    <div><span className="text-[10px] font-black uppercase tracking-wider text-[#1B2D3C]/50 block mb-0.5">Time</span>{time} – {parseInt(time.split(':')[0], 10) + 2}:00</div>
                    <div><span className="text-[10px] font-black uppercase tracking-wider text-[#1B2D3C]/50 block mb-0.5">Seats</span>{paintersCount}</div>
                    <div><span className="text-[10px] font-black uppercase tracking-wider text-[#1B2D3C]/50 block mb-0.5">Name</span>{name}</div>
                    <div><span className="text-[10px] font-black uppercase tracking-wider text-[#1B2D3C]/50 block mb-0.5">Phone</span>{phone}</div>
                    <div><span className="text-[10px] font-black uppercase tracking-wider text-[#1B2D3C]/50 block mb-0.5">Email</span>{email || '—'}</div>
                  </div>
                  <div className="border-t border-[#1B2D3C]/10 pt-3 space-y-1 text-xs font-semibold text-[#1B2D3C]">
                    <div className="flex justify-between"><span>Estimated price</span><span>£{estimatedPrice.toFixed(2)}</span></div>
                    {appliedGiftCard && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Gift card ({appliedGiftCard.code})</span><span>−£{giftCardDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black pt-1 border-t border-[#1B2D3C]/10">
                      <span>Total due</span><span>£{finalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Gift card */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]">Gift Card Code <span className="text-[#1B2D3C]/40 font-semibold normal-case tracking-normal">(optional)</span></label>
                  {appliedGiftCard ? (
                    <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                      <div className="text-xs text-emerald-800 font-semibold">
                        <span className="font-black block">{appliedGiftCard.code} applied ✓</span>
                        <span className="text-[11px] text-emerald-600">Balance after use: £{Math.max(0, appliedGiftCard.balance - giftCardDiscount).toFixed(2)}</span>
                      </div>
                      <button type="button" onClick={removeGiftCard} className="text-[10px] font-black uppercase text-emerald-800 hover:text-red-600 underline cursor-pointer">Remove</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input type="text" value={giftCardCode} onChange={(e) => setGiftCardCode(e.target.value)}
                        placeholder="PP-XXXX-XXXX-XXXX"
                        className="flex-1 py-2.5 px-3 border border-[#1B2D3C]/20 rounded-lg text-sm font-bold text-[#1B2D3C] focus:outline-none focus:border-[#1B2D3C] uppercase" />
                      <button type="button" onClick={applyGiftCard}
                        className="px-4 py-2 bg-[#DBE7E4] text-[#1B2D3C] font-bold text-[10px] uppercase tracking-widest rounded-lg border border-[#1B2D3C]/20 hover:bg-[#D6E2E9] transition-all cursor-pointer">Apply</button>
                    </div>
                  )}
                  {giftCardError && <p className="text-[10px] text-red-600 font-semibold">{giftCardError}</p>}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => { setStep(2); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="flex items-center gap-2 px-5 py-3 border border-[#1B2D3C]/20 text-[#1B2D3C] text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#D6E2E9]/40 transition-all cursor-pointer">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 py-4 bg-[#1B2D3C] text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-[#486581] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <>Confirm Booking <ArrowRight className="w-4 h-4" /></>}
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
          <div className="bg-white border border-[#1B2D3C]/20 p-8 max-w-md w-full space-y-4">
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
              <h3 className="font-heading text-2xl font-black text-[#1B2D3C] mb-2"><EditableText contentKey="contact_success_title" page="contact" defaultValue="Booking Received!" adminMode={adminMode} className="font-heading text-2xl text-[#1B2D3C]" /></h3>
              <p className="text-xs text-[#1B2D3C] font-semibold leading-relaxed">
                <EditableText contentKey="contact_success_message" page="contact" defaultValue={`Thank you ${name}! Your booking request for ${format(new Date(submittedInquiry.date), 'PPP')} at ${submittedInquiry.time} has been received.`} adminMode={adminMode} className="text-xs text-[#1B2D3C] leading-relaxed" />
              </p>
              <p className="text-xs text-[#1B2D3C] font-semibold leading-relaxed mt-2 flex items-center justify-center gap-2">
                <EditableText contentKey="contact_success_reference" page="contact" defaultValue="Reference:" adminMode={adminMode} className="text-xs text-[#1B2D3C]" /> <span className="font-black text-[#1B2D3C]">{submittedInquiry.id}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(submittedInquiry.id);
                    showToast('Reference copied', 'success');
                  }}
                  className="p-1 hover:bg-[#D6E2E9] rounded cursor-pointer"
                  title="Copy reference"
                >
                  <Copy className="w-3.5 h-3.5 text-[#1B2D3C]" />
                </button>
              </p>
              <p className="text-xs text-stone-500 font-semibold leading-relaxed mt-2">
                <EditableText contentKey="contact_success_footer" page="contact" defaultValue="We'll confirm your table within 24 hours via email." adminMode={adminMode} className="text-xs text-stone-500 leading-relaxed" />
              </p>
            </div>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                setName('');
                setEmail('');
                setPhone('');
                setDate(undefined);
              }}
              className="w-full py-3 bg-[#DBE7E4] text-[#1B2D3C] font-bold text-xs uppercase tracking-widest border border-[#1B2D3C]/20 hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
            >
              <EditableText contentKey="contact_success_close" page="contact" defaultValue="Close" adminMode={adminMode} className="text-xs uppercase tracking-widest" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
