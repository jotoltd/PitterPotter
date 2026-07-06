import { useState } from 'react';
import { FAQ_ITEMS } from '../data';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import EditableText from './EditableText';

import { Page } from '../types';

interface FAQsViewProps {
  adminMode?: boolean;
  setCurrentPage: (page: Page) => void;
}

export default function FAQsView({ adminMode = false, setCurrentPage }: FAQsViewProps) {
 const [expandedId, setExpandedId] = useState<string | null>('f1');

 const toggleExpand = (id: string) => {
 setExpandedId(expandedId === id ? null : id);
 };

 return (
 <div id="faqs-view" className="space-y-8 pb-20 pt-6 max-w-3xl mx-auto px-4">
 {/* Title Header */}
 <div className="text-center">
 <EditableText contentKey="faqs_title" page="faqs" defaultValue="FAQs" adminMode={adminMode} className="font-heading text-3xl font-black text-[#1B2D3C]" />
 </div>

 {/* Accordion list */}
 <div className="divide-y divide-[#1B2D3C]/10">
 {FAQ_ITEMS.map((faq) => {
 const isExpanded = expandedId === faq.id;
 return (
 <div key={faq.id} id={`faq-item-${faq.id}`}>
 <button
 onClick={() => toggleExpand(faq.id)}
 className="w-full py-4 flex justify-between items-center text-left focus:outline-none cursor-pointer"
 >
 <span className="text-[#1B2D3C] text-sm md:text-base leading-snug pr-4">
 <EditableText contentKey={`faq_${faq.id}_question`} page="faqs" defaultValue={faq.question} adminMode={adminMode} className="text-sm md:text-base text-[#1B2D3C] leading-snug" />
 </span>
 <div className="shrink-0 text-[#1B2D3C]">
 {isExpanded ? (
 <ChevronUp className="w-5 h-5" />
 ) : (
 <ChevronDown className="w-5 h-5" />
 )}
 </div>
 </button>

 <AnimatePresence initial={false}>
 {isExpanded && (
 <motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 transition={{ duration: 0.25, ease: 'easeInOut' }}
 className="overflow-hidden"
 >
 <div className="pb-4 text-xs md:text-sm text-[#1B2D3C]/80 leading-relaxed font-medium space-y-2">
 {faq.answer.split('\n\n').map((para, pIdx) => (
 <p key={pIdx}><EditableText contentKey={`faq_${faq.id}_answer_${pIdx}`} page="faqs" defaultValue={para} adminMode={adminMode} className="text-xs md:text-sm text-[#1B2D3C]/80 leading-relaxed" /></p>
 ))}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
 })}
 </div>

 {/* Help Callout */}
 <div className="bg-white border border-[#1B2D3C]/20 p-6 rounded-lg flex items-center justify-between gap-6 flex-col md:flex-row text-center md:text-left">
 <div className="space-y-1">
 <p className="font-bold text-[#1B2D3C] text-sm uppercase tracking-wider"><EditableText contentKey="help_callout_title" page="faqs" defaultValue="Still have questions?" adminMode={adminMode} className="text-sm uppercase tracking-wider text-[#1B2D3C]" /></p>
 <p className="text-xs text-stone-500 font-semibold"><EditableText contentKey="help_callout_text" page="faqs" defaultValue="Contact us if you have any more questions." adminMode={adminMode} className="text-xs text-stone-500" /></p>
 </div>
 <div className="flex gap-3">
 <button
 onClick={() => setCurrentPage('contact-info')}
 className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#DBE7E4] text-[#1B2D3C] text-sm uppercase tracking-widest hover:bg-[#D6E2E9] transition-all cursor-pointer rounded-lg whitespace-nowrap"
 >
 <EditableText contentKey="help_callout_button" page="faqs" defaultValue="Contact Us" adminMode={adminMode} className="text-xs uppercase tracking-wider text-white" />
 </button>
 </div>
 </div>
 </div>
 );
}
