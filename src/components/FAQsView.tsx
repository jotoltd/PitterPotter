import { useState } from 'react';
import { FAQ_ITEMS } from '../data';
import { HelpCircle, Search, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function FAQsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'fees' | 'bookings' | 'fittings' | 'creativity' | 'policies'>('all');
  const [expandedId, setExpandedId] = useState<string | null>('f1');

  // Filter FAQs
  const filteredFAQs = FAQ_ITEMS.filter((faq) => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div id="faqs-view" className="space-y-12 pb-20 pt-6 max-w-4xl mx-auto px-4">
      {/* Title Header */}
      <div className="text-center space-y-4">
        <span className="text-xs tracking-widest text-[#74919e] font-black uppercase block">Studio Guidelines</span>
        <h1 className="font-heading text-4xl font-black italic text-[#1B2D3C] tracking-tight">Frequently Asked Questions</h1>
        <p className="text-[#1B2D3C]/85 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl mx-auto">
          Got questions on how the clay glazed firing kiln cycle works, our policies on child-safe coloring tools, or booking weekend session durations? Browse our helpful answers below.
        </p>
      </div>

      {/* Interactive Controls */}
      <div className="space-y-4">
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-[#1B2D3C]" />
          <input
            type="text"
            placeholder="Search our studio FAQs (e.g., drying times, children safety, custom lettering)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 leading-tight text-xs border-2 border-[#1B2D3C] bg-white rounded-none focus:outline-none focus:bg-[#D9E2EC]/20 transition-all text-[#1B2D3C] font-bold placeholder:text-stone-400"
          />
        </div>

        {/* Categories Tab selectors */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {[
            { value: 'all', label: 'All FAQs' },
            { value: 'fees', label: 'Studio Fees' },
            { value: 'bookings', label: 'Table Bookings' },
            { value: 'fittings', label: 'Firing & Collection' },
            { value: 'creativity', label: 'Special Prints' },
            { value: 'policies', label: 'Safety & Policies' }
          ].map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                setSelectedCategory(cat.value as any);
                setExpandedId(null); // Reset open states
              }}
              className={`px-3.5 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-wider border-2 transition-all cursor-pointer ${
                selectedCategory === cat.value
                  ? 'bg-[#74919e] border-[#1B2D3C] text-white '
                  : 'bg-white border-[#1B2D3C] text-[#1B2D3C] hover:bg-[#D9E2EC]/40'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Accordion list */}
      <div className="space-y-4 bg-white p-4 border-2 border-[#1B2D3C]  rounded-none">
        {filteredFAQs.length > 0 ? (
          filteredFAQs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <div
                key={faq.id}
                id={`faq-item-${faq.id}`}
                className={`rounded-none border-2 transition-all duration-300 ${
                  isExpanded
                    ? 'border-[#1B2D3C] bg-[#D9E2EC]/45'
                    : 'border-[#1B2D3C]/10 bg-[#F0F4F8] hover:bg-[#F0F4F8]/80'
                }`}
              >
                {/* Header Button */}
                <button
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full px-5 py-4.5 flex justify-between items-center text-left focus:outline-none rounded-none"
                >
                  <div className="flex gap-3.5 items-start pr-4">
                    <HelpCircle className={`w-5 h-5 shrink-0 mt-0.5 ${isExpanded ? 'text-[#74919e]' : 'text-stone-400'}`} />
                    <span className="font-heading font-black text-[#1B2D3C] text-sm md:text-base leading-snug">
                      {faq.question}
                    </span>
                  </div>
                  <div className="shrink-0 text-[#74919e]">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 stroke-[2.5]" />
                    )}
                  </div>
                </button>

                {/* Expanding body content */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-[#1B2D3C] leading-relaxed border-t-2 border-dashed border-[#1B2D3C]/35 font-medium space-y-2">
                        {faq.answer.split('\n\n').map((para, pIdx) => (
                          <p key={pIdx}>{para}</p>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-[#1B2D3C]/70 font-semibold text-xs">
            No matching questions or answers found. Try a different keyword query!
          </div>
        )}
      </div>

      {/* Help Callout */}
      <div className="bg-white border-2 border-[#1B2D3C]  p-6 rounded-none flex items-center justify-between gap-6 flex-col md:flex-row text-center md:text-left">
        <div className="space-y-1">
          <p className="font-bold text-[#1B2D3C] text-sm uppercase tracking-wider">Still have questions?</p>
          <p className="text-xs text-stone-500 font-semibold">Contact our studio host supervisors directly at both Putney or Wimbledon branch desks.</p>
        </div>
        <div className="flex gap-3">
          <a
            href="mailto:info@pitterpotter.co.uk"
            className="px-4 py-2 bg-[#F0F4F8] text-[#1B2D3C] border-2 border-[#1B2D3C] text-xs font-bold uppercase tracking-wider  hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded-none whitespace-nowrap"
          >
            Email Support
          </a>
        </div>
      </div>
    </div>
  );
}
