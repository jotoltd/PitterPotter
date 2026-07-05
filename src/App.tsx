/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomeView from './components/HomeView';
import BabyPrintsView from './components/BabyPrintsView';
import PartiesView from './components/PartiesView';
import PricingView from './components/PricingView';
import FAQsView from './components/FAQsView';
import GalleryView from './components/GalleryView';
import ContactView from './components/ContactView';
import ContactInfoView from './components/ContactInfoView';
import BookView from './components/BookView';
import AdminLoginView from './components/AdminLoginView';
import AdminDashboardView from './components/AdminDashboardView';
import PutneyView from './components/PutneyView';
import WimbledonView from './components/WimbledonView';
import GiftCardView from './components/GiftCardView';
import GiftCardPurchaseView from './components/GiftCardPurchaseView';
import GiftCardSuccessView from './components/GiftCardSuccessView';
import NotFoundView from './components/NotFoundView';
import GiftCardBalanceView from './components/GiftCardBalanceView';
import PartyBookingView from './components/PartyBookingView';
import FoodDrinkView from './components/FoodDrinkView';
import { ToastProvider } from './components/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import { Page, Staff } from './types';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
 const [currentPage, setCurrentPage] = useState<Page>('home');
 const [paintersCountPreset, setPaintersCountPreset] = useState<number>(1);
 const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
 const [showSplash, setShowSplash] = useState(true);
 const [adminMode, setAdminMode] = useState(false);

 const isAdminLoggedIn = !!currentStaff;

 useEffect(() => {
    const saved = localStorage.getItem('pp_current_staff');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.role) {
          const expires = parsed.sessionExpiresAt ? new Date(parsed.sessionExpiresAt) : null;
          if (expires && expires < new Date()) {
            localStorage.removeItem('pp_current_staff');
          } else {
            setCurrentStaff(parsed as Staff);
          }
        }
      } catch (err) {
        console.error('Failed to load staff session:', err);
      }
    }

    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page') as Page | null;
    const validPages: Page[] = ['home', 'baby-prints', 'parties', 'pricing', 'faqs', 'gallery', 'contact', 'contact-info', 'book', 'gift-cards', 'buy-gift-card', 'gift-card-success', 'gift-card-balance', 'putney', 'wimbledon', 'admin'];
    if (pageParam && validPages.includes(pageParam)) {
      setCurrentPage(pageParam);
    }

    const handlePopState = () => {
      const updatedParams = new URLSearchParams(window.location.search);
      const updatedPage = updatedParams.get('page') as Page | null;
      if (updatedPage && validPages.includes(updatedPage)) {
        setCurrentPage(updatedPage);
      } else {
        setCurrentPage('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

 useEffect(() => {
 const timer = setTimeout(() => {
 setShowSplash(false);
 }, 1300);
 return () => clearTimeout(timer);
 }, []);

 useEffect(() => {
 window.scrollTo(0, 0);
 }, [currentPage]);

 useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentUrlPage = params.get('page');
    const targetPage = currentPage === 'home' ? null : currentPage;
    if (currentUrlPage !== targetPage) {
      const newUrl = targetPage ? `${window.location.pathname}?page=${targetPage}` : window.location.pathname;
      window.history.pushState({}, '', newUrl);
    }
  }, [currentPage]);

 const handleAdminLogin = (staff: Staff) => {
    setCurrentStaff(staff);
    localStorage.setItem('pp_current_staff', JSON.stringify(staff));
  };

 const handleAdminLogout = () => {
    setCurrentStaff(null);
    localStorage.removeItem('pp_current_staff');
    setCurrentPage('home');
  };

 // Cross-page preset bridges
 const handleVisitPreset = (preset: { paintersCount: number; itemId: string }) => {
 setPaintersCountPreset(preset.paintersCount);
 };

 const handlePartyPreset = (preset: { guestsCount: number; type: 'birthday' | 'hen-shower' | 'corporate' }) => {
 setPaintersCountPreset(preset.guestsCount);
 // Also save session type for contact auto-setup
 localStorage.setItem('pp_draft_notes', `Group Party Inquiry context: ${preset.type.toUpperCase()} package of ${preset.guestsCount} painters.`);
 };

 // Switch views
 const renderCurrentView = () => {
 switch (currentPage) {
 case 'home':
 return <HomeView setCurrentPage={setCurrentPage} setVisitPreset={handleVisitPreset} adminMode={adminMode} />;
 case 'baby-prints':
 return <BabyPrintsView setCurrentPage={setCurrentPage} adminMode={adminMode} />;
 case 'parties':
 return <PartiesView setCurrentPage={setCurrentPage} adminMode={adminMode} />;
 case 'pricing':
 return <PricingView setCurrentPage={setCurrentPage} initialPainters={paintersCountPreset} adminMode={adminMode} />;
 case 'food-drink':
 return <FoodDrinkView adminMode={adminMode} />;
 case 'gallery':
 return <GalleryView adminMode={adminMode} />;
 case 'faqs':
 return <FAQsView adminMode={adminMode} setCurrentPage={setCurrentPage} />;
 case 'contact':
 return <ContactView initialPainters={paintersCountPreset} adminMode={adminMode} />;
 case 'contact-info':
 return <ContactInfoView setCurrentPage={setCurrentPage} adminMode={adminMode} />;
 case 'book':
 return <BookView setCurrentPage={setCurrentPage} adminMode={adminMode} />;
 case 'gift-cards':
 return <GiftCardView adminMode={adminMode} />;
 case 'buy-gift-card':
 return <GiftCardPurchaseView setCurrentPage={setCurrentPage} adminMode={adminMode} />;
 case 'gift-card-success':
 return <GiftCardSuccessView setCurrentPage={setCurrentPage} adminMode={adminMode} />;
 case 'gift-card-balance':
 return <GiftCardBalanceView setCurrentPage={setCurrentPage} adminMode={adminMode} />;
 case 'putney':
 return <PutneyView setCurrentPage={setCurrentPage} adminMode={adminMode} />;
 case 'wimbledon':
 return <WimbledonView setCurrentPage={setCurrentPage} adminMode={adminMode} />;
 case 'party-birthday-putney':
 return <PartyBookingView partyType="birthday" studio="Putney" setCurrentPage={setCurrentPage} adminMode={adminMode} />;
 case 'party-birthday-wimbledon':
 return <PartyBookingView partyType="birthday" studio="Wimbledon" setCurrentPage={setCurrentPage} adminMode={adminMode} />;
 case 'party-babyshower-putney':
 return <PartyBookingView partyType="baby-shower-hen" studio="Putney" setCurrentPage={setCurrentPage} adminMode={adminMode} />;
 case 'party-babyshower-wimbledon':
 return <PartyBookingView partyType="baby-shower-hen" studio="Wimbledon" setCurrentPage={setCurrentPage} adminMode={adminMode} />;
 case 'party-corporate-putney':
 return <PartyBookingView partyType="corporate" studio="Putney" setCurrentPage={setCurrentPage} adminMode={adminMode} />;
 case 'party-corporate-wimbledon':
 return <PartyBookingView partyType="corporate" studio="Wimbledon" setCurrentPage={setCurrentPage} adminMode={adminMode} />;
 case 'admin':
            if (currentStaff) {
              return (
                <ErrorBoundary onReset={() => { setCurrentStaff(null); handleAdminLogout(); }}>
                  <AdminDashboardView staff={currentStaff} onLogout={handleAdminLogout} />
                </ErrorBoundary>
              );
            }
            return <AdminLoginView onLogin={handleAdminLogin} />;
 default:
 return <NotFoundView setCurrentPage={setCurrentPage} adminMode={adminMode} />;
 }
 };

 return (
 <ErrorBoundary>
 <ToastProvider>
 <div className="flex flex-col min-h-screen bg-[#FFFFFF] text-[#1B2D3C] selection:bg-[#DBE7E4]/15 selection:text-[#1B2D3C] transition-all duration-300">

 {/* Navigation Headers */}
 {currentPage !== 'admin' && <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} currentStaff={currentStaff} adminMode={adminMode} setAdminMode={setAdminMode} />}

 {/* Main Pages Content Window with graceful layout transitions */}
 <main className="flex-grow">
 {currentPage !== 'home' && currentPage !== 'admin' && (
 <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-4">
 <button
 onClick={() => setCurrentPage('home')}
 className="inline-flex items-center gap-2 text-sm text-[#1B2D3C] hover:text-[#1B2D3C]/70 transition-colors cursor-pointer"
 >
 <ArrowLeft className="w-4 h-4" />
 Back
 </button>
 </div>
 )}
 <AnimatePresence mode="wait">
 <motion.div
 key={currentPage}
 initial={{ opacity: 0, y: 15 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -15 }}
 transition={{ duration: 0.28, ease: 'easeInOut' }}
 >
 {renderCurrentView()}
 </motion.div>
 </AnimatePresence>
 </main>

 {/* Footer Details */}
 {currentPage !== 'admin' && (
 <div className="pb-20 md:pb-0">
 <Footer setCurrentPage={setCurrentPage} adminMode={adminMode} />
 </div>
 )}
 </div>
 </ToastProvider>
 </ErrorBoundary>
 );
}

