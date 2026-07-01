import { useState } from 'react';
import { Menu, X, Phone, Calendar, Edit3 } from 'lucide-react';
import { Page, Staff } from '../types';
import { Images } from '../images';
import EditableText from './EditableText';
import EditableImage from './EditableImage';

interface NavbarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  currentStaff: Staff | null;
  adminMode: boolean;
  setAdminMode: (mode: boolean) => void;
}

export default function Navbar({ currentPage, setCurrentPage, currentStaff, adminMode, setAdminMode }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCallOptions, setShowCallOptions] = useState(false);

  const navItems: { label: string; value: Page; keyPrefix: string }[] = [
    { label: 'Home', value: 'home', keyPrefix: 'home' },
    { label: 'Baby Prints', value: 'baby-prints', keyPrefix: 'baby_prints' },
    { label: 'Parties & Events', value: 'parties', keyPrefix: 'parties' },
    { label: 'Prices', value: 'pricing', keyPrefix: 'pricing' },
    { label: 'Food & Drink', value: 'food-drink', keyPrefix: 'food_drink' },
    { label: 'Gift Cards', value: 'buy-gift-card', keyPrefix: 'gift_cards' },
    { label: 'FAQs', value: 'faqs', keyPrefix: 'faqs' },
    { label: 'Gallery', value: 'gallery', keyPrefix: 'gallery' },
    { label: 'Contact', value: 'contact-info', keyPrefix: 'contact' },
  ];

  const handleNavClick = (page: Page) => {
    setCurrentPage(page);
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isActive = (page: Page) => currentPage === page;

  return (
    <>
      <nav id="pp-navbar" className="sticky top-0 z-50 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#1B2D3C]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-2.5 text-left group transition-transform focus:outline-none"
            >
              <EditableImage
                contentKey="navbar_logo"
                page="navbar"
                defaultSrc={Images.logo}
                alt="Pitter Potter Logo"
                className="h-10 w-auto object-contain rounded-lg"
                adminMode={adminMode}
              />
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center">
              {navItems.map((item) => (
                <button
                  key={item.value}
                  id={`nav-link-${item.value}`}
                  onClick={() => handleNavClick(item.value)}
                  className={`group px-3.5 py-2 text-[13px] font-normal uppercase tracking-widest transition-all relative ${
                    isActive(item.value)
                      ? 'text-[#1B2D3C]'
                      : 'text-[#1B2D3C] hover:text-[#1B2D3C]'
                  }`}
                >
                  <EditableText contentKey={`nav_${item.keyPrefix}_label`} page="navbar" defaultValue={item.label} adminMode={adminMode} className="text-[13px] font-normal uppercase tracking-widest" />
                  <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-[#1B2D3C] transition-all duration-300 ${isActive(item.value) ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </button>
              ))}
              <button
                id="cta-book-session"
                onClick={() => handleNavClick('book')}
                className="ml-4 px-5 py-2.5 bg-[#DBE7E4] text-[#1B2D3C] font-normal text-[13px] uppercase tracking-widest border border-[#1B2D3C] hover:bg-[#D6E2E9] transition-all cursor-pointer"
              >
                <EditableText contentKey="nav_book_button" page="navbar" defaultValue="Booking" adminMode={adminMode} className="text-[13px] font-normal uppercase tracking-widest" />
              </button>
              {currentStaff && (
                <button
                  onClick={() => setAdminMode(!adminMode)}
                  className={`ml-3 px-3 py-2.5 text-[11px] font-normal uppercase tracking-widest border transition-all cursor-pointer flex items-center gap-1.5 ${
                    adminMode
                      ? 'bg-[#1B2D3C] text-white border-[#1B2D3C]'
                      : 'bg-white text-[#1B2D3C] border-[#1B2D3C]/20 hover:border-[#1B2D3C]'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" /> {adminMode ? 'Editing On' : 'Edit Mode'}
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                id="mobile-menu-toggle"
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isOpen}
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 border border-[#1B2D3C] text-[#1B2D3C] hover:bg-[#D6E2E9] transition-colors focus:outline-none"
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isOpen && (
          <div className="md:hidden bg-[#FFFFFF] border-b border-[#1B2D3C]/10">
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.value}
                  id={`mobile-nav-link-${item.value}`}
                  onClick={() => handleNavClick(item.value)}
                  className={`w-full text-left px-5 py-4 text-lg font-normal uppercase tracking-widest transition-all ${
                    isActive(item.value)
                      ? 'bg-[#D6E2E9] text-[#1B2D3C] border border-[#1B2D3C] pl-6'
                      : 'text-[#1B2D3C] hover:bg-[#D6E2E9]/20 pl-5'
                  }`}
                >
                  <EditableText contentKey={`mobile_nav_${item.keyPrefix}_label`} page="navbar" defaultValue={item.label} adminMode={adminMode} className="text-lg font-normal uppercase tracking-widest" />
                </button>
              ))}
              <div className="pt-2">
                <button
                  id="mobile-cta-book"
                  onClick={() => handleNavClick('book')}
                  className="w-full py-4 bg-[#DBE7E4] text-[#1B2D3C] font-normal text-lg uppercase tracking-widest text-center border border-[#1B2D3C] transition-all cursor-pointer"
                >
                  <EditableText contentKey="mobile_nav_book_button" page="navbar" defaultValue="Book Studio" adminMode={adminMode} className="text-lg font-normal uppercase tracking-widest" />
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Bottom Sticky Toolbar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#1B2D3C]/10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around px-4 pb-safe">
          <button
            onClick={() => setShowCallOptions(true)}
            className="flex flex-col items-center justify-center py-3 px-4 flex-1 min-w-0 text-[#1B2D3C] transition-all cursor-pointer active:bg-[#FFFFFF]"
          >
            <Phone className="w-5 h-5 mb-1" />
            <span className="text-[9px] font-normal uppercase tracking-wider truncate w-full text-center"><EditableText contentKey="mobile_call_us" page="navbar" defaultValue="Call us" adminMode={adminMode} className="text-[9px] font-normal uppercase tracking-wider" /></span>
          </button>
          <div className="w-px h-8 bg-[#1B2D3C]/10" />
          <button
            onClick={() => handleNavClick('book')}
            className="flex flex-col items-center justify-center py-3 px-4 flex-1 min-w-0 bg-[#DBE7E4] text-[#1B2D3C] transition-all cursor-pointer active:bg-[#D6E2E9]"
          >
            <Calendar className="w-5 h-5 mb-1" />
            <span className="text-[9px] font-normal uppercase tracking-wider truncate w-full text-center"><EditableText contentKey="mobile_book" page="navbar" defaultValue="Book" adminMode={adminMode} className="text-[9px] font-normal uppercase tracking-wider" /></span>
          </button>
        </div>
      </div>
      {/* Call Options Modal */}
      {showCallOptions && (
        <div className="md:hidden fixed inset-0 z-[60] bg-[#1B2D3C]/60 flex items-end justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-lg overflow-hidden shadow-lg animate-in slide-in-from-bottom-10">
            <div className="p-4 border-b border-[#1B2D3C]/10 flex justify-between items-center">
              <p className="font-heading text-lg font-normal text-[#1B2D3C]"><EditableText contentKey="call_modal_title" page="navbar" defaultValue="Call us" adminMode={adminMode} className="font-heading text-lg text-[#1B2D3C]" /></p>
              <button
                onClick={() => setShowCallOptions(false)}
                className="p-2 hover:bg-[#FFFFFF] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-[#1B2D3C]" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <a
                href="tel:02087881635"
                onClick={() => setShowCallOptions(false)}
                className="block w-full py-3 px-4 bg-[#FFFFFF] text-[#1B2D3C] font-normal text-sm border border-[#1B2D3C]/20 hover:bg-[#D6E2E9] transition-all"
              >
                <span className="block text-[10px] text-[#1B2D3C] uppercase tracking-wider mb-1"><EditableText contentKey="call_modal_putney" page="navbar" defaultValue="Putney Studio" adminMode={adminMode} className="text-[10px] uppercase tracking-wider text-[#1B2D3C]" /></span>
                <EditableText contentKey="call_modal_putney_phone" page="navbar" defaultValue="020 8788 1635" adminMode={adminMode} className="text-sm text-[#1B2D3C]" />
              </a>
              <a
                href="tel:02037704499"
                onClick={() => setShowCallOptions(false)}
                className="block w-full py-3 px-4 bg-[#FFFFFF] text-[#1B2D3C] font-normal text-sm border border-[#1B2D3C]/20 hover:bg-[#D6E2E9] transition-all"
              >
                <span className="block text-[10px] text-[#1B2D3C] uppercase tracking-wider mb-1"><EditableText contentKey="call_modal_wimbledon" page="navbar" defaultValue="Wimbledon Studio" adminMode={adminMode} className="text-[10px] uppercase tracking-wider text-[#1B2D3C]" /></span>
                <EditableText contentKey="call_modal_wimbledon_phone" page="navbar" defaultValue="020 3770 4499" adminMode={adminMode} className="text-sm text-[#1B2D3C]" />
              </a>
              <button
                onClick={() => setShowCallOptions(false)}
                className="w-full py-3 text-[#1B2D3C] font-normal text-xs uppercase tracking-wider hover:bg-[#FFFFFF] transition-all cursor-pointer"
              >
                <EditableText contentKey="call_modal_cancel" page="navbar" defaultValue="Cancel" adminMode={adminMode} className="text-xs uppercase tracking-wider text-[#1B2D3C]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
