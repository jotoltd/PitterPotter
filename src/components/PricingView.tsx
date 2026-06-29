import { useState } from 'react';
import { POTTERY_ITEMS } from '../data';
import { Page, PotteryItem } from '../types';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import EditableText from './EditableText';

interface PricingViewProps {
  setCurrentPage?: (page: Page) => void;
  initialPainters?: number;
  adminMode?: boolean;
}

export default function PricingView({ adminMode = false }: PricingViewProps) {
  const [selectedItem, setSelectedItem] = useState<PotteryItem | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center max-w-3xl">
        <div className="mb-2">
          <EditableText key="pricing_title" page="pricing" defaultValue="Prices" adminMode={adminMode} className="font-heading text-4xl md:text-5xl font-black text-[#1B2D3C] tracking-tight" />
        </div>
        <div className="mt-6">
          <EditableText key="pricing_subtitle" page="pricing" defaultValue="Click any item to see an image and full details." adminMode={adminMode} className="text-[#1B2D3C]/85 text-xs sm:text-sm font-medium leading-relaxed" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 space-y-6">
        {/* List */}
        <div className="bg-white border border-[#1B2D3C]/20 overflow-hidden">
          <div className="divide-y divide-[#1B2D3C]/10">
            {POTTERY_ITEMS.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item);
                    setSelectedImageIndex(0);
                  }}
                  className={`w-full text-left px-6 py-5 hover:bg-[#D6E2E9]/40 transition-all flex justify-between items-center gap-6 cursor-pointer ${idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}`}
                >
                  <p className="font-bold text-[#1B2D3C] text-base md:text-lg">{item.name}</p>
                  <span className="text-base md:text-lg font-black text-[#1B2D3C] shrink-0">{item.price}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Item Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-[#1B2D3C]/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#1B2D3C]/20 shadow-lg">
            <div className="relative aspect-[4/3] bg-[#FFFFFF]">
              {selectedItem.imageUrls && selectedItem.imageUrls.length > 0 && (
                <img
                  src={selectedItem.imageUrls[selectedImageIndex]}
                  alt={selectedItem.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              )}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white text-[#1B2D3C] transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              {selectedItem.imageUrls && selectedItem.imageUrls.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex((i) => (i === 0 ? selectedItem.imageUrls!.length - 1 : i - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white text-[#1B2D3C] transition-all cursor-pointer rounded-full"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex((i) => (i === selectedItem.imageUrls!.length - 1 ? 0 : i + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white text-[#1B2D3C] transition-all cursor-pointer rounded-full"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            {selectedItem.imageUrls && selectedItem.imageUrls.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {selectedItem.imageUrls.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`shrink-0 w-16 h-16 overflow-hidden border-2 rounded-lg cursor-pointer ${
                      idx === selectedImageIndex ? 'border-[#1B2D3C]' : 'border-transparent'
                    }`}
                  >
                    <img src={url} alt={`${selectedItem.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
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
