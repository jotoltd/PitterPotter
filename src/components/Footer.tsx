import { Palette, MapPin, Mail, Facebook, Instagram } from 'lucide-react';
import { Page } from '../types';

interface FooterProps {
  setCurrentPage: (page: Page) => void;
}

export default function Footer({ setCurrentPage }: FooterProps) {
  const handlePageLink = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="pp-footer" className="bg-[#1B2D3C] text-[#F0F4F8] py-12 border-t-2 border-[#1B2D3C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Studio Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-[#74919e]" />
              <span className="font-heading text-lg font-bold italic">Pitter Potter</span>
            </div>
            <p className="text-sm text-white/60">
              Paint Your Own Pottery Studios
            </p>
          </div>

          {/* Addresses */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/80">Locations</h4>
            <div className="space-y-2 text-sm text-white/60">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Putney</p>
                  <p className="text-xs">234 Upper Richmond Road<br />SW15 6TG</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Wimbledon</p>
                  <p className="text-xs">52 Wimbledon Hill Road<br />SW19 7PA</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/80">Contact</h4>
            <div className="space-y-2 text-sm text-white/60">
              <p>Putney: 020 87881635</p>
              <p>Wimbledon: 020 37704499</p>
              <a href="mailto:info@pitterpotter.co.uk" className="hover:text-white transition-colors">
                info@pitterpotter.co.uk
              </a>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/80">Follow Us</h4>
            <div className="flex gap-4">
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-white/10 pt-6 text-center text-xs text-white/40 space-y-1">
          <p>© 2026 Pitter Potter. All rights reserved.</p>
          <p>PITTER POTTER LIMITED | Company number 10637179</p>
          <button
            onClick={() => setCurrentPage('admin')}
            className="text-white/30 hover:text-white/60 transition-colors mt-2"
          >
            Admin
          </button>
        </div>
      </div>
    </footer>
  );
}
