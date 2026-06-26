export type Page = 'home' | 'parties' | 'pricing' | 'faqs' | 'gallery' | 'contact' | 'admin' | 'putney' | 'wimbledon' | 'book' | 'gift-cards' | 'buy-gift-card' | 'gift-card-success' | 'gift-card-balance';

export interface PotteryItem {
  id: string;
  name: string;
  price: string;
  basePrice: number;
  category: 'tableware' | 'decor' | 'kids' | 'seasonal';
  description?: string;
  isPartyEligible?: boolean;
  imageUrl?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'fees' | 'bookings' | 'fittings' | 'creativity' | 'policies';
}

export interface BookingInquiry {
  id: string;
  studio: 'Putney' | 'Wimbledon';
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  paintersCount: number;
  sessionType: 'painting' | 'birthday-party' | 'baby-shower-hen' | 'clay-imprints' | 'corporate';
  notes?: string;
  status: 'pending' | 'confirmed';
  requestDate: string;
  estimatedPrice?: number;
  source?: 'online' | 'walk-in';
  giftCardCode?: string;
  giftCardDiscount?: number;
  finalPrice?: number;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  title: string;
  category: 'creation' | 'studio' | 'party' | 'imprint';
  caption: string;
}

export interface GiftCard {
  id: string;
  code: string;
  amount: number;
  balance: number;
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  message?: string;
  purchaseDate: string;
  expiryDate?: string;
  status: 'active' | 'redeemed' | 'expired';
}

export interface Staff {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  role: 'super_admin' | 'staff';
  canUpdateStatus: boolean;
  canEditBookings: boolean;
  canAddWalkIns: boolean;
  canDeleteBookings: boolean;
  sessionToken?: string;
  sessionExpiresAt?: string;
  createdAt: string;
}

export type StaffRole = Staff['role'];
