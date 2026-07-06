import { motion } from 'motion/react';
import { Clock, ArrowRight } from 'lucide-react';
import { Page } from '../types';
import { Images } from '../images';
import EditableText from './EditableText';
import EditableImage from './EditableImage';

interface BookViewProps {
 setCurrentPage: (page: Page) => void;
 adminMode?: boolean;
}

const STUDIOS = [
 {
 id: 'Putney',
 name: 'Putney Studio',
 image: Images.putneyStudio,
 description: 'Our bright, airy flagship studio on Upper Richmond Road. Perfect for individuals, families, and creative birthday parties.',
 hours: [
 { day: 'Monday', time: 'Closed (except school holidays)' },
 { day: 'Tuesday - Saturday', time: '10:00am - 6:00pm' },
 { day: 'Sunday', time: '11:00am - 5:00pm' },
 ],
 },
 {
 id: 'Wimbledon',
 name: 'Wimbledon Studio',
 image: Images.wimbledonStudio,
 description: 'Our cozy, high-street location on Wimbledon Hill Road. Ideal for baby clay imprints and friendly gatherings.',
 hours: [
 { day: 'Monday', time: 'Closed (except school holidays)' },
 { day: 'Tuesday - Saturday', time: '10:00am - 6:00pm' },
 { day: 'Sunday', time: '11:00am - 5:00pm' },
 ],
 },
];

export default function BookView({ setCurrentPage, adminMode = false }: BookViewProps) {
 const handleBook = (studio: 'Putney' | 'Wimbledon') => {
 localStorage.setItem('pp_selected_studio', studio);
 setCurrentPage(studio === 'Putney' ? 'putney' : 'wimbledon');
 window.scrollTo({ top: 0, behavior: 'smooth' });
 };

 return (
 <div id="book-view" className="space-y-12 pb-20 pt-6">
 {/* Header */}
 <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center space-y-4 max-w-3xl">
 <h1 className="font-heading text-3xl md:text-4xl font-black text-[#1B2D3C] tracking-tight"><EditableText contentKey="book_title" page="book" defaultValue="Book a Session" adminMode={adminMode} className="font-heading text-3xl md:text-4xl text-[#1B2D3C] tracking-tight" /></h1>
 <p className="text-[#1B2D3C]/85 text-xs sm:text-sm font-medium leading-relaxed">
 <EditableText contentKey="book_description" page="book" defaultValue="Select which studio you would like to visit. Both locations offer the same paint-your-own-pottery experience with friendly staff and premium glazes." adminMode={adminMode} className="text-xs sm:text-sm text-[#1B2D3C]/85 leading-relaxed" />
 </p>
 </div>

 {/* Studio Cards */}
 <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 {STUDIOS.map((studio) => (
 <div
 key={studio.id}
 className="bg-white p-8 shadow-sm flex flex-col space-y-6"
 >
 <div className="relative aspect-[4/3] overflow-hidden">
 <EditableImage
 contentKey={`book_${studio.id.toLowerCase()}_image`}
 page="book"
 defaultSrc={studio.image}
 alt={studio.name}
 className="w-full h-full object-cover rounded-lg"
 adminMode={adminMode}
 />
 </div>

 <div className="space-y-4 flex-1">
 <h2 className="font-heading text-2xl lg:text-3xl font-black text-[#1B2D3C]">
 <EditableText contentKey={`book_${studio.id.toLowerCase()}_name`} page="book" defaultValue={studio.name} adminMode={adminMode} className="font-heading text-2xl lg:text-3xl text-[#1B2D3C]" />
 </h2>
 <p className="text-sm text-[#1B2D3C]/80 leading-relaxed">
 <EditableText contentKey={`book_${studio.id.toLowerCase()}_description`} page="book" defaultValue={studio.description} adminMode={adminMode} className="text-sm text-[#1B2D3C]/80 leading-relaxed" />
 </p>

 <div className="space-y-2">
 <div className="flex items-center gap-2 text-[#1B2D3C]">
 <Clock className="w-4 h-4" />
 <span className="text-xs font-black uppercase tracking-widest"><EditableText contentKey={`book_${studio.id.toLowerCase()}_hours_label`} page="book" defaultValue="Opening Hours" adminMode={adminMode} className="text-xs uppercase tracking-widest text-[#1B2D3C]" /></span>
 </div>
 <div className="divide-y divide-[#1B2D3C]/10 text-sm text-[#1B2D3C] font-medium">
 {studio.hours.map(({ day, time }, index) => (
 <div key={`${day}-${index}`} className="flex justify-between py-2">
 <span className="font-bold"><EditableText contentKey={`book_${studio.id.toLowerCase()}_hours_${day.toLowerCase().replace(/[^a-z]/g, '_')}`} page="book" defaultValue={day} adminMode={adminMode} className="text-sm text-[#1B2D3C]" /></span>
 <span className={time.includes('Closed') ? 'text-stone-500 ' : ''}><EditableText contentKey={`book_${studio.id.toLowerCase()}_hours_${day.toLowerCase().replace(/[^a-z]/g, '_')}_time`} page="book" defaultValue={time} adminMode={adminMode} className="text-sm text-[#1B2D3C]" /></span>
 </div>
 ))}
 </div>
 </div>
 </div>

 <button
 onClick={() => handleBook(studio.id as 'Putney' | 'Wimbledon')}
 className="w-full py-3.5 bg-[#DBE7E4] text-[#1B2D3C] font-bold text-xs uppercase tracking-widest hover:bg-[#D6E2E9] transition-all cursor-pointer flex items-center justify-center gap-2"
 >
 <EditableText contentKey={`book_${studio.id.toLowerCase()}_button`} page="book" defaultValue="Book Now" adminMode={adminMode} className="text-xs uppercase tracking-widest" /> <ArrowRight className="w-4 h-4" />
 </button>
 </div>
 ))}
 </div>
 </section>
 </div>
 );
}
