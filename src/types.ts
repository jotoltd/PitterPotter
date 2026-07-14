export type Page = 'home' | 'baby-prints' | 'parties' | 'pricing' | 'food-drink' | 'faqs' | 'gallery' | 'contact' | 'contact-info' | 'admin' | 'putney' | 'wimbledon' | 'book' | 'buy-gift-card' | 'gift-card-success' | 'gift-card-balance' | 'party-birthday-putney' | 'party-birthday-wimbledon' | 'party-babyshower-putney' | 'party-babyshower-wimbledon' | 'party-corporate-putney' | 'party-corporate-wimbledon' | 'baby-prints-book' | 'party-birthday-detail' | 'party-babyshower-detail' | 'price-list';

export interface PotteryItem {
  id: string;
  name: string;
  price: string;
  basePrice: number;
  category: 'tableware' | 'decor' | 'kids' | 'seasonal';
  description?: string;
  isPartyEligible?: boolean;
  imageUrls?: string[];
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
  status: 'pending' | 'confirmed' | 'cancelled';
  requestDate: string;
  estimatedPrice?: number;
  source?: 'online' | 'walk-in';
  giftCardCode?: string;
  giftCardDiscount?: number;
  finalPrice?: number;
  tableId?: string;
  depositAmount?: number;
  finalSeats?: number;
  finalBalance?: number;
  paymentLinkUrl?: string;
  paymentLinkSentAt?: string;
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  stripePaymentIntentId?: string;
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
  allowedStudios?: ('Putney' | 'Wimbledon')[];
  sessionToken?: string;
  sessionExpiresAt?: string;
  createdAt: string;
}

export type StaffRole = Staff['role'];

export interface AuditLog {
  id: string;
  username: string;
  action: string;
  entity: string;
  entity_id?: string;
  details?: unknown;
  created_at: string;
}

export interface GiftCardApiRow {
  id: string;
  code: string;
  amount: number;
  balance: number;
  recipient_name?: string;
  recipient_email?: string;
  sender_name?: string;
  message?: string;
  purchase_date?: string;
  expiry_date?: string;
  status: 'active' | 'redeemed' | 'expired';
}

export interface StaffApiRow {
  id: string;
  name: string;
  username: string;
  role: 'super_admin' | 'staff';
  can_update_status: boolean;
  can_edit_bookings: boolean;
  can_add_walk_ins: boolean;
  can_delete_bookings: boolean;
  allowed_studios?: ('Putney' | 'Wimbledon')[];
  created_at: string;
}
