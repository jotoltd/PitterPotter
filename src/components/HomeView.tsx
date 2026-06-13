import { motion, AnimatePresence } from 'motion/react';
import { Palette, Sparkles, Gift, Heart, Calendar, Phone, Mail, MapPin, Calculator, ScrollText, Check, Clock } from 'lucide-react';
import { Page } from '../types';
import { Images } from '../images';
import { useState, useEffect } from 'react';

interface HomeViewProps {
  setCurrentPage: (page: Page) => void;
  setVisitPreset?: (preset: { paintersCount: number; itemId: string }) => void;
}

export default function HomeView({ setCurrentPage, setVisitPreset }: HomeViewProps) {
  const [painters, setPainters] = useState<number>(2);
  const [selectedPiece, setSelectedPiece] = useState<string>('mugs');
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  const heroImages = [Images.studioHero, Images.birthdayParties, Images.clayImprint, Images.potteryGallery];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const piecesConfig = [
    { id: 'mugs', name: 'Cosy Mugs & Teacups', price: 11.95, label: '£11.95+' },
    { id: 'animals', name: 'Party Animals (over 30 types)', price: 16.95, label: '£16.95' },
    { id: 'plates', name: 'Standard Plates', price: 18.95, label: '£18.95+' },
    { id: 'banks', name: 'Money Banks (over 20 types)', price: 22.95, label: '£22.95' },
    { id: 'bowls', name: 'Pasta & Cereal Bowls', price: 15.95, label: '£15.95+' },
    { id: 'eggcups', name: 'Breakfast Egg Cup', price: 8.95, label: '£8.95' },
  ];

  const currentPieceDetail = piecesConfig.find(p => p.id === selectedPiece) || piecesConfig[0];
  const studioFeeTotal = painters * 5.95;
  const potteryTotal = painters * currentPieceDetail.price;
  const totalEstimation = studioFeeTotal + potteryTotal;

  const handleApplyPreset = () => {
    if (setVisitPreset) {
      setVisitPreset({ paintersCount: painters, itemId: selectedPiece });
    }
    setCurrentPage('contact');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const services = [
    {
      title: 'Paint Your Own Pottery',
      image: Images.potteryGallery,
      description: 'Choose from over 150 ceramic objects—from mugs and plates to beautiful vases and teapots. Paint your masterpiece, and let us handle glazing and firing!',
      icon: Palette,
      color: 'from-[#74919e]/10 to-[#1B2D3C]/10',
      badge: '150+ Shapes'
    },
    {
      title: 'Clay Imprints',
      image: Images.clayImprint,
      description: 'Capture beautiful impressions of your baby\'s tiny hands or feet pressed into soft clay. Our staff help you take prints on stunning durable pottery.',
      icon: Heart,
      color: 'from-[#74919e]/10 to-[#486581]/15',
      badge: 'Beautiful Keepsake'
    },
    {
      title: 'Parties & Group Events',
      image: Images.birthdayParties,
      description: 'Host memorable, creative birthday parties, baby showers, hen parties, corporate team builders, and gatherings directly in our friendly studios.',
      icon: Gift,
      color: 'from-[#1B2D3C]/10 to-[#74919e]/15',
      badge: 'From £28.95/head'
    }
  ];

  return (
    <div id="home-view" className="space-y-24 pb-20">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-[#F0F4F8] py-8 md:py-12 lg:py-16 border-b-2 border-[#1B2D3C]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1B2D3C]/95 via-[#1B2D3C]/70 to-transparent z-10" />
        <img
          src={heroImages[currentHeroIndex]}
          alt="Pitter Potter Ceramic Studio Setup"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-opacity duration-500"
          referrerPolicy="no-referrer"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 z-20 flex flex-col justify-center h-full">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl md:max-w-2xl text-left text-white"
          >
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-black italic tracking-tight text-white leading-[1.05] mb-6">
              Paint Your<br />Own Pottery
            </h1>

            <p className="font-heading italic text-xl sm:text-2xl md:text-3xl text-[#D9E2EC] mb-6 font-light leading-relaxed">
              Pitter Potter - Putney & Wimbledon Studios
            </p>

            <p className="text-[#F0F4F8]/85 text-xl sm:text-2xl leading-tight mb-8 max-w-lg">
              Step inside our bright, welcoming ceramic paint shops and bring unglazed pottery to vibrant life. Choose from 150+ shapes, paint with our premium glazes, and we'll fire your masterpiece in our kilns. Perfect for families, dates, parties, and creative souls of all ages.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                id="hero-book-button"
                onClick={() => setCurrentPage('contact')}
                className="px-7 py-3.5 bg-[#74919e] text-white font-bold text-sm uppercase tracking-widest border-2 border-[#1B2D3C]  hover:translate-x-[2px] hover:translate-y-[2px]  active:translate-x-0 active:translate-y-0 active: transition-all cursor-pointer"
              >
                Book Your Studio Slot
              </button>
              <button
                id="hero-prices-button"
                onClick={() => setCurrentPage('pricing')}
                className="px-7 py-3.5 bg-transparent text-white font-bold text-sm uppercase tracking-widest border-2 border-white hover:bg-white/10 transition-all cursor-pointer"
              >
                Explore Pottery & Prices
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Dual Locations Highlight Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 -mt-4 md:-mt-6 lg:-mt-8 relative z-30 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Putney Studio Prominent Card */}
          <button
            onClick={() => setCurrentPage('putney')}
            className="group bg-white border-2 border-[#1B2D3C] overflow-hidden hover:translate-y-[-2px] hover: transition-all duration-300 flex flex-col cursor-pointer text-left rounded-lg"
          >
            <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-[#1B2D3C]">
              <img
                src={Images.putneyStudio}
                alt="Pitter Potter Putney Studio Exterior"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3">
                <span className="px-3 py-1 bg-[#D9E2EC] text-[#74919e] border border-[#1B2D3C] text-[10px] font-black uppercase tracking-widest rounded-none">
                  SW15 Putney Studio
                </span>
              </div>
              <div className="absolute top-3 right-3">
                <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest bg-emerald-50 px-2.5 py-0.5 border border-emerald-300">
                  Open Today
                </span>
              </div>
            </div>
            <div className="p-6 lg:p-8 flex flex-col justify-between space-y-6 flex-1">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <img src={Images.logo} alt="Pitter Potter" className="h-10 w-auto object-contain" />
                  <div className="h-8 w-px bg-[#1B2D3C]/30"></div>
                  <h2 className="font-heading text-2xl lg:text-3xl font-black italic tracking-tight text-[#74919e]">
                    Putney
                  </h2>
                </div>
                <p className="text-xs text-[#1B2D3C]/80 leading-relaxed font-semibold">
                  Our bright, airy flagship studio on Upper Richmond Road, perfect for individuals, families, and creative birthday parties.
                </p>
                <div className="space-y-3 pt-2 text-xs text-[#1B2D3C] font-semibold">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#74919e] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#1B2D3C]">Address:</span>
                      <p className="font-medium text-stone-600">234 Upper Richmond Road, Putney SW15 6TG</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-[#74919e] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#1B2D3C]">Booking & Inquiries:</span>
                      <p className="font-medium text-stone-600">
                        <a href="tel:02087881635" className="text-[#74919e] hover:underline font-bold" onClick={(e) => e.stopPropagation()}>020 87881635</a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <div className="w-full py-3 bg-[#74919e] text-white text-xs font-black uppercase tracking-widest border-2 border-[#1B2D3C] text-center">
                View Putney Studio
              </div>
            </div>
          </button>

          {" "}
          {/* Wimbledon Studio Prominent Card */}
          <button
            onClick={() => setCurrentPage('wimbledon')}
            className="group bg-white border-2 border-[#1B2D3C] overflow-hidden hover:translate-y-[-2px] hover: transition-all duration-300 flex flex-col cursor-pointer text-left rounded-lg"
          >
            <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-[#1B2D3C]">
              <img
                src={Images.wimbledonStudio}
                alt="Pitter Potter Wimbledon Studio Exterior"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3">
                <span className="px-3 py-1 bg-[#D9E2EC] text-[#74919e] border border-[#1B2D3C] text-[10px] font-black uppercase tracking-widest rounded-none">
                  SW19 Wimbledon Studio
                </span>
              </div>
              <div className="absolute top-3 right-3">
                <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest bg-emerald-50 px-2.5 py-0.5 border border-emerald-300">
                  Open Today
                </span>
              </div>
            </div>
            <div className="p-6 lg:p-8 flex flex-col justify-between space-y-6 flex-1">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <img src={Images.logo} alt="Pitter Potter" className="h-10 w-auto object-contain" />
                  <div className="h-8 w-px bg-[#1B2D3C]/30"></div>
                  <h2 className="font-heading text-2xl lg:text-3xl font-black italic tracking-tight text-[#74919e]">
                    Wimbledon
                  </h2>
                </div>
                <p className="text-xs text-[#1B2D3C]/80 leading-relaxed font-semibold">
                  Our cozy, high-street location on Wimbledon Hill Road, ideal for baby clay imprints, seasonal pottery making, and friendly gatherings.
                </p>
                <div className="space-y-3 pt-2 text-xs text-[#1B2D3C] font-semibold">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#74919e] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#1B2D3C]">Address:</span>
                      <p className="font-medium text-stone-600">52 Wimbledon Hill Road, Wimbledon SW19 7PA</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-[#74919e] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#1B2D3C]">Booking & Inquiries:</span>
                      <p className="font-medium text-stone-600">
                        <a href="tel:02037704499" className="text-[#74919e] hover:underline font-bold" onClick={(e) => e.stopPropagation()}>020 37704499</a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <div className="w-full py-3 bg-[#74919e] text-white text-xs font-black uppercase tracking-widest border-2 border-[#1B2D3C] text-center">
                View Wimbledon Studio
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Intro Mission Statement Card */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 text-center">
        <div className="bg-white border-2 border-[#1B2D3C] p-8 md:p-12  space-y-6">
          <div className="flex justify-center">
            <div className="w-12 h-12 text-[#F0F4F8] p-2.5 bg-[#74919e] border-2 border-[#1B2D3C]  flex items-center justify-center">
              <Palette className="w-6 h-6 stroke-[2]" />
            </div>
          </div>
          <h2 className="font-heading text-2xl md:text-3.5xl font-black italic tracking-tight text-[#74919e]">
            Independent 'Paint Your Own Pottery' Studio
          </h2>
          <p className="text-[#1B2D3C] text-sm md:text-base leading-relaxed font-medium">
            We are an independent 'paint your own pottery' studio set in the heart of Putney and Wimbledon. We love art and we love to nurture creativity in children and adults alike. Our beautiful studios provide a welcoming environment for artists of all ages. Our friendly staff are always on hand to ensure your time at Pitter Potter is both an enjoyable and memorable experience.
          </p>
          <div className="h-px w-24 bg-[#1B2D3C] mx-auto pt-0" />
        </div>
      </section>

      {/* Services Section / What We Do Bento Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 space-y-12">
        <div className="text-center md:text-left space-y-2">
          <span className="text-xs tracking-widest text-[#74919e] font-black uppercase block">Core Craft Programs</span>
          <h3 className="font-heading text-3xl md:text-4xl font-black italic text-[#1B2D3C]">What We Do</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {services.map((serv, index) => {
            const IconComponent = serv.icon;
            return (
              <motion.div
                key={index}
                className="group flex flex-col rounded-md bg-white border-2 border-[#1B2D3C] overflow-hidden  hover:translate-y-[-2px] hover: transition-all duration-200"
              >
                <div className="relative aspect-video overflow-hidden border-b-2 border-[#1B2D3C]">
                  <div className="absolute inset-0 bg-[#1B2D3C]/10 group-hover:bg-[#74919e]/15 transition-colors duration-300 z-10" />
                  <img
                    src={serv.image}
                    alt={serv.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-3.5 right-3.5 px-3 py-1 bg-[#F0F4F8] text-[#74919e] font-bold text-[10px] uppercase tracking-widest border-2 border-[#1B2D3C]  z-20">
                    {serv.badge}
                  </span>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4 bg-white">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-[#D9E2EC] text-[#74919e] border border-[#1B2D3C] inline-flex items-center justify-center">
                        <IconComponent className="w-5 h-5 stroke-[2]" />
                      </div>
                      <h4 className="font-heading text-lg font-bold italic text-[#1B2D3C]">{serv.title}</h4>
                    </div>
                    <p className="text-xs text-[#1B2D3C]/85 leading-relaxed font-medium">
                      {serv.description}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (serv.title.includes('Parties')) {
                        setCurrentPage('parties');
                      } else if (serv.title.includes('Clay')) {
                        setCurrentPage('faqs');
                      } else {
                        setCurrentPage('pricing');
                      }
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-xs font-bold uppercase tracking-widest text-[#74919e] hover:text-[#1B2D3C] inline-flex items-center gap-1.5 focus:outline-none pt-2 cursor-pointer"
                  >
                    Find out more →
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Interactive Visit Budget Planner Calculator */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div id="cost-estimator-app" className="bg-[#D9E2EC]/70 border-2 border-[#1B2D3C] p-6 md:p-10  rounded-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F0F4F8] text-[#74919e] border-2 border-[#1B2D3C] text-[10px] font-bold uppercase tracking-widest ">
                <Calculator size={12} className="text-[#74919e]" />
                Visit Budget & cost Planner
              </div>
              <h3 className="font-heading text-3xl md:text-4xl font-black italic text-[#1B2D3C] leading-none">
                Plan Your Pottery Session
              </h3>
              <p className="text-xs text-[#1B2D3C]/85 leading-relaxed font-medium">
                Want to know how much your visiting trip will cost? Use our interactive calculator! 
                Specify how many painters you are bringing, choose your preferred pottery item structure, and review instant costs like our custom glazing and kiln firing studio service fee.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-2.5 text-xs text-[#1B2D3C]/85 font-medium">
                  <Check className="w-4 h-4 text-[#74919e] shrink-0 mt-0.5 stroke-[2.5]" />
                  <span><strong>Studio Fee Included:</strong> £5.95 per painter covers all paints, tools, final clear glazing, and kiln firing.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-[#1B2D3C]/85 font-medium">
                  <Check className="w-4 h-4 text-[#74919e] shrink-0 mt-0.5 stroke-[2.5]" />
                  <span><strong>Collection Time:</strong> Finished glossy pottery is cured in our kilns and ready for collection in approximately 14 days.</span>
                </div>
              </div>
            </div>

            {/* Estimator Form Card */}
            <div className="bg-white p-6 md:p-8 border-2 border-[#1B2D3C]  rounded-2xl space-y-6">
              {/* Painter Count Selector */}
              <div className="space-y-2.5">
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-widest">
                  1. How many painters? ({painters})
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPainters(Math.max(1, painters - 1))}
                    className="w-10 h-10 border-2 border-[#1B2D3C] font-bold hover:bg-[#D9E2EC]/60 transition-colors bg-[#F0F4F8] text-[#1B2D3C] rounded-none cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-lg font-black text-[#1B2D3C]">{painters}</span>
                  <button
                    onClick={() => setPainters(Math.min(15, painters + 1))}
                    className="w-10 h-10 border-2 border-[#1B2D3C] font-bold hover:bg-[#D9E2EC]/60 transition-colors bg-[#F0F4F8] text-[#1B2D3C] rounded-none cursor-pointer"
                  >
                    +
                  </button>
                  <span className="text-[11px] text-stone-500 italic ml-2">Max 15 painters</span>
                </div>
              </div>

              {/* Pottery Pieces Selector */}
              <div className="space-y-2.5">
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-widest">
                  2. Select a pottery piece
                </label>
                <select
                  value={selectedPiece}
                  onChange={(e) => setSelectedPiece(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-[#1B2D3C] bg-[#F0F4F8] text-[#1B2D3C] text-xs font-bold uppercase tracking-wider focus:outline-none focus:bg-[#D9E2EC]/30 rounded-none cursor-pointer"
                >
                  {piecesConfig.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.label})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Bill Calculation Details */}
              <div className="border-t-2 border-[#1B2D3C] pt-4 space-y-2.5">
                <div className="flex justify-between text-xs text-[#1B2D3C]/85 font-medium">
                  <span>Studio Fee (£5.95 × {painters} painter{painters > 1 ? 's' : ''}):</span>
                  <span className="font-mono font-bold text-[#1B2D3C]">£{studioFeeTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-[#1B2D3C]/85 font-medium">
                  <span>Selected Pottery ({currentPieceDetail.name} × {painters}):</span>
                  <span className="font-mono font-bold text-[#1B2D3C]">£{potteryTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-black text-[#1B2D3C] pt-2.5 border-t border-dashed border-[#1B2D3C]/40">
                  <span className="text-sm font-bold">Estimated Total Visit Cost:</span>
                  <span className="font-mono text-[#74919e] text-lg">£{totalEstimation.toFixed(2)}</span>
                </div>
              </div>

              {/* CTA */}
              <button
                id="apply-estimator-preset"
                onClick={handleApplyPreset}
                className="w-full py-3.5 bg-[#74919e] text-white text-xs font-bold uppercase tracking-widest border-2 border-[#1B2D3C]  rounded-none hover:translate-x-[2px] hover:translate-y-[2px]  active:translate-x-0 active:translate-y-0 active: transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ScrollText size={14} className="text-white" />
                Send Studio Booking Request
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Opening Hours & Studio Addresses Quick Grid */}
      <section className="bg-[#D9E2EC]/40 py-14 border-y-2 border-[#1B2D3C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hours */}
            <div className="lg:col-span-5 space-y-6">
              <h3 className="font-heading text-3xl font-black italic text-[#1B2D3C]">Opening Hours</h3>
              <p className="text-[#1B2D3C]/85 text-xs sm:text-sm font-medium leading-relaxed">
                Our studios are closed on Mondays to allow the firing teams to unpack and sort hundreds of weekend masterpieces, but we operate full-day slots otherwise.
              </p>
              
              <div className="divide-y divide-[#1B2D3C]/20 text-xs sm:text-sm text-[#1B2D3C] font-medium">
                <div className="flex justify-between py-2.5">
                  <span className="font-bold">Monday:</span>
                  <span className="text-stone-500 italic">Closed (except school holidays)</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="font-bold">Tuesday - Saturday:</span>
                  <span>10:00am - 6:00pm</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="font-bold">Sunday:</span>
                  <span>11:00am - 5:00pm</span>
                </div>
              </div>
            </div>

            {/* Split Location Cards */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-6 bg-white border-2 border-[#1B2D3C]  rounded-lg space-y-3">
                <h4 className="font-heading text-lg font-bold text-[#74919e] italic">No Booking Needed for Walk-ins!</h4>
                <p className="text-stone-600 text-xs leading-relaxed font-semibold">
                  For individual designers and groups of up to 5 painters, you are welcome to walk straight into our Putney or Wimbledon studios! We offer craft spaces on a first-come, first-served basis.
                </p>
                <p className="text-stone-600 text-xs leading-relaxed font-semibold">
                  Planning for a larger group, clay footprint keepsake assistance, or a dynamic party event? Please submit a reservation request online or reach our studio hotlines directly to hold tables.
                </p>
                <div className="flex flex-wrap gap-4 pt-1.5">
                  <button
                    onClick={() => {
                      setCurrentPage('contact');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-5 py-2.5 bg-[#74919e] text-white text-xs font-black uppercase tracking-widest border-2 border-[#1B2D3C]  hover:translate-x-[1px] hover:translate-y-[1px]  transition-all cursor-pointer"
                  >
                    Submit Booking Request
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPage('pricing');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-5 py-2.5 bg-white text-[#1B2D3C] text-xs font-black uppercase tracking-widest border-2 border-[#1B2D3C] hover:bg-[#F0F4F8] transition-all cursor-pointer"
                  >
                    Explore Pricing Catalog
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
