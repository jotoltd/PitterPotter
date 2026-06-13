export type Page = 'home' | 'parties' | 'pricing' | 'faqs' | 'gallery' | 'contact' | 'admin' | 'putney' | 'wimbledon';

export interface PotteryItem {
  id: string;
  name: string;
  price: string;
  basePrice: number;
  category: 'tableware' | 'decor' | 'kids' | 'seasonal';
  description?: string;
  isPartyEligible?: boolean;
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
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  title: string;
  category: 'creation' | 'studio' | 'party' | 'imprint';
  caption: string;
}
