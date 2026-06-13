import { useState } from 'react';
import { POTTERY_ITEMS } from '../data';
import { PotteryItem, Page } from '../types';
import { Search, Palette, Filter, Compass, Plus, Trash2, Heart, Sparkles, ShoppingBag, BadgeAlert } from 'lucide-react';

interface PricingViewProps {
  setCurrentPage: (page: Page) => void;
  addItemToInquiry?: (item: PotteryItem) => void;
  initialPainters?: number;
}

export default function PricingView({ setCurrentPage, addItemToInquiry, initialPainters = 1 }: PricingViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'tableware' | 'decor' | 'kids' | 'seasonal'>('all');
  
  // Design Board state
  const [designBoard, setDesignBoard] = useState<{ item: PotteryItem; quantity: number; hasWritingService: boolean }[]>([]);
  const [painterCount, setPainterCount] = useState<number>(initialPainters);

  // Filter items
  const filteredItems = POTTERY_ITEMS.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Adding to design board
  const addToBoard = (item: PotteryItem) => {
    const existingIndex = designBoard.findIndex(b => b.item.id === item.id);
    if (existingIndex > -1) {
      const updated = [...designBoard];
      updated[existingIndex].quantity += 1;
      setDesignBoard(updated);
    } else {
      setDesignBoard([...designBoard, { item, quantity: 1, hasWritingService: false }]);
    }
  };

  const removeFromBoard = (idx: number) => {
    const updated = [...designBoard];
    updated.splice(idx, 1);
    setDesignBoard(updated);
  };

  const updateQuantity = (idx: number, qty: number) => {
    if (qty <= 0) {
      removeFromBoard(idx);
    } else {
      const updated = [...designBoard];
      updated[idx].quantity = qty;
      setDesignBoard(updated);
    }
  };

  const toggleWritingService = (idx: number) => {
    const updated = [...designBoard];
    updated[idx].hasWritingService = !updated[idx].hasWritingService;
    setDesignBoard(updated);
  };

  // Calculations
  const studioFeeCost = painterCount * 5.95;
  const potteryPiecesCost = designBoard.reduce((acc, current) => {
    return acc + (current.item.basePrice * current.quantity);
  }, 0);
  const writingServiceCost = designBoard.reduce((acc, current) => {
    return acc + (current.hasWritingService ? 10.00 * current.quantity : 0);
  }, 0);
  const grandTotal = studioFeeCost + potteryPiecesCost + writingServiceCost;

  const handleBookWithPlanner = () => {
    if (addItemToInquiry) {
      // Just take the first item as a preset for booking or construct a narrative block
      const notes = `Planned items: ${designBoard.map(b => `${b.quantity}x ${b.item.name} (${b.hasWritingService ? 'with' : 'no'} writing service)`).join(', ')}`;
      localStorage.setItem('pp_draft_notes', notes);
      localStorage.setItem('pp_draft_painters', painterCount.toString());
    }
    setCurrentPage('contact');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div id="pricing-view" className="space-y-12 pb-20 pt-6">
      {/* View Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center space-y-4 max-w-3xl">
        <span className="text-xs tracking-widest text-[#74919e] font-black uppercase block">Studio Menu</span>
        <h1 className="font-heading text-4xl md:text-5xl font-black italic text-[#1B2D3C] tracking-tight">Pottery & Pricing Catalog</h1>
        <p className="text-[#1B2D3C]/85 text-xs sm:text-sm font-medium leading-relaxed">
          At Pitter Potter, we have more than 150 different shapes to choose from. Discover a curated list of our regular biscuit stocks below, configure options, and plan your pottery budget.
        </p>
      </div>

      {/* Studio Fee Feature Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="bg-[#D9E2EC]/70 p-6 md:p-8 border-2 border-[#1B2D3C]  flex flex-col md:flex-row justify-between items-center gap-8 rounded-2xl">
          <div className="space-y-3 max-w-2xl text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-[#74919e] border-2 border-[#1B2D3C] text-[10px] font-bold uppercase tracking-widest ">
              <Sparkles size={12} className="text-[#74919e]" />
              The Studio Fee Structure
            </div>
            <h2 className="font-heading text-2xl font-black italic text-[#1B2D3C]">
              Studio Fee: <span className="text-[#74919e]">£5.95 per painter</span>
            </h2>
            <p className="text-[#1B2D3C]/85 text-xs leading-relaxed font-semibold">
              We charge a single studio fee per session. This covers your unlimited craft underglazes, custom fine brushes, stencils, decorative sponges, and most importantly—the hand clear glazing and safe overnight kiln-firing service. You pay for the pottery pieces you choose on top.
            </p>
          </div>
          <div className="px-4 sm:px-6 py-4 sm:py-5 rounded-none bg-white border-2 border-[#1B2D3C]  text-center min-w-[150px] sm:min-w-[190px]">
            <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">One Flat Fee</span>
            <span className="text-2xl sm:text-3xl font-black text-[#74919e] block font-heading my-1">£5.95</span>
            <span className="text-[10px] sm:text-[11px] text-[#1B2D3C] font-bold italic block">Per session per designer</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Catalog - Left */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Controls: Search & Category Filter tabs */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-center w-full">
            
            {/* Search Input */}
            <div className="relative w-full lg:max-w-xs shrink-0">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#1B2D3C]" />
              <input
                type="text"
                placeholder="Search mugs, plates, animals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs border-2 border-[#1B2D3C] bg-white rounded-none focus:outline-none focus:bg-[#D9E2EC]/20 transition-all text-[#1B2D3C] font-bold placeholder:text-stone-400"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-1.5 w-full justify-start lg:justify-end">
              {[
                { value: 'all', label: 'All Items' },
                { value: 'tableware', label: 'Tableware' },
                { value: 'decor', label: 'Home Decor' },
                { value: 'kids', label: 'Kids Favorites' },
                { value: 'seasonal', label: 'Seasonal' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setSelectedCategory(tab.value as any)}
                  className={`px-3.5 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-wider border-2 transition-all cursor-pointer ${
                    selectedCategory === tab.value
                      ? 'bg-[#74919e] border-[#1B2D3C] text-white '
                      : 'bg-white border-[#1B2D3C] text-[#1B2D3C] hover:bg-[#D9E2EC]/40'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

          </div>

          {/* Catalog Grid */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  id={`pottery-item-${item.id}`}
                  className="bg-white p-5 border-2 border-[#1B2D3C] flex justify-between items-start gap-4  hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all rounded-none"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-black text-[#1B2D3C] text-sm md:text-base leading-none">{item.name}</span>
                      {item.isPartyEligible && (
                        <span className="text-[9px] px-2 py-0.5 rounded-none bg-[#D9E2EC] text-[#74919e] border border-[#1B2D3C] font-black uppercase tracking-wider">
                          Party Favorite
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed font-semibold">{item.description}</p>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#74919e] bg-[#F0F4F8] border border-[#1B2D3C]/60 px-2.5 py-1 rounded-none">
                      Category: {item.category === 'kids' ? 'Kids' : item.category === 'decor' ? 'Home decor' : item.category === 'seasonal' ? 'Holiday' : 'Dinnerware'}
                    </span>
                  </div>
                  <div className="text-right shrink-0 flex flex-col justify-between h-full space-y-4">
                    <span className="block text-base font-black text-[#74919e] font-mono leading-none">{item.price}</span>
                    <button
                      id={`btn-add-to-board-${item.id}`}
                      onClick={() => addToBoard(item)}
                      className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-none border-2 border-[#1B2D3C] text-[#1B2D3C] hover:bg-[#74919e] hover:text-white transition-all flex items-center gap-1 bg-[#F0F4F8]   hover:translate-x-[2px] hover:translate-y-[2px] cursor-pointer"
                    >
                      <Plus size={12} className="stroke-[3]" />
                      Add to budget
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#F0F4F8] border-2 border-dashed border-[#1B2D3C] rounded-none">
              <BadgeAlert className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              <p className="text-[#1B2D3C] font-bold uppercase tracking-wider text-xs">No custom items match your search.</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                className="mt-2 text-xs text-[#74919e] underline hover:text-[#1B2D3C] font-bold cursor-pointer"
              >
                Reset catalog filters
              </button>
            </div>
          )}

        </div>

        {/* Dynamic Budget Calculator - Right sidebar */}
        <div className="lg:col-span-4 sticky top-28 bg-[#D9E2EC]/70 p-6 border-2 border-[#1B2D3C]  rounded-xl space-y-6">
          <div className="flex items-center gap-2.5 border-b-2 border-[#1B2D3C] pb-3">
            <ShoppingBag className="w-5 h-5 text-[#74919e]" />
            <div>
              <h3 className="font-heading text-lg font-black text-[#1B2D3C] leading-none">My Design Board</h3>
              <p className="text-[10px] text-[#1B2D3C]/80 font-bold uppercase tracking-wider">Drape customized details</p>
            </div>
          </div>

          {designBoard.length > 0 ? (
            <>
              {/* Painter inputs */}
              <div className="space-y-2.5">
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider">
                  Number of Painters ({painterCount})
                </label>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setPainterCount(Math.max(1, painterCount - 1))}
                    className="w-8 h-8 rounded-none bg-white border-2 border-[#1B2D3C] font-bold hover:bg-[#F0F4F8] text-stone-800 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-black text-[#1B2D3C]">{painterCount}</span>
                  <button
                    onClick={() => setPainterCount(Math.min(20, painterCount + 1))}
                    className="w-8 h-8 rounded-none bg-white border-2 border-[#1B2D3C] font-bold hover:bg-[#F0F4F8] text-stone-800 cursor-pointer"
                  >
                    +
                  </button>
                  <span className="text-[10px] text-stone-500 italic">× £5.95 fee</span>
                </div>
              </div>

              {/* Items List in Basket */}
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {designBoard.map((boardItem, idx) => (
                  <div key={idx} className="bg-white p-3 border-2 border-[#1B2D3C] text-xs space-y-2 rounded-none">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-[#1B2D3C]">{boardItem.item.name}</p>
                        <p className="text-stone-500 text-[10px] font-mono leading-none mt-0.5">Unit: {boardItem.item.price}</p>
                      </div>
                      <button
                        onClick={() => removeFromBoard(idx)}
                        className="text-stone-400 hover:text-red-500 hover:scale-110 transition-transform cursor-pointer"
                        title="Remove piece"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-stone-200">
                      {/* Quantity config */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(idx, boardItem.quantity - 1)}
                          className="w-5 h-5 rounded-none border border-[#1B2D3C] bg-[#F0F4F8] hover:bg-[#D9E2EC] text-center text-[11px] font-bold leading-none flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-bold text-[#1B2D3C] w-4 text-center">{boardItem.quantity}</span>
                        <button
                          onClick={() => updateQuantity(idx, boardItem.quantity + 1)}
                          className="w-5 h-5 rounded-none border border-[#1B2D3C] bg-[#F0F4F8] hover:bg-[#D9E2EC] text-center text-[11px] font-bold leading-none flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Custom lettering toggle */}
                      <button
                        onClick={() => toggleWritingService(idx)}
                        className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest border transition-all rounded-none cursor-pointer ${
                          boardItem.hasWritingService
                            ? 'bg-[#74919e] text-white border-[#1B2D3C] '
                            : 'bg-[#F0F4F8] text-stone-500 border-stone-300 hover:bg-[#D9E2EC]/45'
                        }`}
                        title="Writing service starting from £10.00"
                      >
                        {boardItem.hasWritingService ? '🖋️ Lettering' : '+ Add Lettering'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculation Summary details */}
              <div className="border-t-2 border-[#1B2D3C] pt-4 space-y-2.5 font-mono text-[#1B2D3C] font-semibold text-xs">
                <div className="flex justify-between">
                  <span>Painter Studio Fees:</span>
                  <span className="font-bold">£{studioFeeCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ceramic Objects Cost:</span>
                  <span className="font-bold">£{potteryPiecesCost.toFixed(2)}</span>
                </div>
                {writingServiceCost > 0 && (
                  <div className="flex justify-between">
                    <span>Writing Letterings:</span>
                    <span className="font-bold">£{writingServiceCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-2.5 border-t border-dashed border-[#1B2D3C]/30">
                  <span className="font-sans">Grand Total:</span>
                  <span className="text-[#74919e] font-black text-lg">£{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Book session button */}
              <button
                id="book-via-design-board"
                onClick={handleBookWithPlanner}
                className="w-full py-3.5 bg-[#74919e] text-white font-bold text-xs uppercase tracking-widest border-2 border-[#1B2D3C]  rounded-none hover:translate-x-[2px] hover:translate-y-[2px]  active:translate-x-0 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
              >
                Inquire Studio Slots with Plan
              </button>
            </>
          ) : (
            <div className="text-center py-12 space-y-3">
              <Compass className="w-10 h-10 text-[#74919e]/40 mx-auto" />
              <p className="text-xs text-[#1B2D3C] font-bold uppercase tracking-wider">Your design budget is currently empty.</p>
              <p className="text-[11px] text-stone-500 leading-relaxed px-4 font-semibold">
                Click "+ Add to budget" on any ceramic piece to start mapping your customized estimate.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
