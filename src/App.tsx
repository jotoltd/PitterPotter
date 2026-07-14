/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Construction } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomeView from './components/HomeView';
import BabyPrintsView from './components/BabyPrintsView';
import BabyPrintsBookingView from './components/BabyPrintsBookingView';
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
import GiftCardPurchaseView from './components/GiftCardPurchaseView';
import GiftCardSuccessView from './components/GiftCardSuccessView';
import NotFoundView from './components/NotFoundView';
import GiftCardBalanceView from './components/GiftCardBalanceView';
import PartyBookingView from './components/PartyBookingView';
import PartyDetailView from './components/PartyDetailView';
import PriceListView from './components/PriceListView';
import PotteryPaintingView from './components/PotteryPaintingView';
import FoodDrinkView from './components/FoodDrinkView';
import MaintenanceView from './components/MaintenanceView';
import { ToastProvider } from './components/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import SessionWatcher from './components/SessionWatcher';
import { Page, Staff } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, isSupabaseEnabled } from './lib/supabase';
import { loadSlotsFromSupabase } from './lib/timeSlots';
import { loadClosuresFromSupabase } from './lib/closures';

export default function App() {
 const [currentPage, setCurrentPage] = useState<Page>('home');
 const [paintersCountPreset, setPaintersCountPreset] = useState<number>(1);
 const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
 const [showSplash, setShowSplash] = useState(true);
 const [adminMode, setAdminMode] = useState(false);
 const [disabledPages, setDisabledPages] = useState<Set<string>>(new Set());
 const [maintenanceMode, setMaintenanceMode] = useState(false);

 const isAdminLoggedIn = !!currentStaff;

 useEffect(() => {
    if (isSupabaseEnabled()) {
      loadSlotsFromSupabase();
      loadClosuresFromSupabase();
    }
  }, []);

 useEffect(() => {
    if (adminMode) {
      document.body.classList.add('admin-mode-active');
    } else {
      document.body.classList.remove('admin-mode-active');
    }
  }, [adminMode]);

  // Disable all hyperlinks in admin edit mode, except editable content and modals
  useEffect(() => {
    if (!adminMode) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      // Allow editable elements and modals to receive clicks
      const editable = target.closest('[data-editable], [contenteditable], [data-modal]');
      if (editable) return;
      const link = target.closest('a');
      if (link) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [adminMode]);

  useEffect(() => {
    if (!isSupabaseEnabled()) return;
    const loadPageSettings = async () => {
      try {
        const { data } = await supabase!.from('page_settings').select('page_key, enabled');
        if (data) {
          const disabled = new Set(data.filter(s => !s.enabled).map(s => s.page_key));
          setDisabledPages(disabled);
        }
      } catch (err) {
        console.error('Failed to load page settings:', err);
      }
    };
    loadPageSettings();
  }, []);

  useEffect(() => {
    if (!isSupabaseEnabled()) return;
    const loadMaintenance = async () => {
      try {
        const { data } = await supabase!.from('settings').select('value').eq('key', 'maintenance_mode').maybeSingle();
        if (data?.value === 'true') setMaintenanceMode(true);
      } catch {}
    };
    loadMaintenance();
  }, []);

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
            if (localStorage.getItem('pp_activate_edit_mode') === '1') {
              setAdminMode(true);
              localStorage.removeItem('pp_activate_edit_mode');
            }
          }
        }
      } catch (err) {
        console.error('Failed to load staff session:', err);
      }
    }

    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page') as Page | null;
    const validPages: Page[] = ['home', 'baby-prints', 'parties', 'pricing', 'faqs', 'gallery', 'contact', 'contact-info', 'book', 'buy-gift-card', 'gift-card-success', 'gift-card-balance', 'putney', 'wimbledon', 'admin', 'baby-prints-book'];
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
 // Check if page is disabled (unless admin or admin mode)
 const isPageDisabled = disabledPages.has(currentPage) && !isAdminLoggedIn && !adminMode;

 if (isPageDisabled) {
   return (
     <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-6">
       <Construction className="w-16 h-16 text-[#1B2D3C]/40" />
       <div className="space-y-2">
         <h1 className="font-heading text-2xl font-black text-[#1B2D3C]">Page Under Maintenance</h1>
         <p className="text-sm text-[#1B2D3C]/70 max-w-md">This page is temporarily unavailable. Please check back later or contact us for assistance.</p>
       </div>
       <button
         onClick={() => setCurrentPage('home')}
         className="px-6 py-3 bg-[#1B2D3C] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#486581] transition-colors cursor-pointer"
       >
         Return Home
       </button>
     </div>
   );
 }

 switch (currentPage) {
 case 'home':
 return <HomeView setCurrentPage={setCurrentPage} setVisitPreset={handleVisitPreset} adminMode={adminMode} />;
 case 'baby-prints':
 return <BabyPrintsView setCurrentPage={setCurrentPage} adminMode={adminMode} />;
 case 'baby-prints-book':
 return <BabyPrintsBookingView adminMode={adminMode} />;
 case 'parties':
 return <PartiesView setCurrentPage={setCurrentPage} adminMode={adminMode} />;
 case 'pricing':
 return <PricingView setCurrentPage={setCurrentPage} initialPainters={paintersCountPreset} adminMode={adminMode} />;
 case 'food-drink':
 return <FoodDrinkView adminMode={adminMode} />;
case 'price-list':
 return <PriceListView adminMode={adminMode} />;
case 'pottery-painting':
 return <PotteryPaintingView setCurrentPage={setCurrentPage} adminMode={adminMode} />;
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
 case 'party-birthday-detail':
return <PartyDetailView partyType="birthday" setCurrentPage={setCurrentPage} adminMode={adminMode} />;
case 'party-babyshower-detail':
return <PartyDetailView partyType="baby-shower-hen" setCurrentPage={setCurrentPage} adminMode={adminMode} />;
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

 if (maintenanceMode && !isAdminLoggedIn) {
   return (
     <ErrorBoundary>
       <ToastProvider>
         <MaintenanceView />
       </ToastProvider>
     </ErrorBoundary>
   );
 }

 return (
 <ErrorBoundary>
 <ToastProvider>
 <SessionWatcher key={currentStaff?.sessionToken || 'anonymous'} onExpire={handleAdminLogout} />
 <div className="flex flex-col min-h-screen bg-[#FFFFFF] text-[#1B2D3C] selection:bg-[#DBE7E4]/15 selection:text-[#1B2D3C] transition-all duration-300">

 {/* Navigation Headers */}
 {currentPage !== 'admin' && <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} currentStaff={currentStaff} adminMode={adminMode} setAdminMode={setAdminMode} disabledPages={disabledPages} />}

 {/* Edit Mode Banner */}
 {adminMode && currentPage !== 'admin' && (
   <div className="sticky top-0 z-[150] w-full bg-amber-400 text-amber-900 text-[11px] font-bold uppercase tracking-widest flex items-center justify-between px-4 py-2 shadow-sm">
     <span className="flex items-center gap-2">
       <span className="w-2 h-2 rounded-full bg-amber-700 animate-pulse inline-block" />
       Edit Mode — click any <span className="underline underline-offset-2">text</span> or <span className="underline underline-offset-2">image</span> to edit it
     </span>
     <button onClick={() => setAdminMode(false)} className="px-3 py-1 bg-amber-900/10 hover:bg-amber-900/20 rounded text-amber-900 cursor-pointer transition-colors">
       Done Editing
     </button>
   </div>
 )}

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

