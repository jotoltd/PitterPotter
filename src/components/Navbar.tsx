import { useState } from 'react';
import { Palette, Menu, X, Phone, MapPin } from 'lucide-react';
import { Page } from '../types';
import { Images } from '../images';

interface NavbarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

export default function Navbar({ currentPage, setCurrentPage }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems: { label: string; value: Page }[] = [
    { label: 'Home', value: 'home' },
    { label: 'Parties', value: 'parties' },
    { label: 'Price List', value: 'pricing' },
    { label: 'Gallery', value: 'gallery' },
    { label: 'FAQs', value: 'faqs' },
    { label: 'Contact', value: 'contact' },
  ];

  const handleNavClick = (page: Page) => {
    setCurrentPage(page);
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav id="pp-navbar" className="sticky top-0 z-50 bg-[#F0F4F8]/95 backdrop-blur-md border-b-2 border-[#1B2D3C]">
      {/* Quick top band for contact details */}
      <div className="hidden sm:block bg-[#74919e] text-[#F0F4F8] py-1.5 text-xs font-semibold tracking-wider border-b border-[#1B2D3C]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center">
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5">
              <MapPin size={13} />
              Putney & Wimbledon Studios
            </span>
            <span className="flex items-center gap-1.5">
              <Phone size={13} />
              Putney: 020 87881635 | Wimbledon: 020 37704499
            </span>
          </div>
          <div className="flex items-center gap-1 text-[#D9E2EC]">
            <span>Creative Paint Your Own Pottery Studio</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 text-left group transition-transform focus:outline-none"
          >
            <img
              src={Images.logo}
              alt="Pitter Potter Logo"
              className="h-12 w-auto object-contain"
            />
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = currentPage === item.value;
              return (
                <button
                  key={item.value}
                  id={`nav-link-${item.value}`}
                  onClick={() => handleNavClick(item.value)}
                  className={`group px-3.5 py-2 text-[11px] font-bold uppercase tracking-widest transition-all relative ${
                    isActive
                      ? 'text-[#74919e] '
                      : 'text-[#1B2D3C] hover:text-[#74919e]'
                  }`}
                >
                  {item.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-[#74919e] transition-all duration-300 w-0 group-hover:w-full"></span>
                </button>
              );
            })}
            <button
              id="cta-book-session"
              onClick={() => handleNavClick('contact')}
              className="ml-4 px-5 py-2.5 bg-[#74919e] text-white font-bold text-[11px] uppercase tracking-widest border-2 border-[#1B2D3C]  hover:translate-x-[-1px] hover:translate-y-[-1px]  active:translate-x-0 active:translate-y-0 transition-all"
            >
              Booking
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              id="mobile-menu-toggle"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 border-2 border-[#1B2D3C] text-[#1B2D3C] hover:bg-[#D9E2EC] transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Panel */}
      {isOpen && (
        <div id="mobile-nav-panel" className="md:hidden border-b-2 border-[#1B2D3C] bg-[#F0F4F8] p-4 absolute top-20 left-0 w-full transition-transform duration-300 origin-top">
          <div className="space-y-2">
            {navItems.map((item) => {
              const isActive = currentPage === item.value;
              return (
                <button
                  key={item.value}
                  id={`mobile-nav-link-${item.value}`}
                  onClick={() => handleNavClick(item.value)}
                  className={`w-full text-left px-5 py-4 text-lg font-black uppercase tracking-widest transition-all ${
                    isActive
                      ? 'bg-[#D9E2EC] text-[#74919e] border-2 border-[#1B2D3C] pl-6'
                      : 'text-[#1B2D3C] hover:bg-[#D9E2EC]/20 pl-5'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <div className="pt-2">
              <button
                id="mobile-cta-book"
                onClick={() => handleNavClick('contact')}
                className="w-full py-4 bg-[#74919e] text-white font-black text-lg uppercase tracking-widest text-center border-2 border-[#1B2D3C]  transition-all"
              >
                Book Studio
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
