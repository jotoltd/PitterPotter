import { motion } from 'motion/react';
import { MapPin, Phone, ArrowRight } from 'lucide-react';
import { Page } from '../types';
import { Images } from '../images';

interface HomeViewProps {
 setCurrentPage: (page: Page) => void;
 setVisitPreset?: (preset: { paintersCount: number; itemId: string }) => void;
}

export default function HomeView({ setCurrentPage }: HomeViewProps) {
 return (
 <div id="home-view" className="space-y-16 pb-20">
 {/* Hero Banner Section */}
 <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-[#FFFFFF]">
 <img
 src={Images.studioHero}
 alt="Pitter Potter Ceramic Studio"
 className="absolute inset-0 w-full h-full object-cover opacity-90 rounded-lg"
 referrerPolicy="no-referrer"
 />
 <div className="absolute inset-0 bg-gradient-to-r from-[#FFFFFF]/95 via-[#FFFFFF]/70 to-transparent" />
 <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 z-10 w-full">
 <motion.div
 initial={{ opacity: 0, y: 25 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6 }}
 className="max-w-xl md:max-w-2xl text-left"
 >
 <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#1B2D3C] leading-[1.05] mb-6">
 Paint Your<br />Own Pottery
 </h1>
 <p className="font-heading text-xl sm:text-2xl md:text-3xl text-[#1B2D3C] mb-6 font-light leading-relaxed">
 Pitter Potter - Putney & Wimbledon
 </p>
 <p className="text-[#1B2D3C] text-lg sm:text-xl leading-relaxed mb-8 max-w-lg">
 Bright, welcoming ceramic studios in South West London. Choose from 150+ shapes, paint with premium glazes, and we'll fire your masterpiece.
 </p>
 <div className="flex flex-wrap gap-4">
 <button
 id="hero-book-button"
 onClick={() => setCurrentPage('book')}
 className="px-7 py-3.5 bg-[#DBE7E4] text-[#1B2D3C] font-bold text-sm uppercase tracking-widest hover:bg-[#D6E2E9] transition-all cursor-pointer"
 >
 Book a Session
 </button>
 <button
 id="hero-contact-button"
 onClick={() => setCurrentPage('contact')}
 className="px-7 py-3.5 bg-white text-[#1B2D3C] font-bold text-sm uppercase tracking-widest border border-[#DBE7E4]/30 hover:border-[#DBE7E4] transition-all cursor-pointer"
 >
 Contact Us
 </button>
 </div>
 </motion.div>
 </div>
 </section>

 {/* Clean Location Cards */}
 <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <button
 onClick={() => setCurrentPage('putney')}
 className="group text-left bg-white p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer"
 >
 <div className="relative aspect-[4/3] overflow-hidden mb-6">
 <img
 src={Images.putneyStudio}
 alt="Pitter Potter Putney Studio"
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-lg"
 referrerPolicy="no-referrer"
 />
 </div>
 <div className="space-y-4">
 <h2 className="font-heading text-2xl lg:text-3xl font-black text-[#1B2D3C]">
 Putney Studio
 </h2>
 <p className="text-sm text-[#1B2D3C]/80 leading-relaxed">
 Our bright, airy flagship studio on Upper Richmond Road, perfect for individuals, families, and creative parties.
 </p>
 <div className="space-y-2 text-sm text-[#1B2D3C]/80">
 <div className="flex items-start gap-2.5">
 <MapPin className="w-4 h-4 text-[#1B2D3C] shrink-0 mt-0.5" />
 <span>234 Upper Richmond Road, Putney SW15 6TG</span>
 </div>
 <div className="flex items-start gap-2.5">
 <Phone className="w-4 h-4 text-[#1B2D3C] shrink-0 mt-0.5" />
 <span>020 87881635</span>
 </div>
 </div>
 <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1B2D3C] pt-2">
 View Studio <ArrowRight className="w-4 h-4" />
 </span>
 </div>
 </button>

 <button
 onClick={() => setCurrentPage('wimbledon')}
 className="group text-left bg-white p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer"
 >
 <div className="relative aspect-[4/3] overflow-hidden mb-6">
 <img
 src={Images.wimbledonStudio}
 alt="Pitter Potter Wimbledon Studio"
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-lg"
 referrerPolicy="no-referrer"
 />
 </div>
 <div className="space-y-4">
 <h2 className="font-heading text-2xl lg:text-3xl font-black text-[#1B2D3C]">
 Wimbledon Studio
 </h2>
 <p className="text-sm text-[#1B2D3C]/80 leading-relaxed">
 Our cozy, high-street location on Wimbledon Hill Road, ideal for baby clay imprints and friendly gatherings.
 </p>
 <div className="space-y-2 text-sm text-[#1B2D3C]/80">
 <div className="flex items-start gap-2.5">
 <MapPin className="w-4 h-4 text-[#1B2D3C] shrink-0 mt-0.5" />
 <span>52 Wimbledon Hill Road, Wimbledon SW19 7PA</span>
 </div>
 <div className="flex items-start gap-2.5">
 <Phone className="w-4 h-4 text-[#1B2D3C] shrink-0 mt-0.5" />
 <span>020 37704499</span>
 </div>
 </div>
 <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1B2D3C] pt-2">
 View Studio <ArrowRight className="w-4 h-4" />
 </span>
 </div>
 </button>
 </div>
 </section>

 {/* What We Do */}
 <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
 <div className="text-center md:text-left space-y-2 mb-8">
 <span className="text-xs tracking-widest text-[#1B2D3C] font-black uppercase block">What We Do</span>
 <h2 className="font-heading text-3xl md:text-4xl font-black text-[#1B2D3C]">Creative Studio Sessions</h2>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {[
 { title: 'Paint Your Own Pottery', desc: 'Choose from 150+ shapes and paint with premium glazes.', image: Images.potteryGallery },
 { title: 'Baby Prints', desc: 'Capture tiny hand and foot impressions in clay keepsakes.', image: Images.clayImprint },
 { title: 'Parties & Events', desc: 'Birthdays, hen parties, baby showers and corporate groups.', image: Images.birthdayParties },
 { title: 'More Workshops', desc: 'Coming soon...', badge: 'Coming Soon', image: Images.studioHero },
 ].map((item) => (
 <div
 key={item.title}
 className="text-left bg-white shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
 >
 <div className="relative aspect-[4/3] overflow-hidden">
 <img
 src={item.image}
 alt={item.title}
 className="w-full h-full object-cover rounded-lg"
 referrerPolicy="no-referrer"
 />
 {item.badge && (
 <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#D6E2E9]/90 text-[#1B2D3C] text-[10px] font-black uppercase tracking-widest">
 {item.badge}
 </span>
 )}
 </div>
 <div className="p-6 flex-1">
 <h3 className="font-heading text-lg font-black text-[#1B2D3C] mb-2">{item.title}</h3>
 <p className="text-xs text-[#1B2D3C] leading-relaxed">{item.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </section>

 </div>
 );
}
