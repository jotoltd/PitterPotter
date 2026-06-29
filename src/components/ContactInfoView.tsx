import { Mail } from 'lucide-react';
import { Page } from '../types';

interface ContactInfoViewProps {
  setCurrentPage: (page: Page) => void;
}

export default function ContactInfoView({ setCurrentPage }: ContactInfoViewProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 pb-20 pt-6 space-y-8">
      <h1 className="font-heading text-4xl font-black text-[#1B2D3C]">Contact Us</h1>

      <div className="flex items-center gap-3 text-sm text-[#1B2D3C]">
        <Mail className="w-4 h-4 shrink-0 text-[#1B2D3C]" />
        <a href="mailto:info@pitterpotter.co.uk" className="hover:opacity-70 transition-opacity">
          info@pitterpotter.co.uk
        </a>
      </div>

      <div className="pt-2">
        <button
          onClick={() => setCurrentPage('book')}
          className="px-7 py-3.5 bg-[#1B2D3C] text-white font-bold text-sm tracking-wide hover:bg-[#486581] transition-all cursor-pointer rounded-lg"
        >
          Book a Session
        </button>
      </div>
    </div>
  );
}
