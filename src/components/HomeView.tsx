import { motion } from 'motion/react';
import { MapPin, Phone, Clock, ArrowRight } from 'lucide-react';
import { Page } from '../types';
import { Images } from '../images';
import EditableText from './EditableText';
import EditableImage from './EditableImage';

interface HomeViewProps {
  adminMode?: boolean;
 setCurrentPage: (page: Page) => void;
 setVisitPreset?: (preset: { paintersCount: number; itemId: string }) => void;
}

export default function HomeView({ setCurrentPage, adminMode = false }: HomeViewProps) {
 return (
 <div id="home-view" className="space-y-16 pb-20">
 {/* Hero Banner Section */}
 <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-[#FFFFFF]">
 <EditableImage
 key="hero_image"
 page="home"
 defaultSrc={Images.studioHero}
 alt="Pitter Potter Ceramic Studio"
 className="absolute inset-0 w-full h-full object-cover opacity-90 rounded-lg"
 adminMode={adminMode}
 />
 <div className="absolute inset-0 bg-gradient-to-r from-[#FFFFFF]/95 via-[#FFFFFF]/70 to-transparent" />
 <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 z-10 w-full">
 <motion.div
 initial={{ opacity: 0, y: 25 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6 }}
 className="max-w-xl md:max-w-2xl text-left bg-[#DBE7E4]/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl"
 >
 <img
            src={Images.logo}
            alt="Pitter Potter Logo"
            className="h-20 sm:h-24 w-auto object-contain mb-6"
          />
 <div className="mb-6">
 <EditableText
 key="hero_title"
 page="home"
 defaultValue="Paint your own Pottery Studio"
 className="font-heading text-xl sm:text-2xl md:text-3xl text-[#1B2D3C] font-light leading-relaxed block"
 adminMode={adminMode}
 />
 <EditableText
 key="hero_locations"
 page="home"
 defaultValue="Putney & Wimbledon"
 className="font-heading text-xl sm:text-2xl md:text-3xl text-[#1B2D3C] font-light leading-relaxed block"
 adminMode={adminMode}
 />
 </div>
 <div className="flex flex-wrap gap-4">
 <button
 id="hero-book-button"
 onClick={() => setCurrentPage('book')}
 className="px-7 py-3.5 bg-white text-[#1B2D3C] text-sm tracking-wide border border-[#DBE7E4]/30 hover:border-[#DBE7E4] transition-all cursor-pointer"
 >
 Book a Session
 </button>
 <button
 id="hero-contact-button"
 onClick={() => setCurrentPage('contact-info')}
 className="px-7 py-3.5 bg-white text-[#1B2D3C] text-sm tracking-wide border border-[#DBE7E4]/30 hover:border-[#DBE7E4] transition-all cursor-pointer"
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
 className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 rounded-lg bg-[#DBE7E4]"
 referrerPolicy="no-referrer"
 />
 </div>
 <div className="space-y-4">
 <h2 className="font-heading text-2xl lg:text-3xl tracking-tight text-[#1B2D3C]">
 Putney Studio
 </h2>
 <p className="card-body text-[#1B2D3C]/80 leading-relaxed">
 Our bright, airy flagship studio on Upper Richmond Road, perfect for individuals, families, and creative parties.
 </p>
 <div className="space-y-2 card-body text-[#1B2D3C]/80">
 <div className="flex items-start gap-2.5">
 <MapPin className="w-4 h-4 text-[#1B2D3C] shrink-0 mt-0.5" />
 <span>234 Upper Richmond Road, Putney SW15 6TG</span>
 </div>
 <div className="flex items-start gap-2.5">
 <Phone className="w-4 h-4 text-[#1B2D3C] shrink-0 mt-0.5" />
 <span>020 87881635</span>
 </div>
 <div className="flex items-start gap-2.5">
 <Clock className="w-4 h-4 text-[#1B2D3C] shrink-0 mt-0.5" />
 <table className="text-xs w-full">
 <tbody>
 <tr><td className="pr-3">Monday</td><td className="text-[#1B2D3C]/60">Closed (except school holidays)</td></tr>
 <tr><td className="pr-3">Tuesday – Saturday</td><td>10am – 6pm</td></tr>
 <tr><td className="pr-3">Sunday</td><td>11am – 5pm</td></tr>
 </tbody>
 </table>
 </div>
 </div>
 <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#1B2D3C] pt-2">
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
 className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 rounded-lg bg-[#DBE7E4]"
 referrerPolicy="no-referrer"
 />
 </div>
 <div className="space-y-4">
 <h2 className="font-heading text-2xl lg:text-3xl tracking-tight text-[#1B2D3C]">
 Wimbledon Studio
 </h2>
 <p className="card-body text-[#1B2D3C]/80 leading-relaxed">
 Our cozy, high-street location on Wimbledon Hill Road, ideal for baby clay imprints and friendly gatherings.
 </p>
 <div className="space-y-2 card-body text-[#1B2D3C]/80">
 <div className="flex items-start gap-2.5">
 <MapPin className="w-4 h-4 text-[#1B2D3C] shrink-0 mt-0.5" />
 <span>52 Wimbledon Hill Road, Wimbledon SW19 7PA</span>
 </div>
 <div className="flex items-start gap-2.5">
 <Phone className="w-4 h-4 text-[#1B2D3C] shrink-0 mt-0.5" />
 <span>020 37704499</span>
 </div>
 <div className="flex items-start gap-2.5">
 <Clock className="w-4 h-4 text-[#1B2D3C] shrink-0 mt-0.5" />
 <table className="text-xs w-full">
 <tbody>
 <tr><td className="pr-3">Monday</td><td className="text-[#1B2D3C]/60">Closed (except school holidays)</td></tr>
 <tr><td className="pr-3">Tuesday – Saturday</td><td>10am – 6pm</td></tr>
 <tr><td className="pr-3">Sunday</td><td>11am – 5pm</td></tr>
 </tbody>
 </table>
 </div>
 </div>
 <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#1B2D3C] pt-2">
 View Studio <ArrowRight className="w-4 h-4" />
 </span>
 </div>
 </button>
 </div>
 </section>

 {/* What We Do */}
 <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
 <div className="text-center md:text-left space-y-2 mb-8">
 <h2 className="font-heading text-3xl md:text-4xl tracking-tight text-[#1B2D3C]">What We Do</h2>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {[
 { title: 'Paint Your Own Pottery', desc: 'Choose from 150+ shapes and paint with premium glazes.', image: Images.potteryGallery, page: 'pricing' as Page },
 { title: 'Baby Prints', desc: 'Capture tiny hand and foot impressions in clay keepsakes.', image: Images.clayImprint, page: 'baby-prints' as Page },
 { title: 'Parties & Events', desc: 'Birthdays, hen parties, baby showers and corporate groups.', image: Images.birthdayParties, page: 'parties' as Page },
 { title: 'More Workshops', desc: 'Coming soon...', badge: 'Coming Soon', image: Images.studioHero },
 ].map((item) => (
 <div
 key={item.title}
 onClick={() => item.page && setCurrentPage(item.page)}
 className={`text-left bg-white shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col ${item.page ? 'cursor-pointer' : ''}`}
 >
 <div className="p-6">
 <h3 className="font-heading text-lg tracking-tight text-[#1B2D3C] mb-2">{item.title}</h3>
 </div>
 <div className="relative aspect-[4/3] overflow-hidden">
 <img
 src={item.image}
 alt={item.title}
 className="w-full h-full object-cover rounded-lg"
 referrerPolicy="no-referrer"
 />
 {item.badge && (
 <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#D6E2E9]/90 text-[#1B2D3C] text-[10px] uppercase tracking-widest">
 {item.badge}
 </span>
 )}
 </div>
 <div className="p-6 flex-1">
 <p className="card-body text-[#1B2D3C] leading-relaxed">{item.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </section>

 </div>
 );
}
