import { ArrowRight, Wine } from 'lucide-react';
import { Page } from '../types';

interface SipAndPaintViewProps {
  setCurrentPage: (page: Page) => void;
  adminMode?: boolean;
}

export default function SipAndPaintView({ setCurrentPage }: SipAndPaintViewProps) {
  return (
    <div className="pb-20 pt-6">
      <section className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 text-center space-y-8 py-20">
        <Wine className="w-14 h-14 text-[#1B2D3C] mx-auto" />
        <h1 className="font-heading text-4xl md:text-5xl font-black text-[#1B2D3C] tracking-tight">
          Sip & Paint
        </h1>
        <p className="text-lg text-[#1B2D3C]/60 font-semibold">
          More info coming soon
        </p>
        <p className="text-sm text-[#1B2D3C]/50 leading-relaxed max-w-md mx-auto">
          Paint pottery with a glass in hand — the perfect creative night out. Available at our Wimbledon studio.
        </p>
        <button
          onClick={() => setCurrentPage('book')}
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#DBE7E4] text-[#1B2D3C] text-xs font-black uppercase tracking-widest hover:bg-[#D6E2E9] transition-colors rounded-xl cursor-pointer"
        >
          Book a Session <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
}
