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
import { Page } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Images } from './images';

export default function App() {
 const [currentPage, setCurrentPage] = useState<Page>('home');
 const [paintersCountPreset, setPaintersCountPreset] = useState<number>(1);
 const [isAdmin, setIsAdmin] = useState(false);
 const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
 const [showSplash, setShowSplash] = useState(true);

 useEffect(() => {
 const adminAuth = localStorage.getItem('pp_admin_auth');
 if (adminAuth === 'true') {
 setIsAdminLoggedIn(true);
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

 const handleAdminLogin = () => {
 setIsAdminLoggedIn(true);
 localStorage.setItem('pp_admin_auth', 'true');
 };

 const handleAdminLogout = () => {
 setIsAdminLoggedIn(false);
 localStorage.removeItem('pp_admin_auth');
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
 case 'putney':
 return <PutneyView setCurrentPage={setCurrentPage} />;
 case 'wimbledon':
 return <WimbledonView setCurrentPage={setCurrentPage} />;
 case 'admin':
 if (isAdminLoggedIn) {
 return <AdminDashboardView onLogout={handleAdminLogout} />;
 }
 return <AdminLoginView onLogin={handleAdminLogin} />;
 default:
 return <HomeView setCurrentPage={setCurrentPage} />;
 }
 };

 return (
 <div className="flex flex-col min-h-screen bg-[#FFFFFF] text-[#1B2D3C] selection:bg-[#DBE7E4]/15 selection:text-[#1B2D3C] transition-all duration-300">
 {/* Splash Screen */}
 <AnimatePresence>
 {showSplash && (
 <motion.div
 initial={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.5 }}
 className="fixed inset-0 z-[100] bg-[#FFFFFF] flex items-center justify-center"
 >
 <motion.img
 src={Images.logo}
 alt="Pitter Potter"
 initial={{ scale: 3, opacity: 1 }}
 animate={{ scale: 0.1, opacity: 0 }}
 transition={{ duration: 0.8, ease: 'easeInOut' }}
 className="w-64 h-auto object-contain"
 />
 </motion.div>
 )}
 </AnimatePresence>

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

