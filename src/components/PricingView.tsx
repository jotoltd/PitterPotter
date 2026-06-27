import { useState } from 'react';
import { POTTERY_ITEMS } from '../data';
import { Page, PotteryItem } from '../types';
import { Search, X } from 'lucide-react';
import EditableText from './EditableText';

interface PricingViewProps {
  setCurrentPage?: (page: Page) => void;
  initialPainters?: number;
  adminMode?: boolean;
}

export default function PricingView({ adminMode = false }: PricingViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'tableware' | 'decor' | 'kids' | 'seasonal'>('all');
  const [selectedItem, setSelectedItem] = useState<PotteryItem | null>(null);

  const filteredItems = POTTERY_ITEMS.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryLabel = (category: string) => {
    switch (category) {
      case 'tableware': return 'Tableware';
      case 'decor': return 'Home Decor';
      case 'kids': return 'Kids';
      case 'seasonal': return 'Seasonal';
      default: return category;
    }
  };

  return (
    <div id="pricing-view" className="space-y-12 pb-20 pt-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center space-y-4 max-w-3xl">
        <EditableText key="pricing_tagline" page="pricing" defaultValue="Studio Menu" adminMode={adminMode} className="text-xs tracking-widest text-[#1B2D3C] font-black uppercase block" />
        <EditableText key="pricing_title" page="pricing" defaultValue="Prices" adminMode={adminMode} className="font-heading text-4xl md:text-5xl font-black text-[#1B2D3C] tracking-tight" />
        <EditableText key="pricing_subtitle" page="pricing" defaultValue="Click any item to see an image and full details." adminMode={adminMode} className="text-[#1B2D3C]/85 text-xs sm:text-sm font-medium leading-relaxed" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 space-y-6">
        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="relative w-full lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1B2D3C]" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs border border-[#1B2D3C]/20 bg-white focus:outline-none focus:bg-[#D6E2E9]/20 text-[#1B2D3C] font-bold placeholder:text-stone-400"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 justify-start lg:justify-end">
            {[
              { value: 'all', label: 'All' },
              { value: 'tableware', label: 'Tableware' },
              { value: 'decor', label: 'Decor' },
              { value: 'kids', label: 'Kids' },
              { value: 'seasonal', label: 'Seasonal' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedCategory(tab.value as any)}
                className={`px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  selectedCategory === tab.value
                    ? 'bg-[#DBE7E4] border-[#DBE7E4] text-[#1B2D3C]'
                    : 'bg-white border-[#1B2D3C]/20 text-[#1B2D3C] hover:border-[#DBE7E4]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="bg-white border border-[#1B2D3C]/20 overflow-hidden">
          {filteredItems.length > 0 ? (
            <div className="divide-y divide-[#1B2D3C]/10">
              {filteredItems.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`w-full text-left px-6 py-5 hover:bg-[#D6E2E9]/40 transition-all flex justify-between items-center gap-6 cursor-pointer ${idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}`}
                >
                  <p className="font-bold text-[#1B2D3C] text-base md:text-lg">{item.name}</p>
                  <span className="text-base md:text-lg font-black text-[#1B2D3C] shrink-0">{item.price}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#1B2D3C] font-bold uppercase tracking-wider text-xs">No items match your search.</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                className="mt-2 text-xs text-[#1B2D3C] underline hover:text-[#1B2D3C] font-bold cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Item Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-[#1B2D3C]/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#1B2D3C]/20 shadow-lg">
            <div className="relative aspect-[4/3] bg-[#FFFFFF]">
              <img
                src={selectedItem.imageUrl}
                alt={selectedItem.name}
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white text-[#1B2D3C] transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C] mb-1">{categoryLabel(selectedItem.category)}</p>
                  <h2 className="font-heading text-2xl font-black text-[#1B2D3C]">{selectedItem.name}</h2>
                </div>
                <span className="text-xl font-black text-[#1B2D3C] shrink-0">{selectedItem.price}</span>
              </div>
              <p className="text-sm text-[#1B2D3C]/80 leading-relaxed font-medium">{selectedItem.description}</p>
              {selectedItem.isPartyEligible && (
                <span className="inline-block px-2.5 py-1 bg-[#D6E2E9] text-[#1B2D3C] text-[10px] font-black uppercase tracking-widest">
                  Party Favorite
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
