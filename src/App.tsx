/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomeView from './components/HomeView';
import PartiesView from './components/PartiesView';
import PricingView from './components/PricingView';
import FAQsView from './components/FAQsView';
import GalleryView from './components/GalleryView';
import ContactView from './components/ContactView';
import BookView from './components/BookView';
import AdminLoginView from './components/AdminLoginView';
import AdminDashboardView from './components/AdminDashboardView';
import PutneyView from './components/PutneyView';
import WimbledonView from './components/WimbledonView';
import GiftCardView from './components/GiftCardView';
import GiftCardPurchaseView from './components/GiftCardPurchaseView';
import GiftCardSuccessView from './components/GiftCardSuccessView';
import GiftCardBalanceView from './components/GiftCardBalanceView';
import { Page, Staff } from './types';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
 const [currentPage, setCurrentPage] = useState<Page>('home');
 const [paintersCountPreset, setPaintersCountPreset] = useState<number>(1);
 const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
 const [showSplash, setShowSplash] = useState(true);

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
    if (pageParam && ['gift-card-success', 'buy-gift-card'].includes(pageParam)) {
      setCurrentPage(pageParam);
    }
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
 return <HomeView setCurrentPage={setCurrentPage} setVisitPreset={handleVisitPreset} />;
 case 'parties':
 return <PartiesView setCurrentPage={setCurrentPage} />;
 case 'pricing':
 return <PricingView setCurrentPage={setCurrentPage} initialPainters={paintersCountPreset} />;
 case 'gallery':
 return <GalleryView />;
 case 'faqs':
 return <FAQsView />;
 case 'contact':
 return <ContactView initialPainters={paintersCountPreset} />;
 case 'book':
 return <BookView setCurrentPage={setCurrentPage} />;
 case 'gift-cards':
 return <GiftCardView />;
 case 'buy-gift-card':
 return <GiftCardPurchaseView setCurrentPage={setCurrentPage} />;
 case 'gift-card-success':
 return <GiftCardSuccessView setCurrentPage={setCurrentPage} />;
 case 'gift-card-balance':
 return <GiftCardBalanceView setCurrentPage={setCurrentPage} />;
 case 'putney':
 return <PutneyView setCurrentPage={setCurrentPage} />;
 case 'wimbledon':
 return <WimbledonView setCurrentPage={setCurrentPage} />;
 case 'admin':
            if (currentStaff) {
              return <AdminDashboardView staff={currentStaff} onLogout={handleAdminLogout} />;
            }
            return <AdminLoginView onLogin={handleAdminLogin} />;
 default:
 return <HomeView setCurrentPage={setCurrentPage} />;
 }
 };

 return (
 <div className="flex flex-col min-h-screen bg-[#FFFFFF] text-[#1B2D3C] selection:bg-[#DBE7E4]/15 selection:text-[#1B2D3C] transition-all duration-300">

 {/* Navigation Headers */}
 {currentPage !== 'admin' && <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />}

 {/* Main Pages Content Window with graceful layout transitions */}
 <main className="flex-grow">
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
 <Footer setCurrentPage={setCurrentPage} />
 </div>
 )}
 </div>
 );
}

