/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { ArrowLeft, Construction } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomeView from './components/HomeView';
import { ToastProvider } from './components/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import SessionWatcher from './components/SessionWatcher';
import { Page, Staff } from './types';

const BabyPrintsView = lazy(() => import('./components/BabyPrintsView'));
const BabyPrintsBookingView = lazy(() => import('./components/BabyPrintsBookingView'));
const PartiesView = lazy(() => import('./components/PartiesView'));
const PricingView = lazy(() => import('./components/PricingView'));
const FAQsView = lazy(() => import('./components/FAQsView'));
const GalleryView = lazy(() => import('./components/GalleryView'));
const ContactView = lazy(() => import('./components/ContactView'));
const ContactInfoView = lazy(() => import('./components/ContactInfoView'));
const BookView = lazy(() => import('./components/BookView'));
const AdminLoginView = lazy(() => import('./components/AdminLoginView'));
const AdminDashboardView = lazy(() => import('./components/AdminDashboardView'));
const PutneyView = lazy(() => import('./components/PutneyView'));
const WimbledonView = lazy(() => import('./components/WimbledonView'));
const GiftCardPurchaseView = lazy(() => import('./components/GiftCardPurchaseView'));
const GiftCardSuccessView = lazy(() => import('./components/GiftCardSuccessView'));
const NotFoundView = lazy(() => import('./components/NotFoundView'));
const GiftCardBalanceView = lazy(() => import('./components/GiftCardBalanceView'));
const PartyPaymentView = lazy(() => import('./components/PartyPaymentView'));
const ManageBookingView = lazy(() => import('./components/ManageBookingView'));
const PartyBookingView = lazy(() => import('./components/PartyBookingView'));
const PartyDetailView = lazy(() => import('./components/PartyDetailView'));
const PriceListView = lazy(() => import('./components/PriceListView'));
const PotteryPaintingView = lazy(() => import('./components/PotteryPaintingView'));
const FoodDrinkView = lazy(() => import('./components/FoodDrinkView'));
const MaintenanceView = lazy(() => import('./components/MaintenanceView'));

const PAGE_TO_PATH: Record<Page, string> = {
  'home': '/',
  'baby-prints': '/baby-prints',
  'baby-prints-book': '/baby-prints/book',
  'parties': '/parties',
  'pricing': '/pricing',
  'food-drink': '/food-drink',
  'price-list': '/price-list',
  'pottery-painting': '/pottery-painting',
  'faqs': '/faqs',
  'gallery': '/gallery',
  'contact': '/contact',
  'contact-info': '/contact-info',
  'book': '/book',
  'buy-gift-card': '/buy-gift-card',
  'gift-card-success': '/gift-card-success',
  'gift-card-balance': '/gift-card-balance',
  'putney': '/putney',
  'wimbledon': '/wimbledon',
  'admin': '/admin',
  'party-birthday-detail': '/parties/birthday',
  'party-babyshower-detail': '/parties/baby-shower-hen',
  'party-birthday-putney': '/parties/birthday/putney',
  'party-birthday-wimbledon': '/parties/birthday/wimbledon',
  'party-babyshower-putney': '/parties/baby-shower-hen/putney',
  'party-babyshower-wimbledon': '/parties/baby-shower-hen/wimbledon',
  'party-corporate-putney': '/parties/corporate/putney',
  'party-corporate-wimbledon': '/parties/corporate/wimbledon',
  'not-found': '/not-found',
  'party-payment': '/party-payment',
  'party-payment-success': '/party-payment-success',
  'manage-booking': '/manage-booking',
};

const PATH_TO_PAGE: Record<string, Page> = Object.entries(PAGE_TO_PATH).reduce((acc, [page, path]) => {
  acc[path] = page as Page;
  return acc;
}, {} as Record<string, Page>);

function getPageFromPath(): Page {
  const path = window.location.pathname;
  if (path === '/' || path === '') return 'home';
  const page = PATH_TO_PAGE[path];
  if (page) return page;
  // Legacy ?page= support
  const params = new URLSearchParams(window.location.search);
  const legacyPage = params.get('page') as Page | null;
  if (legacyPage && legacyPage in PAGE_TO_PATH) return legacyPage;
  return 'not-found';
}

