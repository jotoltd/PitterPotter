import { useState } from 'react';
import { Gift, Heart, Users, Check, Sparkles, AlertCircle, CalendarRange, Clock } from 'lucide-react';
import { Page } from '../types';
import { Images } from '../images';

interface PartiesViewProps {
  setCurrentPage: (page: Page) => void;
  setPartyPreset?: (preset: { guestsCount: number; type: 'birthday' | 'hen-shower' | 'corporate' }) => void;
}

export default function PartiesView({ setCurrentPage, setPartyPreset }: PartiesViewProps) {
  const [guestsCount, setGuestsCount] = useState<number>(10);
  const [childAgeGroup, setChildAgeGroup] = useState<'under7' | 'over7'>('over7');
  const [eventType, setEventType] = useState<'birthday' | 'hen-shower' | 'corporate'>('birthday');

  const unitPrice = 28.95;
  const totalPrice = guestsCount * unitPrice;
  const depositPrice = 50.00;

  const handleInquireParty = () => {
    if (setPartyPreset) {
      setPartyPreset({
        guestsCount,
        type: eventType
      });
    }
    setCurrentPage('contact');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inclusions = [
    'A dedicated staff helper for your standard 2-hour session (1.5 hours for kids under 7).',
    'A selection of ceramic pottery up to the value of £22.95 per painter included.',
    'Access to all party animals, savings banks, designer mugs, and selected cereal bowls & plates.',
    'A professional glaze-and-fire finishing for every custom painted piece.',
    'Option to bring your own delicious cupcakes, birthday cake, finger foods, and soft drinks.'
  ];

  return (
    <div id="parties-view" className="space-y-20 pb-20 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-6">
      {/* Page Title Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs tracking-widest text-[#74919e] font-black uppercase block">Celebrate Creatively</span>
        <h1 className="font-heading text-4xl md:text-5xl font-black italic text-[#1B2D3C] tracking-tight">Studio Parties & Group Events</h1>
        <p className="text-[#1B2D3C]/85 text-xs sm:text-sm font-medium leading-relaxed">
          From children's birthday milestones to sophisticated hen celebrations and calming team-building events, painting ceramics together is a beautiful, memorable experience.
        </p>
      </div>

      {/* Main Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Birthday Parties */}
        <div className="bg-white border-2 border-[#1B2D3C]  p-8 flex flex-col justify-between space-y-6 rounded-xl">
          <div className="space-y-4">
            <div className="p-3 bg-[#D9E2EC] text-[#74919e] border border-[#1B2D3C] inline-block rounded-none">
              <Gift className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="font-heading text-xl font-bold italic text-[#1B2D3C]">Birthday Parties</h3>
            <p className="text-[#74919e] font-black text-lg">£28.95 per head</p>
            <p className="text-[#1B2D3C]/85 text-xs leading-relaxed font-semibold">
              A painting party at Pitter Potter is a fun and creative way of celebrating birthdays. We provide the cozy space, rich ceramic materials, and helpful hands to ensure everything runs smoothly.
            </p>
            <p className="text-[#1B2D3C]/85 text-xs leading-relaxed font-medium">
              Included in the cost is the studio fee and any piece of pottery valued up to <strong>£22.95</strong>. Choose from our party animals (puppies, dinosaurs, lions), money banks, standard mugs, and cute bowls.
            </p>
            <div className="bg-[#D9E2EC]/45 p-4 border border-[#1B2D3C] space-y-1 text-xs text-[#1B2D3C] font-semibold rounded-none">
              <p className="font-bold text-[#74919e] uppercase tracking-wider text-[9px] mb-1">Host Checklist:</p>
              <p>• Bring your own food/drinks/cake.</p>
              <p>• Please bring paper plates, cups, and cutlery.</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEventType('birthday');
              const el = document.getElementById('party-calculator');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full py-2.5 bg-[#F0F4F8] text-[#1B2D3C] border-2 border-[#1B2D3C] text-xs font-bold uppercase tracking-widest hover:bg-[#D9E2EC]/50 transition-colors rounded-none cursor-pointer"
          >
            Calculate Birthday Package
          </button>
        </div>

        {/* Baby Showers & Hen Parties */}
        <div className="bg-white border-2 border-[#1B2D3C]  p-8 flex flex-col justify-between space-y-6 rounded-xl">
          <div className="space-y-4">
            <div className="p-3 bg-[#D9E2EC] text-[#74919e] border border-[#1B2D3C] inline-block rounded-none">
              <Heart className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="font-heading text-xl font-bold italic text-[#1B2D3C]">Hen & baby Showers</h3>
            <p className="text-[#74919e] font-black text-lg">£28.95 per head*</p>
            <p className="text-[#1B2D3C]/85 text-xs leading-relaxed font-semibold">
              For the bride, groom, or parents-to-be seeking a creative evening or afternoon alternative to traditional drinking celebrations. Get everyone together to design a beautiful collaborative dinner tea-set for the happy couple, or personalized toys for the new arrival.
            </p>
            <p className="text-[#1B2D3C]/85 text-xs leading-relaxed font-medium">
              Same package prices and terms apply. If you would like your event to run in our studio after standard closing hours, a surcharge applies and a minimum of 10 painters is required.
            </p>
            <div className="bg-[#D9E2EC]/45 p-4 border border-[#1B2D3C] space-y-1 text-xs text-[#1B2D3C] font-semibold rounded-none">
              <p className="font-bold text-[#74919e] uppercase tracking-wider text-[9px] mb-1">Optional Catering:</p>
              <p>Provide your own nibbles/bubbly, or ask us to coordinate premium local catering for your party upon request.</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEventType('hen-shower');
              const el = document.getElementById('party-calculator');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full py-2.5 bg-[#F0F4F8] text-[#1B2D3C] border-2 border-[#1B2D3C] text-xs font-bold uppercase tracking-widest hover:bg-[#D9E2EC]/50 transition-colors rounded-none cursor-pointer"
          >
            Calculate Hen Package
          </button>
        </div>

        {/* Corporate Team Events */}
        <div className="bg-white border-2 border-[#1B2D3C]  p-8 flex flex-col justify-between space-y-6 rounded-xl">
          <div className="space-y-4">
            <div className="p-3 bg-[#D9E2EC] text-[#74919e] border border-[#1B2D3C] inline-block rounded-none">
              <Users className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="font-heading text-xl font-bold italic text-[#1B2D3C]">Corporate Events</h3>
            <p className="text-[#74919e] font-black text-lg">Custom Packages</p>
            <p className="text-[#1B2D3C]/85 text-xs leading-relaxed font-semibold">
              Whether it’s a calm team-bonding exercise to reduce screens fatigue, or an alternative sweet end-of-year Christmas celebration, Pitter Potter provides a relaxing, therapeutic activity for your business operations.
            </p>
            <p className="text-[#1B2D3C]/85 text-xs leading-relaxed font-medium">
              We arrange pottery selections, provide brushes and stencils, and host guided painting workshops to increase team focus. Contact our team to draft a custom package tailored perfectly to your staff size.
            </p>
            <div className="bg-[#D9E2EC]/45 p-4 border border-[#1B2D3C] space-y-1 text-xs text-[#1B2D3C] font-semibold rounded-none">
              <p className="font-bold text-[#74919e] uppercase tracking-wider text-[9px] mb-1">Ideal for Teams:</p>
              <p>Accommodate 10 to 45 guests across both Putney and Wimbledon locations, including after-hours availability.</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEventType('corporate');
              setCurrentPage('contact');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full py-2.5 bg-[#74919e] text-white border-2 border-[#1B2D3C]  text-xs font-bold uppercase tracking-widest hover:translate-x-[2px] hover:translate-y-[2px]  transition-all rounded-none cursor-pointer"
          >
            Inquire Corporate Plan
          </button>
        </div>
      </div>

      {/* Interactive Party Package Cost & Custom Estimator */}
      <section id="party-calculator" className="bg-[#D9E2EC]/70 border-2 border-[#1B2D3C] p-6 md:p-10  rounded-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-[#74919e] border-2 border-[#1B2D3C] text-[10px] font-bold uppercase tracking-widest ">
              <Sparkles size={12} className="text-[#74919e]" />
              Interactive Party Estimator & Planner
            </div>
            <h3 className="font-heading text-3xl font-black italic text-[#1B2D3C] leading-none">
              Build Your Custom Celebration Package
            </h3>
            <p className="text-xs text-[#1B2D3C]/85 leading-relaxed font-medium">
              Adjust the slider to your planned attendee count. Choose the age group and event type to see our recommended session duration, what's included in your budget, and the reservation terms.
            </p>

            <div className="space-y-4">
              <h4 className="font-bold text-xs text-[#1B2D3C] uppercase tracking-wider">Included In Your Package:</h4>
              <ul className="space-y-2.5 text-xs text-[#1B2D3C]/90 font-medium">
                {inclusions.map((text, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start">
                    <Check className="w-4 h-4 text-[#74919e] shrink-0 mt-0.5 stroke-[2.5]" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Calculator Card */}
          <div className="lg:col-span-6 bg-white p-6 md:p-8 border-2 border-[#1B2D3C]  rounded-xl space-y-6">
            {/* Event Selector */}
            <div className="space-y-2.5">
              <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-widest">
                Event Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'birthday', label: 'Birthday' },
                  { id: 'hen-shower', label: 'Hen/Shower' },
                  { id: 'corporate', label: 'Corporate' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setEventType(t.id as any)}
                    className={`py-2 px-3 text-xs font-bold uppercase tracking-widest border transition-all rounded-none cursor-pointer ${
                      eventType === t.id
                        ? 'bg-[#74919e] border-2 border-[#1B2D3C] text-white '
                        : 'bg-[#F0F4F8] border-stone-300 text-[#1B2D3C] hover:bg-[#D9E2EC]/40'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Attendance Range slider */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-[#1B2D3C] uppercase tracking-widest">
                  Number of Painters ({guestsCount})
                </label>
                <span className="text-[11px] text-[#74919e] font-bold uppercase tracking-wider">Min 5 members</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={guestsCount}
                onChange={(e) => setGuestsCount(parseInt(e.target.value))}
                className="w-full accent-[#74919e] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#1B2D3C]/75 font-mono font-bold">
                <span>5 painters</span>
                <span>25 painters</span>
                <span>50 painters</span>
              </div>
            </div>

            {/* Under 7 age advice */}
            {eventType === 'birthday' && (
              <div className="space-y-2.5">
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-widest">
                  Age of Birthday Star
                </label>
                <div className="grid grid-cols-2 gap-3 text-xs font-bold uppercase tracking-widest">
                  <button
                    onClick={() => setChildAgeGroup('under7')}
                    className={`py-2.5 border text-center transition-all rounded-none cursor-pointer ${
                      childAgeGroup === 'under7'
                        ? 'border-2 border-[#1B2D3C] bg-[#D9E2EC] text-[#74919e]'
                        : 'border-[#1B2D3C]/30 text-stone-600 hover:bg-stone-50 bg-[#F0F4F8]'
                    }`}
                  >
                    Under 7 Years
                  </button>
                  <button
                    onClick={() => setChildAgeGroup('over7')}
                    className={`py-2.5 border text-center transition-all rounded-none cursor-pointer ${
                      childAgeGroup === 'over7'
                        ? 'border-2 border-[#1B2D3C] bg-[#D9E2EC] text-[#74919e]'
                        : 'border-[#1B2D3C]/30 text-stone-600 hover:bg-stone-50 bg-[#F0F4F8]'
                    }`}
                  >
                    7 Years & Older
                  </button>
                </div>
                <div className="flex gap-2.5 items-center text-xs p-3.5 bg-[#F0F4F8] text-[#1B2D3C] border-2 border-[#1B2D3C] rounded-none font-semibold">
                  {childAgeGroup === 'under7' ? (
                    <>
                      <Clock size={15} className="shrink-0 text-[#74919e]" />
                      <span><strong>Notice:</strong> For children under 7, we recommend a shorter <strong>1.5 hours</strong> session to suit their focus span.</span>
                    </>
                  ) : (
                    <>
                      <Clock size={15} className="shrink-0 text-[#74919e]" />
                      <span><strong>Notice:</strong> Included is our standard <strong>2 hours</strong> creative studio painting session.</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Price Calculations */}
            <div className="border-t-2 border-[#1B2D3C] pt-4 space-y-2.5 font-mono text-[#1B2D3C] font-semibold text-xs">
              <div className="flex justify-between">
                <span>Core Package Fee (£28.95 × {guestsCount} guests):</span>
                <span className="font-bold">£{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Studio Fee & Selected Ceramics:</span>
                <span className="text-[#74919e] font-black font-sans uppercase tracking-wider text-[10px]">Included (£22.95 value)</span>
              </div>
              <div className="flex justify-between">
                <span>Non-Refundable Booking Deposit:</span>
                <span className="font-bold">£{depositPrice.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-stone-500 italic font-sans font-normal leading-normal">
                *The £50 deposit secures your slot, holds the table, and is deducted directly from your final bill on the event day.
              </p>
              <div className="flex justify-between text-base font-bold pt-2.5 border-t border-dashed border-[#1B2D3C]/30">
                <span className="font-sans">Estimated Event Cost:</span>
                <span className="text-[#74919e] font-bold text-lg font-mono">£{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Inquire Button */}
            <button
              id="confirm-party-calculator-inquiry"
              onClick={handleInquireParty}
              className="w-full py-4 text-xs font-bold uppercase tracking-widest text-white bg-[#74919e] border-2 border-[#1B2D3C]  rounded-none hover:translate-x-[2px] hover:translate-y-[2px]  active:translate-x-0 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CalendarRange size={16} />
              Inquire Booking For {guestsCount} Painters
            </button>
          </div>

        </div>
      </section>

      {/* Safety Notice Callout & Fine print */}
      <div className="bg-white border-2 border-[#1B2D3C]  p-6 rounded-none flex gap-4 items-start">
        <AlertCircle className="w-5 h-5 text-[#74919e] shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <h4 className="font-bold text-[#1B2D3C] text-sm">Need Additional Personalizations?</h4>
          <p className="text-stone-600 text-xs leading-relaxed font-semibold">
            Interested in after-hours parties, custom pottery requests, or bespoke writing and decorative lettering? 
            Our professionals are on hand to provide writing services starting from £10.00 per item! Write to us details on <a href="mailto:info@pitterpotter.co.uk" className="text-[#74919e] underline font-bold">info@pitterpotter.co.uk</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
