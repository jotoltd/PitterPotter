import { MapPin, Phone, Facebook, Instagram } from 'lucide-react';
import { Page } from '../types';
import { Images } from '../images';
import EditableText from './EditableText';
import EditableImage from './EditableImage';

interface FooterProps {
  setCurrentPage: (page: Page) => void;
  adminMode?: boolean;
}

export default function Footer({ setCurrentPage, adminMode = false }: FooterProps) {
  const handlePageLink = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="pp-footer" className="bg-[#FFFFFF] text-[#1B2D3C] py-12 border-t border-[#1B2D3C]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Studio Brand */}
          <div className="space-y-3">
            <EditableImage
              contentKey="footer_logo"
              page="footer"
              defaultSrc={Images.logo}
              alt="Pitter Potter Logo"
              className="h-12 w-auto object-contain rounded-lg"
              adminMode={adminMode}
            />
            <p className="text-sm text-[#1B2D3C]/60">
              <EditableText contentKey="footer_tagline" page="footer" defaultValue="Paint Your Own Pottery Studios" adminMode={adminMode} className="text-sm text-[#1B2D3C]/60" />
            </p>
          </div>

          {/* Locations & Phone Combined */}
          <div className="space-y-3 md:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[#1B2D3C]/60">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[#1B2D3C]" />
                <div>
                  <p className="font-semibold text-[#1B2D3C]"><EditableText contentKey="footer_putney_name" page="footer" defaultValue="Putney" adminMode={adminMode} className="text-sm text-[#1B2D3C]" /></p>
                  <p className="text-xs"><EditableText contentKey="footer_putney_address" page="footer" defaultValue="234 Upper Richmond Road, London, SW15 6TG" adminMode={adminMode} className="text-xs text-[#1B2D3C]/60" /></p>
                  <p className="text-xs font-semibold mt-1 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 shrink-0 text-[#1B2D3C]" />
                    <a href="tel:02087881635" className="hover:text-[#1B2D3C] transition-colors"><EditableText contentKey="footer_putney_phone" page="footer" defaultValue="020 8788 1635" adminMode={adminMode} className="text-xs text-[#1B2D3C]/60" /></a>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[#1B2D3C]" />
                <div>
                  <p className="font-semibold text-[#1B2D3C]"><EditableText contentKey="footer_wimbledon_name" page="footer" defaultValue="Wimbledon" adminMode={adminMode} className="text-sm text-[#1B2D3C]" /></p>
                  <p className="text-xs"><EditableText contentKey="footer_wimbledon_address" page="footer" defaultValue="52 Wimbledon Hill Road, London, SW19 7PA" adminMode={adminMode} className="text-xs text-[#1B2D3C]/60" /></p>
                  <p className="text-xs font-semibold mt-1 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 shrink-0 text-[#1B2D3C]" />
                    <a href="tel:02037704499" className="hover:text-[#1B2D3C] transition-colors"><EditableText contentKey="footer_wimbledon_phone" page="footer" defaultValue="020 3770 4499" adminMode={adminMode} className="text-xs text-[#1B2D3C]/60" /></a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media & Email */}
          <div className="space-y-3">
            <div className="space-y-2 text-sm text-[#1B2D3C]/60">
              <a href="mailto:info@pitterpotter.co.uk" className="hover:text-[#1B2D3C] transition-colors block">
                <EditableText contentKey="footer_email" page="footer" defaultValue="info@pitterpotter.co.uk" adminMode={adminMode} className="text-sm text-[#1B2D3C]/60" />
              </a>
              <div className="flex gap-4 pt-1">
                <a href="#" className="text-[#1B2D3C]/60 hover:text-[#1B2D3C] transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-[#1B2D3C]/60 hover:text-[#1B2D3C] transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="text-[#1B2D3C]/60 hover:text-[#1B2D3C] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-[#1B2D3C]/10 pt-6 text-center text-xs text-[#1B2D3C]/40 space-y-1">
          <p><EditableText contentKey="footer_copyright" page="footer" defaultValue="© 2026 Pitter Potter. All rights reserved." adminMode={adminMode} className="text-xs text-[#1B2D3C]/40" /></p>
          <p><EditableText contentKey="footer_company" page="footer" defaultValue="PITTER POTTER LIMITED | Company number 10637179" adminMode={adminMode} className="text-xs text-[#1B2D3C]/40" /></p>
          <button
            onClick={() => setCurrentPage('admin')}
            className="text-[#1B2D3C]/30 hover:text-[#1B2D3C]/60 transition-colors mt-2"
          >
            <EditableText contentKey="footer_admin" page="footer" defaultValue="Admin" adminMode={adminMode} className="text-xs text-[#1B2D3C]/40" />
          </button>
        </div>
      </div>
    </footer>
  );
}