async function checkShortUrl(): Promise<boolean> {
  const path = window.location.pathname;
  const code = path.replace(/^\/+/, '');
  if (!code || code.length < 3 || code.length > 10 || !/^[a-z0-9]+$/i.test(code)) {
    return false;
  }
  if (code in PATH_TO_PAGE || PATH_TO_PAGE[`/${code}`]) return false;
  if (!isSupabaseEnabled()) return false;
  try {
    const { data, error } = await supabase!
      .from('short_urls')
      .select('target_url')
      .eq('short_code', code)
      .single();
    if (data?.target_url) {
      window.location.replace(data.target_url);
      return true;
    }
  } catch {
    // Not a short URL, fall through
  }
  return false;
}
import { motion, AnimatePresence } from 'motion/react';
import { supabase, isSupabaseEnabled } from './lib/supabase';
import { loadSlotsFromSupabase } from './lib/timeSlots';
import { loadClosuresFromSupabase } from './lib/closures';

export default function App() {
 const [currentPage, setCurrentPage] = useState<Page>(() => getPageFromPath());
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

    const handlePageSettingsChanged = () => loadPageSettings();
    window.addEventListener('pp-page-settings-changed', handlePageSettingsChanged);
    return () => window.removeEventListener('pp-page-settings-changed', handlePageSettingsChanged);
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

    const initialPage = getPageFromPath();
    setCurrentPage(initialPage);

    checkShortUrl();

    const handlePopState = () => {
      setCurrentPage(getPageFromPath());
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
   const scrollToTop = () => {
     window.scrollTo(0, 0);
     document.documentElement.scrollTop = 0;
     document.body.scrollTop = 0;
     window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
   };
   // Immediate scroll for browsers that handle it before paint
   scrollToTop();
   // After exit animation completes (~280ms) and new content mounts
   const t1 = setTimeout(scrollToTop, 350);
   // After full enter animation completes (~560ms) for safety
   const t2 = setTimeout(scrollToTop, 600);
   return () => { clearTimeout(t1); clearTimeout(t2); };
 }, [currentPage]);

 useEffect(() => {
    const targetPath = PAGE_TO_PATH[currentPage] || '/';
    const currentPath = window.location.pathname;
    if (currentPath !== targetPath) {
      const search = window.location.search;
      window.history.pushState({}, '', search ? `${targetPath}${search}` : targetPath);
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
 return <HomeView setCurrentPage={setCurrentPage} setVisitPreset={handleVisitPreset} adminMode={adminMode} disabledPages={disabledPages} />;
 case 'baby-prints':
 return <BabyPrintsView setCurrentPage={setCurrentPage} adminMode={adminMode} />;
 case 'baby-prints-book':
 return <BabyPrintsBookingView adminMode={adminMode} setCurrentPage={setCurrentPage} />;
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
 return <ContactView initialPainters={paintersCountPreset} adminMode={adminMode} setCurrentPage={setCurrentPage} />;
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
 case 'not-found':
 return <NotFoundView setCurrentPage={setCurrentPage} adminMode={adminMode} />;
 case 'party-payment':
 return <PartyPaymentView setCurrentPage={setCurrentPage} adminMode={adminMode} />;
 case 'party-payment-success':
 return <PartyPaymentView setCurrentPage={setCurrentPage} adminMode={adminMode} successMode />;
 case 'manage-booking':
 return <ManageBookingView setCurrentPage={setCurrentPage} />;
 default:
 return <NotFoundView setCurrentPage={setCurrentPage} adminMode={adminMode} />;
 }
 };

 if (maintenanceMode && !isAdminLoggedIn && currentPage !== 'admin') {
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
 {currentPage !== 'home' && currentPage !== 'admin' && currentPage !== 'not-found' && (
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
 <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-2 border-[#1B2D3C]/20 border-t-[#1B2D3C] rounded-full animate-spin" /></div>}>
 {renderCurrentView()}
 </Suspense>
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

