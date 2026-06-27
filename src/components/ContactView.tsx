import { useState, useEffect, FormEvent } from 'react';
import { Mail, Phone, MapPin, Clock, CheckCircle2 } from 'lucide-react';
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
  // Booking details from previous stage
  const [studio, setStudio] = useState<'Putney' | 'Wimbledon'>('Putney');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('10:00');

  // Contact details (last stage)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [sessionType] = useState<'painting' | 'birthday-party' | 'baby-shower-hen' | 'clay-imprints' | 'corporate'>('painting');
  const [paintersCount, setPaintersCount] = useState<number>(initialPainters);

  const [submittedInquiry, setSubmittedInquiry] = useState<BookingInquiry | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
      } catch (err) {
        console.error('Failed to load draft:', err);
      }
    }

  }, []);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !date) {
      alert('Please fill out all required fields');
      return;
    }

    const remaining = await getRemainingCapacity(studio, format(date, 'yyyy-MM-dd'), time);
    if (paintersCount > remaining) {
      alert(`This session only has room for ${remaining} more painter${remaining === 1 ? '' : 's'}. Please choose a different time or reduce the number of painters.`);
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
      status: 'pending',
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
    } catch {
      alert('Failed to save booking. Please try again.');
      return;
    }

    console.log('📧 Confirmation Email Sent:');
    console.log(`To: ${email}`);
    console.log(`Subject: Booking Confirmation - Reference: ${newInquiry.id}`);
    console.log(`Body: Thank you ${name}! Your booking for ${format(date, 'PPP')} at ${time} has been received. We'll confirm your table within 24 hours.`);
  };

  return (
    <div id="contact-view" className="space-y-16 pb-20 pt-6">
      {/* Title Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center space-y-4 max-w-3xl">
        <EditableText key="contact_tagline" page="contact" defaultValue="Secure Your Easel" adminMode={adminMode} className="text-xs tracking-widest text-[#1B2D3C] font-black uppercase block" />
        <h1 className="font-heading text-4xl md:text-5xl font-black text-[#1B2D3C] tracking-tight">{studio} Booking</h1>
        <EditableText key="contact_subtitle" page="contact" defaultValue={`Complete your ${studio} studio booking below. For general questions, call or email us anytime.`} adminMode={adminMode} className="text-[#1B2D3C]/85 text-xs sm:text-sm font-medium leading-relaxed" />
      </div>

      {/* Main Grid: Info Cards (Left) & Form (Right) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Selected Studio Info - Left */}
        <div className="lg:col-span-4 space-y-8">

          <div className="bg-white p-6 border border-[#1B2D3C]/20 space-y-4 relative overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#DBE7E4]" />
            <div className="inline-flex py-1 px-3.5 bg-[#FFFFFF] border border-[#1B2D3C] text-[#1B2D3C] text-[10px] font-bold uppercase tracking-wider rounded-lg">
              {studio} Studio
            </div>
            <div className="space-y-3.5 text-xs text-stone-600 font-semibold">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-5 h-5 text-[#1B2D3C] shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {studio === 'Putney'
                    ? '234 Upper Richmond Road, Putney SW15 6TG'
                    : '52 Wimbledon Hill Road, Wimbledon SW19 7PA'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-5 h-5 text-[#1B2D3C]" />
                <a href={studio === 'Putney' ? 'tel:02087881635' : 'tel:02037704499'} className="text-[#1B2D3C] hover:text-[#1B2D3C] font-black text-sm">
                  {studio === 'Putney' ? '020 87881635' : '020 37704499'}
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
                <Mail size={13} className="text-[#1B2D3C]" />
                <a href="mailto:info@pitterpotter.co.uk" className="text-stone-600 hover:text-[#1B2D3C] underline">
                  info@pitterpotter.co.uk
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Booking Form - Right */}
        <div id="booking-form-section" className="lg:col-span-8 bg-white p-6 md:p-8 border border-[#1B2D3C]/20 space-y-6 rounded-2xl">
          <div className="border-b-2 border-[#1B2D3C]/20 pb-4">
            <h2 className="font-heading text-2xl font-black text-[#1B2D3C]">Complete Your Booking</h2>
            <p className="text-xs text-stone-500 mt-1 leading-normal font-semibold">
              Confirm your selected session below and enter your contact details.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Booking Summary */}
            <div className="bg-[#D6E2E9]/50 p-4 border border-[#1B2D3C]/20 space-y-2">
              <h4 className="font-heading text-sm font-black text-[#1B2D3C] uppercase tracking-wider">Selected Session</h4>
              <div className="text-xs text-[#1B2D3C] space-y-1 font-semibold">
                <p><strong>Studio:</strong> {studio}</p>
                <p><strong>Date:</strong> {date ? format(date, 'PPP') : 'Not selected'}</p>
                <p><strong>Time:</strong> {time} - {parseInt(time.split(':')[0], 10) + 2}:00</p>
                <p><strong>Painters:</strong> {paintersCount}</p>
                <p><strong>Session:</strong> Painting Session</p>
              </div>

              <div className="border-t border-[#1B2D3C]/10 pt-3 mt-3 space-y-1">
                <div className="flex justify-between">
                  <span>Estimated price:</span>
                  <span>£{estimatedPrice.toFixed(2)}</span>
                </div>
                {appliedGiftCard && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Gift card ({appliedGiftCard.code}):</span>
                    <span>-£{giftCardDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-1">
                  <span>Total due:</span>
                  <span>£{finalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2">
                {appliedGiftCard ? (
                  <div className="flex items-center justify-between bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    <div className="text-xs text-emerald-800 font-semibold">
                      Applied: {appliedGiftCard.code}
                      <span className="block text-[10px] font-normal">Balance after use: £{Math.max(0, appliedGiftCard.balance - giftCardDiscount).toFixed(2)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeGiftCard}
                      className="text-[10px] font-black uppercase text-emerald-800 hover:text-emerald-900 underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]">Gift Card Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={giftCardCode}
                        onChange={(e) => setGiftCardCode(e.target.value)}
                        placeholder="PP-XXXX-XXXX-XXXX"
                        className="flex-1 py-2.5 px-3 border border-[#1B2D3C]/20 rounded-lg text-sm font-bold text-[#1B2D3C] focus:outline-none focus:border-[#1B2D3C] uppercase"
                      />
                      <button
                        type="button"
                        onClick={applyGiftCard}
                        className="px-4 py-2 bg-[#DBE7E4] text-[#1B2D3C] font-bold text-[10px] uppercase tracking-widest rounded-lg border border-[#1B2D3C]/20 hover:bg-[#D6E2E9] transition-all"
                      >
                        Apply
                      </button>
                    </div>
                    {giftCardError && <p className="text-[10px] text-red-600 font-semibold">{giftCardError}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-widest">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full py-3 px-4 border border-[#1B2D3C]/20 bg-white text-xs font-bold text-[#1B2D3C] focus:outline-none focus:bg-[#D6E2E9]/20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-widest">
                  Telephone Number *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07xxx xxx xxx"
                  className="w-full py-3 px-4 border border-[#1B2D3C]/20 bg-white text-xs font-bold text-[#1B2D3C] focus:outline-none focus:bg-[#D6E2E9]/20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-widest">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full py-3 px-4 border border-[#1B2D3C]/20 bg-white text-xs font-bold text-[#1B2D3C] focus:outline-none focus:bg-[#D6E2E9]/20"
                />
              </div>

            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#DBE7E4] text-[#1B2D3C] font-bold text-xs uppercase tracking-widest border border-[#1B2D3C]/20 hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
            >
              Submit Booking Request
            </button>
          </form>
        </div>

      </div>

      {/* Success Modal */}
      {showSuccessModal && submittedInquiry && (
        <div className="fixed inset-0 bg-[#1B2D3C]/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#1B2D3C]/20 p-8 max-w-md w-full space-y-4">
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
              <h3 className="font-heading text-2xl font-black text-[#1B2D3C] mb-2">Booking Received!</h3>
              <p className="text-xs text-[#1B2D3C] font-semibold leading-relaxed">
                Thank you {name}! Your booking request for {format(new Date(submittedInquiry.date), 'PPP')} at {submittedInquiry.time} has been received.
              </p>
              <p className="text-xs text-[#1B2D3C] font-semibold leading-relaxed mt-2">
                Reference: <span className="font-black text-[#1B2D3C]">{submittedInquiry.id}</span>
              </p>
              <p className="text-xs text-stone-500 font-semibold leading-relaxed mt-2">
                We'll confirm your table within 24 hours via email.
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
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
