import { useState } from 'react';
import { GALLERY_ITEMS } from '../data';
import { Images } from '../images';
import { Grid, Eye, Bookmark, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import EditableText from './EditableText';

interface GalleryViewProps {
  adminMode?: boolean;
}

export default function GalleryView({ adminMode = false }: GalleryViewProps) {
 const [selectedCategory, setSelectedCategory] = useState<'all' | 'creation' | 'studio' | 'party' | 'imprint'>('all');

 // Map placeholders g1, g2, g3, g4 to our beautiful generated image paths
 const resolvedGalleryItems = GALLERY_ITEMS.map((item) => {
 let imageUrl = item.imageUrl;
 if (item.id === 'g1') imageUrl = Images.studioHero;
 if (item.id === 'g2') imageUrl = Images.birthdayParties;
 if (item.id === 'g3') imageUrl = Images.clayImprint;
 if (item.id === 'g4') imageUrl = Images.potteryGallery;
 return { ...item, imageUrl };
 });

 const filteredItems = resolvedGalleryItems.filter(
 (item) => selectedCategory === 'all' || item.category === selectedCategory
 );

 return (
 <div id="gallery-view" className="space-y-12 pb-20 pt-6">
 {/* Gallery Header */}
 <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center space-y-4 max-w-3xl">
 <EditableText key="gallery_tagline" page="gallery" defaultValue="Artisan Exhibition" adminMode={adminMode} className="text-xs tracking-widest text-[#1B2D3C] font-black uppercase block" />
 <EditableText key="gallery_title" page="gallery" defaultValue="Studio Gallery" adminMode={adminMode} className="font-heading text-4xl md:text-5xl font-black text-[#1B2D3C] tracking-tight" />
 <EditableText key="gallery_subtitle" page="gallery" defaultValue="Feast your eyes on cozy studio snapshots, messy kids birthday parties, glossy newly fired plates, and beautifully preserved toddler clay milestones. Get inspired for your own pottery design!" adminMode={adminMode} className="text-[#1B2D3C]/85 text-xs sm:text-sm font-medium leading-relaxed" />
 </div>

 {/* Filter Categories tab */}
 <div className="flex flex-wrap gap-1.5 justify-center max-w-7xl mx-auto px-4">
 {[
 { value: 'all', label: 'Show All Designs' },
 { value: 'creation', label: 'Glazed Over Masterpieces' },
 { value: 'studio', label: 'Studio Workspaces' },
 { value: 'party', label: 'Parties & Events' },
 { value: 'imprint', label: 'Clay Keepsake Prints' }
 ].map((category) => (
 <button
 key={category.value}
 onClick={() => setSelectedCategory(category.value as any)}
 className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border-2 transition-all cursor-pointer ${
 selectedCategory === category.value
 ? 'bg-[#DBE7E4] border-[#1B2D3C] text-[#1B2D3C] '
 : 'bg-white border-[#1B2D3C] text-[#1B2D3C] hover:bg-[#D6E2E9]/40'
 }`}
 >
 {category.label}
 </button>
 ))}
 </div>

 {/* Gallery Responsive Grid Layout */}
 <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
 <motion.div
 layout
 className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
 >
 <AnimatePresence mode="popLayout">
 {filteredItems.map((item) => (
 <motion.div
 layout
 key={item.id}
 id={`gallery-card-${item.id}`}
 initial={{ opacity: 0, scale: 0.92 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.92 }}
 transition={{ duration: 0.35 }}
 className="group relative h-[300px] rounded-lg overflow-hidden bg-stone-100 border border-[#1B2D3C]/20 hover: transition-all duration-300"
 >
 <img
 src={item.imageUrl}
 alt={item.title}
 loading="lazy"
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 font-sans font-medium text-xs text-[#1B2D3C] rounded-lg"
 referrerPolicy="no-referrer"
 />

 {/* Info Overlay */}
 <div className="absolute inset-0 bg-gradient-to-t from-[#1B2D3C]/80 via-[#1B2D3C]/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-white z-10">
 <span className="text-[9px] uppercase font-black tracking-widest text-[#D6E2E9] mb-1 flex items-center gap-1">
 <Tag size={9} />
 {item.category === 'creation' ? 'Masterpiece' : item.category === 'imprint' ? 'Baby Print' : item.category === 'party' ? 'Celebration' : 'Workspace'}
 </span>
 <h4 className="font-heading font-black text-lg leading-tight text-[#FFFFFF] mb-1">
 {item.title}
 </h4>
 <p className="text-[11px] text-stone-200 leading-normal font-semibold">
 {item.caption}
 </p>
 </div>

 {/* Idle Category tag icon wrapper */}
 <div className="absolute top-3.5 left-3.5 px-2.5 py-1 bg-[#FFFFFF] text-[#1B2D3C] font-bold text-[10px] uppercase tracking-wider border border-[#1B2D3C]/20 select-none pointer-events-none group-hover:opacity-0 transition-opacity rounded-lg">
 {item.category === 'creation' ? 'Art' : item.category === 'imprint' ? 'Keepsake' : item.category === 'party' ? 'Party' : 'Studio'}
 </div>
 </motion.div>
 ))}
 </AnimatePresence>
 </motion.div>
 </div>

 {/* Showcase Invitation */}
 <div className="max-w-4xl mx-auto px-4 text-center py-6">
 <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed font-semibold">
 Painting or capturing stamps with us soon? Follow our Instagram feed <strong className="text-[#1B2D3C]">@PitterPotterStudios</strong> and tag your custom clear glazed projects to get featured here!
 </p>
 </div>
 </div>
 );
}
