import { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardOverview from './DashboardOverview';
import ConfirmDialog from './ConfirmDialog';
import FloorPlanView from './FloorPlanView';
import WimbledonFloorPlan, { findAvailableTable } from './WimbledonFloorPlan';
import PutneyFloorPlan, { findAvailablePutneyTable } from './PutneyFloorPlan';
import { Calendar, Clock, Users, Mail, Phone, LogOut, Trash2, CheckCircle, XCircle, Plus, Copy, Inbox, CalendarX, Gift, ChevronUp, ChevronDown, CalendarDays } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format, isSameDay, parseISO } from 'date-fns';
import { BookingInquiry, GiftCard, Staff } from '../types';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { loadBookings, createBooking, updateBooking, updateBookingStatus, deleteBooking, getRemainingCapacity } from '../lib/bookings';
import { useToast } from './ToastContext';
import 'react-day-picker/dist/style.css';

interface AdminDashboardProps {
  staff: Staff;
  onLogout: () => void;
}

const SESSION_LABELS: Record<string, string> = {
  'painting': 'Painting',
  'birthday-party': 'Birthday',
  'baby-shower-hen': 'Baby Shower / Hen',
  'clay-imprints': 'Clay Imprints',
  'corporate': 'Corporate',
};

const SESSION_BADGE: Record<string, string> = {
  'painting': 'bg-blue-50 text-blue-700',
  'birthday-party': 'bg-pink-50 text-pink-700',
  'baby-shower-hen': 'bg-purple-50 text-purple-700',
  'clay-imprints': 'bg-orange-50 text-orange-700',
  'corporate': 'bg-slate-100 text-slate-700',
};

interface SortHeaderProps {
  field: 'date' | 'name' | 'studio' | 'status';
  label: string;
  sort: { field: 'date' | 'name' | 'studio' | 'status'; direction: 'asc' | 'desc' };
  setSort: (sort: { field: 'date' | 'name' | 'studio' | 'status'; direction: 'asc' | 'desc' }) => void;
}

function SortHeader({ field, label, sort, setSort }: SortHeaderProps) {
  const active = sort.field === field;
  const handleClick = () => {
    setSort({ field, direction: active && sort.direction === 'asc' ? 'desc' : 'asc' });
  };
  return (
    <th
      onClick={handleClick}
      className="text-left px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C] cursor-pointer select-none hover:bg-[#1B2D3C]/5"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active && (sort.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </span>
    </th>
  );
}

export default function AdminDashboardView({ staff, onLogout }: AdminDashboardProps) {
  const { showToast } = useToast();
  const [inquiries, setInquiries] = useState<BookingInquiry[]>([]);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'gift-cards' | 'settings' | 'analytics'>('dashboard');
  const [stripeMode, setStripeMode] = useState<'sandbox' | 'live'>('sandbox');
  const [capacityRows, setCapacityRows] = useState<{ studio: string; session_type: string; max_painters: number }[]>([]);
  const [capacitySaving, setCapacitySaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [studioFilter, setStudioFilter] = useState<'all' | 'Putney' | 'Wimbledon'>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const [editingBooking, setEditingBooking] = useState<BookingInquiry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sort, setSort] = useState<{ field: 'date' | 'name' | 'studio' | 'status'; direction: 'asc' | 'desc' }>({ field: 'date', direction: 'desc' });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newBooking, setNewBooking] = useState<Partial<BookingInquiry>>({
    studio: 'Putney',
    name: '',
    email: '',
    phone: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '10:00',
    paintersCount: 1,
    sessionType: 'painting',
    status: 'pending',
  });

  const [newBookingCapacity, setNewBookingCapacity] = useState<number | null>(null);
  const [editBookingCapacity, setEditBookingCapacity] = useState<number | null>(null);
  const [capacityLoading, setCapacityLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assignModalBooking, setAssignModalBooking] = useState<BookingInquiry | null>(null);
  const [confirmingIds, setConfirmingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    variant: 'danger' | 'warning';
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', confirmLabel: 'Confirm', variant: 'danger', onConfirm: () => {} });

  const showConfirmDialog = (opts: { title: string; message: string; confirmLabel?: string; variant?: 'danger' | 'warning'; onConfirm: () => void }) => {
    setConfirmDialog({ isOpen: true, confirmLabel: 'Confirm', variant: 'danger', ...opts });
  };
  const closeConfirmDialog = () => setConfirmDialog(d => ({ ...d, isOpen: false }));

  const handleUnauthorized = () => {
    showToast('Your session has expired. Please log in again.', 'error');
    localStorage.removeItem('pp_current_staff');
    onLogout();
  };

  // Check session expiry on mount
  useEffect(() => {
    if (staff?.sessionExpiresAt) {
      if (new Date(staff.sessionExpiresAt) < new Date()) {
        handleUnauthorized();
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, studioFilter, debouncedSearchTerm, dateRange, sort]);

  const fetchCapacity = useCallback(async (studio: string, date: string, time: string, setter: (v: number | null) => void) => {
    if (!studio || !date || !time) { setter(null); return; }
    setCapacityLoading(true);
    try {
      const remaining = await getRemainingCapacity(studio as 'Putney' | 'Wimbledon', date, time);
      setter(remaining);
    } catch {
      setter(null);
    } finally {
      setCapacityLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showAddModal && newBooking.studio && newBooking.date && newBooking.time) {
      fetchCapacity(newBooking.studio, newBooking.date, newBooking.time, setNewBookingCapacity);
    }
  }, [showAddModal, newBooking.studio, newBooking.date, newBooking.time, fetchCapacity]);

  useEffect(() => {
    if (showEditModal && editingBooking?.studio && editingBooking?.date && editingBooking?.time) {
      fetchCapacity(editingBooking.studio, editingBooking.date, editingBooking.time, setEditBookingCapacity);
    }
  }, [showEditModal, editingBooking?.studio, editingBooking?.date, editingBooking?.time, fetchCapacity]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadInquiries(), loadGiftCards(), loadStripeMode()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'settings') {
      loadCapacity();
    }
  }, [activeTab]);

  const loadStripeMode = async () => {
    if (!isSupabaseEnabled() || !staff?.sessionToken) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: 'load', username: staff.username, sessionToken: staff.sessionToken, key: 'stripe_mode' }),
      });
      const data = await response.json();
      if (response.status === 401) { handleUnauthorized(); return; }
      if (!response.ok || data.error) {
        console.error('Failed to load stripe mode:', data.error);
        return;
      }
      if (data.value === 'live') setStripeMode('live');
    } catch (err) {
      console.error('Failed to load stripe mode:', err);
    }
  };

  const updateStripeMode = async (mode: 'sandbox' | 'live') => {
    if (!isSupabaseEnabled() || !staff?.sessionToken) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: 'update', username: staff.username, sessionToken: staff.sessionToken, key: 'stripe_mode', value: mode }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        console.error('Failed to update stripe mode:', data.error);
        showToast('Failed to update Stripe mode', 'error');
        return;
      }
      setStripeMode(mode);
    } catch (err) {
      console.error('Failed to update stripe mode:', err);
      showToast('Failed to update Stripe mode', 'error');
    }
  };

  const loadCapacity = async () => {
    if (!isSupabaseEnabled() || !staff?.sessionToken) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: 'loadCapacity', username: staff.username, sessionToken: staff.sessionToken }),
      });
      const data = await response.json();
      if (response.status === 401) { handleUnauthorized(); return; }
      if (!response.ok || data.error) {
        console.error('Failed to load capacity:', data.error);
        return;
      }
      setCapacityRows(data.capacity || []);
    } catch (err) {
      console.error('Failed to load capacity:', err);
    }
  };

  const updateCapacity = async (row: { studio: string; session_type: string; max_painters: number }) => {
    if (!isSupabaseEnabled() || !staff?.sessionToken) return;
    setCapacitySaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'updateCapacity',
          username: staff.username,
          sessionToken: staff.sessionToken,
          studio: row.studio,
          sessionType: row.session_type,
          maxPainters: row.max_painters,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        console.error('Failed to update capacity:', data.error);
        showToast('Failed to update capacity', 'error');
        return;
      }
      showToast('Capacity updated', 'success');
      await loadCapacity();
    } catch (err) {
      console.error('Failed to update capacity:', err);
      showToast('Failed to update capacity', 'error');
    } finally {
      setCapacitySaving(false);
    }
  };

  const loadInquiries = async () => {
    try {
      let bookings = await loadBookings(staff);
      if (staffAllowedStudios) {
        bookings = bookings.filter(b => staffAllowedStudios.includes(b.studio));
      }
      setInquiries(bookings);
    } catch (err: any) {
      if (err?.message === 'Unauthorized') { handleUnauthorized(); return; }
      console.error('Failed to load inquiries:', err);
    }
  };

  const loadGiftCards = async () => {
    if (isSupabaseEnabled() && staff?.sessionToken) {
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-gift-cards`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ action: 'list', username: staff.username, sessionToken: staff.sessionToken }),
        });
        const data = await response.json();
        if (response.status === 401) { handleUnauthorized(); return; }
        if (!response.ok || data.error) {
          console.error('Gift cards list error:', data.error);
        } else if (data.giftCards) {
          const mapped: GiftCard[] = data.giftCards.map((row: any) => ({
            id: row.id,
            code: row.code,
            amount: Number(row.amount),
            balance: Number(row.balance),
            recipientName: row.recipient_name,
            recipientEmail: row.recipient_email,
            senderName: row.sender_name,
            message: row.message,
            purchaseDate: row.purchase_date ? new Date(row.purchase_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
            expiryDate: row.expiry_date ? new Date(row.expiry_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : undefined,
            status: row.status,
          }));
          setGiftCards(mapped);
          localStorage.setItem('pp_gift_cards', JSON.stringify(mapped));
          return;
        }
      } catch (err) {
        console.error('Gift cards request failed:', err);
      }
    }

    const saved = localStorage.getItem('pp_gift_cards');
    if (saved) {
      try {
        setGiftCards(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to load gift cards:', err);
      }
    }
  };

  const getBookingAnalytics = () => {
    const total = inquiries.length;
    const confirmed = inquiries.filter((b) => b.status === 'confirmed').length;
    const pending = inquiries.filter((b) => b.status === 'pending').length;
    const cancelled = inquiries.filter((b) => b.status === 'cancelled').length;

    const dateCounts: Record<string, number> = {};
    inquiries.forEach((b) => {
      if (!b.date) return;
      const key = new Date(b.date).toISOString().split('T')[0];
      dateCounts[key] = (dateCounts[key] || 0) + 1;
    });
    const popularDates = Object.entries(dateCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([date, count]) => ({ date, count }));

    const monthlyCounts: Record<string, number> = {};
    inquiries.forEach((b) => {
      if (!b.date) return;
      const key = new Date(b.date).toISOString().slice(0, 7);
      monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
    });
    const bookingsByMonth = Object.entries(monthlyCounts)
      .sort()
      .map(([month, count]) => ({ month, count }));

    const studioCounts: Record<string, number> = {};
    inquiries.forEach((b) => {
      const key = b.studio || 'Unknown';
      studioCounts[key] = (studioCounts[key] || 0) + 1;
    });

    return { total, confirmed, pending, cancelled, popularDates, bookingsByMonth, studioCounts };
  };

  const getGiftCardAnalytics = () => {
    const total = giftCards.length;
    const totalRevenue = giftCards.reduce((sum, c) => sum + c.amount, 0);
    const activeBalance = giftCards.filter((c) => c.status === 'active').reduce((sum, c) => sum + c.balance, 0);
    const redeemed = giftCards.filter((c) => c.status === 'redeemed').length;
    const expired = giftCards.filter((c) => c.status === 'expired').length;
    const active = giftCards.filter((c) => c.status === 'active').length;
    return { total, totalRevenue, activeBalance, redeemed, expired, active };
  };

  const exportBookingsCSV = () => {
    const headers = ['Reference', 'Name', 'Email', 'Phone', 'Studio', 'Date', 'Time', 'Painters', 'Session Type', 'Status', 'Request Date', 'Notes', 'Estimated Price', 'Final Price', 'Gift Card Code'];
    const rows = inquiries.map((inq) => [
      inq.id,
      inq.name,
      inq.email,
      inq.phone,
      inq.studio,
      inq.date,
      inq.time,
      inq.paintersCount,
      inq.sessionType,
      inq.status,
      inq.requestDate || '',
      inq.notes || '',
      inq.estimatedPrice || '',
      inq.finalPrice || '',
      inq.giftCardCode || '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportGiftCardsCSV = () => {
    const headers = ['Code', 'Amount', 'Balance', 'Recipient Name', 'Recipient Email', 'Sender Name', 'Status', 'Purchase Date', 'Expiry Date'];
    const rows = giftCards.map((card) => [
      card.code,
      card.amount,
      card.balance,
      card.recipientName,
      card.recipientEmail,
      card.senderName,
      card.status,
      card.purchaseDate,
      card.expiryDate || '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gift_cards_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateGiftCardStatus = async (id: string, status: 'active' | 'redeemed' | 'expired') => {
    if (!isSupabaseEnabled() || !staff.sessionToken) {
      showToast('Gift card update unavailable', 'error');
      return;
    }
    if (status === 'expired') {
      showConfirmDialog({
        title: 'Expire Gift Card',
        message: 'This will mark the gift card as expired. This cannot be undone.',
        confirmLabel: 'Expire',
        variant: 'warning',
        onConfirm: () => { closeConfirmDialog(); updateGiftCardStatus(id, status); },
      });
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-gift-cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'updateStatus',
          username: staff.username,
          sessionToken: staff.sessionToken,
          id,
          status,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to update gift card');
      }
      setGiftCards(giftCards.map((c) => c.id === id ? { ...c, status } : c));
      showToast(`Gift card marked as ${status}`, 'success');
    } catch (err) {
      console.error('Failed to update gift card status:', err);
      showToast('Failed to update gift card status', 'error');
    }
  };

  const loadStaffList = async () => {
    if (!canManageStaff || !staff?.sessionToken) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/staff-management`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: 'list', username: staff.username, sessionToken: staff.sessionToken }),
      });
      const data = await response.json();
      if (response.status === 401) { handleUnauthorized(); return; }
      if (!response.ok || data.error) {
        console.error('Staff list error:', data.error);
      } else if (data.staff) {
        const mapped: Staff[] = data.staff.map((row: any) => ({
          id: row.id,
          name: row.name,
          username: row.username,
          passwordHash: '',
          role: row.role,
          canUpdateStatus: !!row.can_update_status,
          canEditBookings: !!row.can_edit_bookings,
          canAddWalkIns: !!row.can_add_walk_ins,
          canDeleteBookings: !!row.can_delete_bookings,
          allowedStudios: Array.isArray(row.allowed_studios) && row.allowed_studios.length > 0
            ? row.allowed_studios as ('Putney' | 'Wimbledon')[]
            : undefined,
          createdAt: row.created_at,
        }));
        setStaffList(mapped);
      }
    } catch (err) {
      console.error('Staff list request failed:', err);
    }
  };

  const updateBookingTable = async (bookingId: string, tableId: string | null) => {
    try {
      const booking = inquiries.find(i => i.id === bookingId);
      if (!booking) return;
      const updated = { ...booking, tableId: tableId ?? undefined };
      await updateBooking(updated, staff);
      setInquiries(inquiries.map(i => i.id === bookingId ? updated : i));
      setAssignModalBooking(null);
      showToast(tableId ? `Table ${tableId} assigned` : 'Table unassigned', 'success');
    } catch {
      showToast('Failed to update table assignment', 'error');
    }
  };

  const autoAssignTable = async (booking: BookingInquiry, silent = false): Promise<string | null> => {
    try {
      let tableId: string | null = null;
      if (booking.studio === 'Wimbledon') {
        const blocked = JSON.parse(localStorage.getItem('pitter_potter_blocked_tables') || '[]');
        const partyArea = booking.sessionType.includes('party') ? (booking.paintersCount > 8 ? 'party2' : 'party1') : undefined;
        tableId = findAvailableTable(inquiries, blocked, booking.date, booking.time, partyArea);
      } else {
        const blocked = JSON.parse(localStorage.getItem('pitter_potter_blocked_tables_putney') || '[]');
        tableId = findAvailablePutneyTable(inquiries, blocked, booking.date, booking.time);
      }
      if (!tableId) {
        if (!silent) showToast('No available table found', 'error');
        return null;
      }
      const updated = { ...booking, tableId };
      await updateBooking(updated, staff);
      setInquiries(prev => prev.map(i => i.id === booking.id ? updated : i));
      if (!silent) showToast(`Table ${tableId} assigned`, 'success');
      return tableId;
    } catch {
      if (!silent) showToast('Auto-assign failed', 'error');
      return null;
    }
  };

  const deleteInquiry = (id: string) => {
    showConfirmDialog({
      title: 'Delete Booking',
      message: 'This will permanently remove the booking. This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        closeConfirmDialog();
        try {
          await deleteBooking(id, staff);
          setInquiries(inquiries.filter((i) => i.id !== id));
          showToast('Booking deleted', 'success');
        } catch {
          showToast('Failed to delete booking', 'error');
        }
      },
    });
  };

  const updateStatus = async (id: string, status: 'confirmed' | 'pending' | 'cancelled') => {
    setConfirmingIds(prev => new Set(prev).add(id));
    try {
      if (status === 'confirmed') {
        const booking = inquiries.find(i => i.id === id);
        if (booking && !booking.tableId) {
          const assigned = await autoAssignTable(booking, true);
          if (!assigned) {
            showToast('No tables available — studio may be full', 'error');
            return;
          }
          showToast(`Table ${assigned} auto-assigned`, 'success');
        }
      }
      await updateBookingStatus(id, status, staff);
      setInquiries(prev => prev.map((i) => (i.id === id ? { ...i, status } : i)));
      showToast(status === 'confirmed' ? 'Booking confirmed' : status === 'cancelled' ? 'Booking cancelled' : 'Booking marked as awaiting', 'success');
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setConfirmingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const filteredInquiries = useMemo(() => inquiries
    .filter((inq) => {
      const statusMatch = filter === 'all' || inq.status === (filter === 'cancelled' ? 'cancelled' : filter);
      const studioMatch = studioFilter === 'all' || inq.studio === studioFilter;
      const searchMatch = debouncedSearchTerm === '' ||
        inq.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        inq.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        inq.phone.includes(debouncedSearchTerm);
      const dateMatch = (!dateRange.start || inq.date >= dateRange.start) && (!dateRange.end || inq.date <= dateRange.end);
      return statusMatch && studioMatch && searchMatch && dateMatch;
    })
    .sort((a, b) => {
      const dir = sort.direction === 'asc' ? 1 : -1;
      if (sort.field === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA === dateB ? a.time.localeCompare(b.time) * dir : (dateA - dateB) * dir;
      }
      if (sort.field === 'name') return a.name.localeCompare(b.name) * dir;
      if (sort.field === 'studio') return a.studio.localeCompare(b.studio) * dir;
      return a.status.localeCompare(b.status) * dir;
    }), [inquiries, filter, studioFilter, debouncedSearchTerm, dateRange, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredInquiries.length / ITEMS_PER_PAGE));
  const paginatedInquiries = filteredInquiries.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getBookingsForDate = (date: Date) => {
    return inquiries.filter((inq) => {
      const bookingDate = parseISO(inq.date);
      const dateMatch = isSameDay(bookingDate, date);
      const studioMatch = studioFilter === 'all' || inq.studio === studioFilter;
      return dateMatch && studioMatch;
    });
  };

  const bookingsForSelectedDate = selectedDate ? getBookingsForDate(selectedDate) : [];

  const stats = {
    total: inquiries.length,
    pending: inquiries.filter((i) => i.status === 'pending').length,
    confirmed: inquiries.filter((i) => i.status === 'confirmed').length,
  };

  const giftCardStats = {
    total: giftCards.length,
    active: giftCards.filter((c) => c.status === 'active').length,
    totalValue: giftCards.reduce((sum, c) => sum + c.amount, 0),
    remainingValue: giftCards.reduce((sum, c) => sum + c.balance, 0),
  };

  const roleLabel: Record<Staff['role'], string> = {
    super_admin: 'Super Admin',
    staff: 'Staff',
  };

  const isSuperAdmin = staff.role === 'super_admin';

  const staffAllowedStudios: ('Putney' | 'Wimbledon')[] | null =
    isSuperAdmin ? null : (staff.allowedStudios && staff.allowedStudios.length > 0 ? staff.allowedStudios : null);

  const canEdit = isSuperAdmin || staff.canEditBookings;
  const canUpdateStatus = isSuperAdmin || staff.canUpdateStatus;
  const canDelete = isSuperAdmin || staff.canDeleteBookings;
  const canAddWalkIn = isSuperAdmin || staff.canAddWalkIns;
  const canManageStaff = isSuperAdmin;

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Studio', 'Date', 'Time', 'Painters', 'Session Type', 'Status', 'Request Date'];
    const csvContent = [
      headers.join(','),
      ...filteredInquiries.map(inq => [
        inq.id,
        inq.name,
        inq.email,
        inq.phone,
        inq.studio,
        inq.date,
        inq.time,
        inq.paintersCount,
        inq.sessionType,
        inq.status,
        inq.requestDate
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleEditBooking = (booking: BookingInquiry) => {
    setEditingBooking(booking);
    setShowEditModal(true);
  };

  const saveBookingEdit = async (updatedBooking: BookingInquiry) => {
    const oldBooking = inquiries.find((i) => i.id === updatedBooking.id);
    const remaining = await getRemainingCapacity(updatedBooking.studio, updatedBooking.date, updatedBooking.time);
    const available = oldBooking ? remaining + oldBooking.paintersCount : remaining;
    if (updatedBooking.paintersCount > available) {
      showToast(`This session only has room for ${available} painter${available === 1 ? '' : 's'} after this edit.`, 'error');
      return;
    }

    try {
      await updateBooking(updatedBooking, staff);
      setInquiries(inquiries.map((i) => i.id === updatedBooking.id ? updatedBooking : i));
      setShowEditModal(false);
      setEditingBooking(null);
      showToast('Booking updated', 'success');
    } catch {
      showToast('Failed to update booking', 'error');
    }
  };

  const saveNewBooking = async () => {
    if (!canAddWalkIn) {
      showToast('You do not have permission to add bookings', 'error');
      return;
    }
    if (!newBooking.name || !newBooking.phone || !newBooking.date || !newBooking.time || !newBooking.studio) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    const booking: BookingInquiry = {
      id: `PP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      studio: newBooking.studio as 'Putney' | 'Wimbledon',
      name: newBooking.name,
      email: newBooking.email,
      phone: newBooking.phone,
      date: newBooking.date,
      time: newBooking.time,
      paintersCount: newBooking.paintersCount || 1,
      sessionType: newBooking.sessionType as any,
      status: 'confirmed',
      source: 'walk-in',
      requestDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      estimatedPrice: (newBooking.paintersCount || 1) * 5.95,
    };

    const remaining = await getRemainingCapacity(booking.studio, booking.date, booking.time);
    if (booking.paintersCount > remaining) {
      showToast(`This session only has room for ${remaining} more painter${remaining === 1 ? '' : 's'}.`, 'error');
      return;
    }

    try {
      await createBooking(booking);
      let finalBooking = booking;
      if (booking.studio === 'Wimbledon') {
        const blocked = JSON.parse(localStorage.getItem('pitter_potter_blocked_tables') || '[]');
        const partyArea = booking.sessionType.includes('party') ? (booking.paintersCount > 8 ? 'party2' : 'party1') : undefined;
        const tableId = findAvailableTable(inquiries, blocked, booking.date, booking.time, partyArea);
        if (tableId) {
          finalBooking = { ...booking, tableId };
          await updateBooking(finalBooking, staff);
        }
      }
      setInquiries([finalBooking, ...inquiries]);
      setShowAddModal(false);
      setNewBooking({
        studio: 'Putney',
        name: '',
        email: '',
        phone: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '10:00',
        paintersCount: 1,
        sessionType: 'painting',
        status: 'confirmed',
      });
      showToast('Booking added', 'success');
    } catch {
      showToast('Failed to add booking', 'error');
    }
  };

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    username: '',
    password: '',
    role: 'staff' as Staff['role'],
    canUpdateStatus: false,
    canEditBookings: false,
    canAddWalkIns: false,
    canDeleteBookings: false,
    allowedStudios: [] as ('Putney' | 'Wimbledon')[],
  });

  const addStaffMember = async () => {
    if (!canManageStaff || !staff?.sessionToken) {
      showToast('Only super admins can manage staff', 'error');
      return;
    }
    if (!newStaff.name || !newStaff.username || !newStaff.password) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    if (newStaff.role === 'staff' && newStaff.allowedStudios.length === 0) {
      showToast('Please select a studio (Putney, Wimbledon, or Both)', 'error');
      return;
    }

    if (isSupabaseEnabled()) {
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/staff-management`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: 'create',
            username: staff.username,
            sessionToken: staff.sessionToken,
            staff: {
              name: newStaff.name,
              username: newStaff.username,
              password: newStaff.password,
              role: newStaff.role,
              canUpdateStatus: newStaff.canUpdateStatus,
              canEditBookings: newStaff.canEditBookings,
              canAddWalkIns: newStaff.canAddWalkIns,
              canDeleteBookings: newStaff.canDeleteBookings,
              allowedStudios: newStaff.role === 'super_admin' ? null : (newStaff.allowedStudios.length > 0 ? newStaff.allowedStudios : null),
            },
          }),
        });
        const data = await response.json();
        if (!response.ok || data.error) {
          console.error('Staff create error:', data.error);
          showToast('Failed to add staff member. Username may already exist.', 'error');
          return;
        }
      } catch (err) {
        console.error('Create staff request failed:', err);
        showToast('Failed to add staff member', 'error');
        return;
      }
    }

    await loadStaffList();
    setNewStaff({
      name: '',
      username: '',
      password: '',
      role: 'staff',
      canUpdateStatus: false,
      canEditBookings: false,
      canAddWalkIns: false,
      canDeleteBookings: false,
      allowedStudios: [],
    });
    setShowStaffModal(false);
  };

  const deleteStaffMember = async (id: string) => {
    if (!canManageStaff) {
      showToast('Only super admins can manage staff', 'error');
      return;
    }
    if (id === staff.id) {
      showToast('You cannot delete your own account', 'error');
      return;
    }
    showConfirmDialog({
      title: 'Remove Staff Member',
      message: 'This will permanently remove this staff member. They will lose all access.',
      confirmLabel: 'Remove',
      variant: 'danger',
      onConfirm: async () => {
        closeConfirmDialog();
        if (isSupabaseEnabled()) {
          try {
            const { error } = await supabase!.from('staff').delete().eq('id', id);
            if (error) console.error('Supabase delete staff error:', error);
          } catch (err) {
            console.error('Supabase delete staff failed:', err);
          }
        }
        await loadStaffList();
      },
    });
    return;

  };

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#1B2D3C] text-white py-3 px-4 sm:px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <span className="font-heading font-black text-sm">PP</span>
            </div>
            <div className="min-w-0">
              <p className="font-heading font-black text-sm leading-tight">Pitter Potter</p>
              <p className="text-[10px] text-white/50 truncate">{staff.name} · {roleLabel[staff.role]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canAddWalkIn && (
              <button
                onClick={() => { setActiveTab('bookings'); setShowAddModal(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> New Booking
              </button>
            )}
            {staff?.sessionExpiresAt && (() => {
              const mins = Math.round((new Date(staff.sessionExpiresAt).getTime() - Date.now()) / 60000);
              if (mins < 60) return (
                <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Session expires in {mins}m
                </span>
              );
              return null;
            })()}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold rounded-lg transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        {/* Admin Tabs */}
        <div className="sticky top-[56px] z-20 bg-white border-b border-[#1B2D3C]/10 mb-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {[
              { value: 'dashboard', label: 'Today', badge: null },
              { value: 'bookings', label: 'Bookings', badge: stats.pending > 0 ? stats.pending : null },
              { value: 'gift-cards', label: 'Gift Vouchers', badge: null },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value as typeof activeTab)}
                className={`relative shrink-0 px-4 py-3 text-xs font-bold tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === tab.value
                    ? 'border-[#1B2D3C] text-[#1B2D3C]'
                    : 'border-transparent text-[#1B2D3C]/50 hover:text-[#1B2D3C]'
                }`}
              >
                {tab.label}
                {tab.badge !== null && tab.badge !== undefined && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-black bg-amber-500 text-white rounded-full">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </button>
            ))}
            {canManageStaff && (
              <>
                <div className="w-px h-5 bg-[#1B2D3C]/10 mx-1 shrink-0" />
                {[
                  { value: 'analytics', label: 'Analytics' },
                  { value: 'settings', label: 'Settings' },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value as typeof activeTab)}
                    className={`relative shrink-0 px-3 py-3 text-xs font-bold tracking-wide border-b-2 transition-all cursor-pointer ${
                      activeTab === tab.value
                        ? 'border-[#1B2D3C] text-[#1B2D3C]'
                        : 'border-transparent text-[#1B2D3C]/40 hover:text-[#1B2D3C]/70'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B2D3C]"></div>
          </div>
        )}

        {!loading && activeTab === 'dashboard' && (
          <DashboardOverview
            bookings={inquiries}
            onAssignTable={(bookingId, tableId) => {
              const booking = inquiries.find(i => i.id === bookingId);
              if (!booking) return;
              const updated = { ...booking, tableId: tableId ?? undefined };
              updateBooking(updated, staff).then(() => {
                setInquiries(inquiries.map(i => i.id === bookingId ? updated : i));
                showToast(tableId ? `Table ${tableId} assigned` : 'Table unassigned', 'success');
              }).catch(() => showToast('Failed to update table', 'error'));
            }}
            onConfirm={(bookingId) => updateStatus(bookingId, 'confirmed')}
            onBulkConfirm={async (ids) => {
              let confirmed = 0;
              let failed = 0;
              for (const id of ids) {
                const booking = inquiries.find(i => i.id === id);
                if (!booking) continue;
                if (!booking.tableId) {
                  const assigned = await autoAssignTable(booking, true);
                  if (!assigned) { failed++; continue; }
                }
                try {
                  await updateBookingStatus(id, 'confirmed', staff);
                  setInquiries(prev => prev.map(i => i.id === id ? { ...i, status: 'confirmed' } : i));
                  confirmed++;
                } catch { failed++; }
              }
              if (confirmed > 0) showToast(`${confirmed} booking${confirmed !== 1 ? 's' : ''} confirmed`, 'success');
              if (failed > 0) showToast(`${failed} could not be confirmed — studio may be full`, 'error');
            }}
            onNavigateToBookings={() => setActiveTab('bookings')}
            onNavigateToAddBooking={() => { setActiveTab('bookings'); setShowAddModal(true); }}
          />
        )}

        {!loading && activeTab === 'bookings' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 sm:p-6 border border-[#1B2D3C]/20 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-stone-500 font-bold uppercase tracking-wider">Total Bookings</p>
                <p className="text-2xl sm:text-3xl font-black text-[#1B2D3C] mt-2">{stats.total}</p>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-[#1B2D3C]" />
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 border border-[#1B2D3C]/20 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-stone-500 font-bold uppercase tracking-wider">Awaiting Confirmation</p>
                <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">{stats.pending}</p>
              </div>
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 border border-[#1B2D3C]/20 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-stone-500 font-bold uppercase tracking-wider">Confirmed</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">{stats.confirmed}</p>
              </div>
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
            </div>
          </div>
        </div>
          </>
        )}

        {activeTab === 'gift-cards' && (
          <div className="bg-white p-6 border border-[#1B2D3C]/20 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] uppercase tracking-wider">Gift Cards</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={exportGiftCardsCSV}
                className="text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C] hover:text-[#486581] underline"
              >
                Export CSV
              </button>
              <button
                onClick={() => loadGiftCards()}
                className="text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C] hover:text-[#486581] underline"
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="bg-[#D6E2E9]/30 p-3 rounded-lg">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]/70">Total Sold</p>
              <p className="text-xl font-black text-[#1B2D3C]">{giftCardStats.total}</p>
            </div>
            <div className="bg-[#D6E2E9]/30 p-3 rounded-lg">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]/70">Active</p>
              <p className="text-xl font-black text-[#1B2D3C]">{giftCardStats.active}</p>
            </div>
            <div className="bg-[#D6E2E9]/30 p-3 rounded-lg">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]/70">Total Value</p>
              <p className="text-xl font-black text-[#1B2D3C]">£{giftCardStats.totalValue.toFixed(2)}</p>
            </div>
            <div className="bg-[#D6E2E9]/30 p-3 rounded-lg">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]/70">Remaining Balance</p>
              <p className="text-xl font-black text-[#1B2D3C]">£{giftCardStats.remainingValue.toFixed(2)}</p>
            </div>
          </div>
          {giftCards.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#1B2D3C]/10">
                    <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-2">Code</th>
                    <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-2">Amount</th>
                    <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-2">Balance</th>
                    <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-2">Recipient</th>
                    <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-2">Sender</th>
                    <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-2">Status</th>
                    <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-2">Purchased</th>
                    <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-2">Expires</th>
                    <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-semibold text-[#1B2D3C]">
                  {giftCards.map((card) => (
                    <tr key={card.id} className="border-b border-[#1B2D3C]/5">
                      <td className="py-2 font-mono">{card.code}</td>
                      <td className="py-2">£{card.amount.toFixed(2)}</td>
                      <td className="py-2">£{card.balance.toFixed(2)}</td>
                      <td className="py-2">{card.recipientName}</td>
                      <td className="py-2">{card.senderName}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          card.status === 'active' ? 'bg-emerald-100 text-emerald-700' : card.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-500'
                        }`}>
                          {card.status}
                        </span>
                      </td>
                      <td className="py-2">{card.purchaseDate}</td>
                      <td className="py-2">{card.expiryDate || '-'}</td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(card.code);
                              showToast('Gift card code copied', 'success');
                            }}
                            className="px-2 py-1 bg-[#D6E2E9]/50 text-[#1B2D3C] text-[10px] font-bold uppercase tracking-wider rounded hover:bg-[#D6E2E9] cursor-pointer"
                          >
                            Copy
                          </button>
                          {staff.role === 'super_admin' && card.status === 'active' && (
                            <button
                              onClick={() => updateGiftCardStatus(card.id, 'expired')}
                              className="px-2 py-1 bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded hover:bg-red-100 cursor-pointer"
                            >
                              Expire
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <Gift className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p className="text-sm text-stone-500 font-semibold">No gift cards sold yet</p>
              <p className="text-xs text-stone-400 mt-1">Gift cards will appear here once purchased</p>
            </div>
          )}
        </div>
        )}

        {activeTab === 'bookings' && (
          <>
        {/* Bookings toolbar — all filters in one row */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <input
              type="text"
              placeholder="Search name, email or phone…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-8 py-2 border border-[#1B2D3C]/20 text-xs text-[#1B2D3C] font-semibold rounded-lg focus:outline-none focus:border-[#1B2D3C]/40 bg-white"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#1B2D3C]/30 hover:text-[#1B2D3C] cursor-pointer">×</button>
            )}
          </div>
          {/* Status filter */}
          <div className="flex rounded-lg border border-[#1B2D3C]/20 overflow-hidden">
            {([['all','All'],['pending','Awaiting'],['confirmed','Confirmed'],['cancelled','Cancelled']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val as any)}
                className={`px-3 py-2 text-[10px] font-bold transition-all cursor-pointer ${
                  filter === val ? 'bg-[#1B2D3C] text-white' : 'bg-white text-[#1B2D3C]/60 hover:text-[#1B2D3C]'
                }`}>{label}</button>
            ))}
          </div>
          {/* Studio filter */}
          <div className="flex rounded-lg border border-[#1B2D3C]/20 overflow-hidden">
            {([['all','All Studios'],['Putney','Putney'],['Wimbledon','Wimbledon']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setStudioFilter(val as any)}
                className={`px-3 py-2 text-[10px] font-bold transition-all cursor-pointer ${
                  studioFilter === val ? 'bg-[#1B2D3C] text-white' : 'bg-white text-[#1B2D3C]/60 hover:text-[#1B2D3C]'
                }`}>{label}</button>
            ))}
          </div>
          {/* Date range */}
          <input type="date" value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-2 py-2 border border-[#1B2D3C]/20 text-[10px] text-[#1B2D3C] font-semibold rounded-lg focus:outline-none bg-white" aria-label="From date" />
          <span className="text-[#1B2D3C]/30 text-xs">→</span>
          <input type="date" value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-2 py-2 border border-[#1B2D3C]/20 text-[10px] text-[#1B2D3C] font-semibold rounded-lg focus:outline-none bg-white" aria-label="To date" />
          {/* Export */}
          <button onClick={exportToCSV}
            className="ml-auto px-3 py-2 border border-[#1B2D3C]/20 text-[10px] font-bold text-[#1B2D3C] rounded-lg hover:bg-[#DBE7E4] transition-all cursor-pointer">
            Export CSV
          </button>
        </div>


        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-[#1B2D3C] text-white rounded-xl">
            <span className="text-xs font-black">{selectedIds.size} selected</span>
            <div className="flex-1" />
            {canUpdateStatus && (
              <button
                onClick={async () => {
                  const ids = [...selectedIds].filter(id => inquiries.find(i => i.id === id)?.status !== 'confirmed');
                  for (const id of ids) await updateStatus(id, 'confirmed');
                  setSelectedIds(new Set());
                }}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Confirm All
              </button>
            )}
            <button
              onClick={() => {
                const rows = filteredInquiries.filter(i => selectedIds.has(i.id));
                const csv = ['Date,Time,Studio,Name,Email,Phone,Painters,Session,Status,Table',
                  ...rows.map(i => [i.date,i.time,i.studio,i.name,i.email,i.phone,i.paintersCount,i.sessionType,i.status,i.tableId||''].join(','))
                ].join('\n');
                const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='bookings-selection.csv'; a.click();
              }}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer"
            >
              Export CSV
            </button>
            {canDelete && (
              <button
                onClick={() => {
                  const count = selectedIds.size;
                  showConfirmDialog({
                    title: `Delete ${count} booking${count !== 1 ? 's' : ''}?`,
                    message: `This will permanently delete ${count} booking${count !== 1 ? 's' : ''}. This cannot be undone.`,
                    confirmLabel: `Delete ${count}`,
                    variant: 'danger',
                    onConfirm: async () => {
                      const ids = [...selectedIds];
                      for (const id of ids) {
                        try {
                          await deleteBooking(id, staff);
                        } catch { /* continue */ }
                      }
                      setInquiries(prev => prev.filter(i => !selectedIds.has(i.id)));
                      setSelectedIds(new Set());
                      showToast(`${ids.length} booking${ids.length !== 1 ? 's' : ''} deleted`, 'success');
                    },
                  });
                }}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}
            <button onClick={() => setSelectedIds(new Set())} className="text-white/60 hover:text-white text-xs cursor-pointer">✕ Clear</button>
          </div>
        )}

        {/* Bookings count */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-[#1B2D3C]/50">
            {filteredInquiries.length} booking{filteredInquiries.length !== 1 ? 's' : ''}
            {filter !== 'all' || studioFilter !== 'all' || searchTerm || dateRange.start ? ' (filtered)' : ''}
          </p>
        </div>
        <div className="bg-white border border-[#1B2D3C]/20 shadow-sm overflow-hidden rounded-xl">
          {filteredInquiries.length === 0 ? (
            <div className="p-10 sm:p-14 text-center">
              <Inbox className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p className="text-sm text-stone-500 font-semibold">No bookings found</p>
              <p className="text-xs text-stone-400 mt-1">Adjust your filters or add a new booking</p>
            </div>
          ) : (
            <>
              {/* ── Mobile cards (< md) ── */}
              <div className="md:hidden divide-y divide-[#1B2D3C]/10">
                {paginatedInquiries.map((inq) => (
                  <div key={inq.id} className={`p-4 space-y-2.5 transition-colors ${selectedIds.has(inq.id) ? 'bg-[#D6E2E9]/30' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input type="checkbox" checked={selectedIds.has(inq.id)}
                          onChange={e => setSelectedIds(prev => { const s = new Set(prev); e.target.checked ? s.add(inq.id) : s.delete(inq.id); return s; })}
                          className="w-4 h-4 accent-[#1B2D3C] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-black text-[#1B2D3C] truncate">{inq.name}</p>
                          <p className="text-[11px] text-[#1B2D3C]/50 font-semibold">{inq.phone}</p>
                        </div>
                      </label>
                      <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${
                        inq.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inq.status === 'confirmed' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {inq.status === 'confirmed' ? 'Confirmed' : 'Awaiting'}
                      </span>
                    </div>
                    <div className="flex gap-3 text-[11px] text-[#1B2D3C]/70 font-semibold">
                      <span className="font-black text-[#1B2D3C]">{inq.studio}</span>
                      <span>{inq.date}</span>
                      <span>{inq.time}</span>
                      <span>{inq.paintersCount}p</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => setAssignModalBooking(inq)}
                        className={`px-2.5 py-1 text-[10px] font-bold border rounded-lg transition-all cursor-pointer ${
                          inq.tableId ? 'bg-[#1B2D3C] text-white border-[#1B2D3C]' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                        {inq.tableId ? `Table ${inq.tableId}` : 'Assign Table'}
                      </button>
                      {canUpdateStatus && inq.status !== 'confirmed' && inq.status !== 'cancelled' && (
                        <button onClick={() => updateStatus(inq.id, 'confirmed')}
                          disabled={confirmingIds.has(inq.id)}
                          className="px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 disabled:opacity-60 bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700">
                          {confirmingIds.has(inq.id) ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <><CheckCircle className="w-3 h-3" /> Confirm</>}
                        </button>
                      )}
                      {canUpdateStatus && inq.status === 'confirmed' && (
                        <button onClick={() => updateStatus(inq.id, 'pending')}
                          disabled={confirmingIds.has(inq.id)}
                          className="px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 disabled:opacity-60 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
                          <XCircle className="w-3 h-3" /> Unconfirm
                        </button>
                      )}
                      {canUpdateStatus && inq.status !== 'cancelled' && (
                        <button onClick={() => updateStatus(inq.id, 'cancelled')}
                          className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Cancel
                        </button>
                      )}
                      {canEdit && (
                        <button onClick={() => handleEditBooking(inq)}
                          className="p-1.5 hover:bg-[#D6E2E9] border border-[#1B2D3C]/20 rounded-lg transition-all cursor-pointer">
                          <svg className="w-3.5 h-3.5 text-[#1B2D3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => deleteInquiry(inq.id)}
                          className="p-1.5 hover:bg-red-50 border border-[#1B2D3C]/20 rounded-lg transition-all cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Desktop table (>= md) ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-[#D6E2E9] border-b border-[#1B2D3C]/20">
                    <tr>
                      <th className="px-4 py-3">
                        <input type="checkbox"
                          checked={paginatedInquiries.length > 0 && paginatedInquiries.every(i => selectedIds.has(i.id))}
                          onChange={e => {
                            if (e.target.checked) setSelectedIds(prev => new Set([...prev, ...paginatedInquiries.map(i => i.id)]));
                            else setSelectedIds(prev => { const s = new Set(prev); paginatedInquiries.forEach(i => s.delete(i.id)); return s; });
                          }}
                          className="w-4 h-4 accent-[#1B2D3C] cursor-pointer" />
                      </th>
                      <SortHeader field="date" label="Date" sort={sort} setSort={setSort} />
                      <SortHeader field="name" label="Guest" sort={sort} setSort={setSort} />
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C] hidden lg:table-cell">Session</th>
                      <SortHeader field="status" label="Status" sort={sort} setSort={setSort} />
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]">Table</th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedInquiries.map((inq) => (
                      <tr key={inq.id} className={`border-b border-[#1B2D3C]/10 transition-colors ${
                        selectedIds.has(inq.id) ? 'bg-[#D6E2E9]/30' : 'hover:bg-stone-50'
                      }`}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selectedIds.has(inq.id)}
                            onChange={e => setSelectedIds(prev => { const s = new Set(prev); e.target.checked ? s.add(inq.id) : s.delete(inq.id); return s; })}
                            className="w-4 h-4 accent-[#1B2D3C] cursor-pointer" />
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-black text-[#1B2D3C]">{inq.date}</p>
                          <p className="text-[10px] text-[#1B2D3C]/50 font-semibold">{inq.time} · {inq.studio}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-black text-[#1B2D3C]">{inq.name}</p>
                          <p className="text-[10px] text-[#1B2D3C]/50 font-semibold hidden lg:block">{inq.email}</p>
                          <p className="text-[10px] text-[#1B2D3C]/40 font-semibold">{inq.phone} · {inq.paintersCount}p</p>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${SESSION_BADGE[inq.sessionType] ?? 'bg-gray-100 text-gray-600'}`}>
                            {SESSION_LABELS[inq.sessionType] ?? inq.sessionType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${
                            inq.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inq.status === 'cancelled'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inq.status === 'confirmed' ? <CheckCircle className="w-3 h-3" /> : inq.status === 'cancelled' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {inq.status === 'confirmed' ? 'Confirmed' : inq.status === 'cancelled' ? 'Cancelled' : 'Awaiting'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => setAssignModalBooking(inq)}
                            className={`px-2 py-1 text-[10px] font-bold border transition-all cursor-pointer rounded-lg ${
                              inq.tableId ? 'bg-[#1B2D3C] text-white border-[#1B2D3C] hover:bg-[#486581]' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            }`}>
                            {inq.tableId ?? 'Assign'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button onClick={() => { navigator.clipboard.writeText(inq.id); showToast('Booking reference copied', 'success'); }}
                              className="p-1.5 hover:bg-[#D6E2E9] border border-[#1B2D3C]/20 rounded-lg transition-all cursor-pointer" title="Copy reference">
                              <Copy className="w-3.5 h-3.5 text-[#1B2D3C]" />
                            </button>
                            {canEdit && (
                              <button onClick={() => handleEditBooking(inq)}
                                className="p-1.5 hover:bg-[#D6E2E9] border border-[#1B2D3C]/20 rounded-lg transition-all cursor-pointer" title="Edit booking">
                                <svg className="w-3.5 h-3.5 text-[#1B2D3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                            )}
                            {canUpdateStatus && inq.status !== 'confirmed' && inq.status !== 'cancelled' && (
                              <button onClick={() => updateStatus(inq.id, 'confirmed')}
                                disabled={confirmingIds.has(inq.id)}
                                className="px-2 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 disabled:opacity-60 bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700">
                                {confirmingIds.has(inq.id) ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" /> : <><CheckCircle className="w-3 h-3" /> Confirm</>}
                              </button>
                            )}
                            {canUpdateStatus && inq.status === 'confirmed' && (
                              <button onClick={() => updateStatus(inq.id, 'pending')}
                                disabled={confirmingIds.has(inq.id)}
                                className="px-2 py-1 text-[10px] font-bold rounded-lg border bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 transition-all cursor-pointer flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Unconfirm
                              </button>
                            )}
                            {canUpdateStatus && inq.status !== 'cancelled' && (
                              <button onClick={() => updateStatus(inq.id, 'cancelled')}
                                className="px-2 py-1 text-[10px] font-bold rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Cancel
                              </button>
                            )}
                            {canDelete && (
                              <button onClick={() => deleteInquiry(inq.id)}
                                className="p-1.5 hover:bg-red-50 border border-[#1B2D3C]/20 rounded-lg transition-all cursor-pointer" title="Delete booking">
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {filteredInquiries.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#1B2D3C]/10 bg-white">
              <span className="text-xs font-semibold text-[#1B2D3C]/70">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredInquiries.length)} of {filteredInquiries.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-xs font-bold uppercase tracking-wider border border-[#1B2D3C]/20 rounded hover:bg-[#D6E2E9] disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs font-bold text-[#1B2D3C]">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-xs font-bold uppercase tracking-wider border border-[#1B2D3C]/20 rounded hover:bg-[#D6E2E9] disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

          </>
        )}

        {/* Settings tab — Staff + Capacity + Stripe + Content */}
        {activeTab === 'settings' && canManageStaff && (
          <div className="bg-white p-6 border border-[#1B2D3C]/20 shadow-sm mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-black text-[#1B2D3C] uppercase tracking-wider">Staff Management</h2>
              <button
                onClick={() => { setShowStaffModal(true); loadStaffList(); }}
                className="px-4 py-2 bg-[#DBE7E4] text-[#1B2D3C] font-bold text-xs uppercase tracking-wider border border-[#1B2D3C]/20 hover:bg-[#D6E2E9] transition-all cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Staff
              </button>
            </div>
            {staffList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#1B2D3C]/10">
                      <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-2">Name</th>
                      <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-2">Username</th>
                      <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-2">Role</th>
                      <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-2">Studios</th>
                      <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-semibold text-[#1B2D3C]">
                    {staffList.map((member) => (
                      <tr key={member.id} className="border-b border-[#1B2D3C]/5">
                        <td className="py-2">{member.name}</td>
                        <td className="py-2">{member.username}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            member.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-stone-100 text-stone-600'
                          }`}>
                            {roleLabel[member.role]}
                          </span>
                        </td>
                        <td className="py-2">
                          {member.role === 'super_admin' ? (
                            <span className="text-[10px] text-purple-600 font-bold">All</span>
                          ) : member.allowedStudios && member.allowedStudios.length > 0 ? (
                            <div className="flex gap-1">
                              {member.allowedStudios.map(s => (
                                <span key={s} className="px-1.5 py-0.5 bg-[#DBE7E4] text-[#1B2D3C] text-[9px] font-bold rounded">{s}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-[#1B2D3C]/50 font-semibold">All</span>
                          )}
                        </td>
                        <td className="py-2">
                          <button
                            onClick={() => deleteStaffMember(member.id)}
                            disabled={member.id === staff.id}
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              member.id === staff.id ? 'text-stone-400 cursor-not-allowed' : 'text-red-600 hover:text-red-700 underline'
                            }`}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-stone-500 font-medium">No staff members loaded.</p>
            )}
          </div>
        )}
      </div>

      {/* Add Booking Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 border border-[#1B2D3C]/20 max-w-md w-full space-y-4 shadow-lg max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading text-xl font-black text-[#1B2D3C]">Add Booking</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Studio *</label>
                <select
                  value={newBooking.studio}
                  onChange={(e) => setNewBooking({ ...newBooking, studio: e.target.value as 'Putney' | 'Wimbledon' })}
                  className="w-full px-3 py-2 border border-[#1B2D3C]/20 text-xs text-[#1B2D3C] font-bold rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20"
                >
                  <option value="Putney">Putney</option>
                  <option value="Wimbledon">Wimbledon</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Name *</label>
                <input
                  type="text"
                  value={newBooking.name}
                  onChange={(e) => setNewBooking({ ...newBooking, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#1B2D3C]/20 text-xs text-[#1B2D3C] font-bold rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Email</label>
                <input
                  type="email"
                  value={newBooking.email}
                  onChange={(e) => setNewBooking({ ...newBooking, email: e.target.value })}
                  className="w-full px-3 py-2 border border-[#1B2D3C]/20 text-xs text-[#1B2D3C] font-bold rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Phone *</label>
                <input
                  type="tel"
                  value={newBooking.phone}
                  onChange={(e) => setNewBooking({ ...newBooking, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-[#1B2D3C]/20 text-xs text-[#1B2D3C] font-bold rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Date *</label>
                <input
                  type="date"
                  value={newBooking.date}
                  onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                  className="w-full px-3 py-2 border border-[#1B2D3C]/20 text-xs text-[#1B2D3C] font-bold rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Time *</label>
                <select
                  value={newBooking.time}
                  onChange={(e) => setNewBooking({ ...newBooking, time: e.target.value })}
                  className="w-full px-3 py-2 border border-[#1B2D3C]/20 text-xs text-[#1B2D3C] font-bold rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20"
                >
                  <option value="10:00">10:00 am</option>
                  <option value="12:00">12:00 pm</option>
                  <option value="14:00">2:00 pm</option>
                  <option value="16:00">4:00 pm</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Painters *</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={newBooking.paintersCount}
                  onChange={(e) => setNewBooking({ ...newBooking, paintersCount: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-[#1B2D3C]/20 text-xs text-[#1B2D3C] font-bold rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20"
                />
              </div>
              {newBooking.date && newBooking.time && (
                <div className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
                  capacityLoading ? 'bg-[#D6E2E9]/30 text-[#1B2D3C]/60' :
                  newBookingCapacity !== null && newBookingCapacity <= 0 ? 'bg-red-50 text-red-700 border border-red-200' :
                  newBookingCapacity !== null && newBookingCapacity <= 5 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  <Users className="w-3.5 h-3.5" />
                  {capacityLoading ? 'Checking capacity...' :
                   newBookingCapacity !== null ? `${newBookingCapacity} spots remaining` : 'Unable to check capacity'}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-[#FFFFFF] text-[#1B2D3C] font-bold text-xs uppercase tracking-wider border border-[#1B2D3C]/20 hover:bg-[#D6E2E9] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={saveNewBooking}
                className="flex-1 px-4 py-2 bg-[#DBE7E4] text-[#1B2D3C] font-bold text-xs uppercase tracking-wider border border-[#1B2D3C]/20 hover:bg-[#D6E2E9] transition-all cursor-pointer"
              >
                Add Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {showEditModal && editingBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 border border-[#1B2D3C]/20 max-w-md w-full space-y-4 shadow-lg">
            <h3 className="font-heading text-xl font-black text-[#1B2D3C]">Edit Booking</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Name</label>
                <input
                  type="text"
                  value={editingBooking.name}
                  onChange={(e) => setEditingBooking({ ...editingBooking, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#1B2D3C]/20 text-xs text-[#1B2D3C] font-bold rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Email</label>
                <input
                  type="email"
                  value={editingBooking.email}
                  onChange={(e) => setEditingBooking({ ...editingBooking, email: e.target.value })}
                  className="w-full px-3 py-2 border border-[#1B2D3C]/20 text-xs text-[#1B2D3C] font-bold rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Phone</label>
                <input
                  type="tel"
                  value={editingBooking.phone}
                  onChange={(e) => setEditingBooking({ ...editingBooking, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-[#1B2D3C]/20 text-xs text-[#1B2D3C] font-bold rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Date</label>
                <input
                  type="date"
                  value={editingBooking.date}
                  onChange={(e) => setEditingBooking({ ...editingBooking, date: e.target.value })}
                  className="w-full px-3 py-2 border border-[#1B2D3C]/20 text-xs text-[#1B2D3C] font-bold rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Time</label>
                <select
                  value={editingBooking.time}
                  onChange={(e) => setEditingBooking({ ...editingBooking, time: e.target.value })}
                  className="w-full px-3 py-2 border border-[#1B2D3C]/20 text-xs text-[#1B2D3C] font-bold rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20"
                >
                  <option value="10:00">10:00 am</option>
                  <option value="12:00">12:00 pm</option>
                  <option value="14:00">2:00 pm</option>
                  <option value="16:00">4:00 pm</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Painters</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={editingBooking.paintersCount}
                  onChange={(e) => setEditingBooking({ ...editingBooking, paintersCount: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-[#1B2D3C]/20 text-xs text-[#1B2D3C] font-bold rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20"
                />
              </div>
              {editingBooking.date && editingBooking.time && (
                <div className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
                  capacityLoading ? 'bg-[#D6E2E9]/30 text-[#1B2D3C]/60' :
                  editBookingCapacity !== null && editBookingCapacity <= 0 ? 'bg-red-50 text-red-700 border border-red-200' :
                  editBookingCapacity !== null && editBookingCapacity <= 5 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  <Users className="w-3.5 h-3.5" />
                  {capacityLoading ? 'Checking capacity...' :
                   editBookingCapacity !== null ? `${editBookingCapacity} spots remaining` : 'Unable to check capacity'}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 bg-[#FFFFFF] text-[#1B2D3C] font-bold text-xs uppercase tracking-wider border border-[#1B2D3C]/20 hover:bg-[#D6E2E9] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => saveBookingEdit(editingBooking)}
                className="flex-1 px-4 py-2 bg-[#DBE7E4] text-[#1B2D3C] font-bold text-xs uppercase tracking-wider border border-[#1B2D3C]/20 hover:bg-[#D6E2E9] transition-all cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Table Modal */}
      {assignModalBooking && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#1B2D3C]/20 max-w-lg w-full shadow-xl rounded-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-[#1B2D3C]/10 flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-black text-[#1B2D3C]">Assign Table</h3>
                <p className="text-[10px] text-[#1B2D3C]/60 font-semibold mt-0.5">
                  {assignModalBooking.name} · {assignModalBooking.date} · {assignModalBooking.time}
                </p>
              </div>
              <button onClick={() => setAssignModalBooking(null)} className="text-[#1B2D3C]/40 hover:text-[#1B2D3C] text-xl font-bold cursor-pointer">✕</button>
            </div>
            <div className="overflow-y-auto p-4 flex-1">
              {assignModalBooking.tableId && (
                <div className="mb-3 flex items-center justify-between bg-[#1B2D3C] text-white px-4 py-2 rounded-lg text-xs font-bold">
                  <span>Currently assigned: {assignModalBooking.tableId}</span>
                  <button
                    onClick={() => updateBookingTable(assignModalBooking.id, null)}
                    className="underline text-white/80 hover:text-white cursor-pointer"
                  >
                    Unassign
                  </button>
                </div>
              )}
              {assignModalBooking.studio === 'Wimbledon' ? (
                <WimbledonFloorPlan
                  bookings={inquiries}
                  selectedDate={assignModalBooking.date}
                  selectedTime={assignModalBooking.time}
                  highlightTableId={assignModalBooking.tableId}
                  onAssign={(tableId) => updateBookingTable(assignModalBooking.id, tableId)}
                />
              ) : (
                <PutneyFloorPlan
                  bookings={inquiries}
                  selectedDate={assignModalBooking.date}
                  selectedTime={assignModalBooking.time}
                  highlightTableId={assignModalBooking.tableId}
                  onAssign={(tableId) => updateBookingTable(assignModalBooking.id, tableId)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 border border-[#1B2D3C]/20 max-w-md w-full space-y-4 shadow-lg">
            <h3 className="font-heading text-xl font-black text-[#1B2D3C]">Add Staff Member</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Name *</label>
                <input
                  type="text"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#1B2D3C]/20 text-xs text-[#1B2D3C] font-bold rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Username *</label>
                <input
                  type="text"
                  value={newStaff.username}
                  onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                  className="w-full px-3 py-2 border border-[#1B2D3C]/20 text-xs text-[#1B2D3C] font-bold rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Password *</label>
                <input
                  type="password"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  className="w-full px-3 py-2 border border-[#1B2D3C]/20 text-xs text-[#1B2D3C] font-bold rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Role *</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => {
                    const role = e.target.value as Staff['role'];
                    if (role === 'super_admin') {
                      setNewStaff({
                        ...newStaff,
                        role,
                        canUpdateStatus: true,
                        canEditBookings: true,
                        canAddWalkIns: true,
                        canDeleteBookings: true,
                      });
                    } else {
                      setNewStaff({ ...newStaff, role });
                    }
                  }}
                  className="w-full px-3 py-2 border border-[#1B2D3C]/20 text-xs text-[#1B2D3C] font-bold rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20"
                >
                  <option value="staff">Staff</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              {newStaff.role === 'staff' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider">Studio Access *</label>
                    <div className="flex rounded-lg border border-[#1B2D3C]/20 overflow-hidden">
                      {([
                        { label: 'Putney', value: ['Putney'] as ('Putney' | 'Wimbledon')[] },
                        { label: 'Wimbledon', value: ['Wimbledon'] as ('Putney' | 'Wimbledon')[] },
                        { label: 'Both', value: ['Putney', 'Wimbledon'] as ('Putney' | 'Wimbledon')[] },
                      ]).map(opt => {
                        const isSelected = opt.value.length === newStaff.allowedStudios.length &&
                          opt.value.every(v => newStaff.allowedStudios.includes(v));
                        return (
                          <button key={opt.label} type="button"
                            onClick={() => setNewStaff({ ...newStaff, allowedStudios: opt.value })}
                            className={`flex-1 py-2 text-xs font-bold transition-all cursor-pointer ${
                              isSelected ? 'bg-[#1B2D3C] text-white' : 'bg-white text-[#1B2D3C]/60 hover:text-[#1B2D3C]'
                            }`}>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider">Permissions</label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#1B2D3C] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newStaff.canUpdateStatus}
                      onChange={(e) => setNewStaff({ ...newStaff, canUpdateStatus: e.target.checked })}
                      className="w-4 h-4 accent-[#1B2D3C]"
                    />
                    Update booking status
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#1B2D3C] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newStaff.canEditBookings}
                      onChange={(e) => setNewStaff({ ...newStaff, canEditBookings: e.target.checked })}
                      className="w-4 h-4 accent-[#1B2D3C]"
                    />
                    Edit bookings
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#1B2D3C] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newStaff.canAddWalkIns}
                      onChange={(e) => setNewStaff({ ...newStaff, canAddWalkIns: e.target.checked })}
                      className="w-4 h-4 accent-[#1B2D3C]"
                    />
                    Add bookings
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#1B2D3C] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newStaff.canDeleteBookings}
                      onChange={(e) => setNewStaff({ ...newStaff, canDeleteBookings: e.target.checked })}
                      className="w-4 h-4 accent-[#1B2D3C]"
                    />
                    Delete bookings
                  </label>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowStaffModal(false)}
                className="flex-1 px-4 py-2 bg-[#FFFFFF] text-[#1B2D3C] font-bold text-xs uppercase tracking-wider border border-[#1B2D3C]/20 hover:bg-[#D6E2E9] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={addStaffMember}
                className="flex-1 px-4 py-2 bg-[#DBE7E4] text-[#1B2D3C] font-bold text-xs uppercase tracking-wider border border-[#1B2D3C]/20 hover:bg-[#D6E2E9] transition-all cursor-pointer"
              >
                Add Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Capacity section — inside settings tab */}
      {activeTab === 'settings' && canManageStaff && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-8 space-y-6">
          {/* Capacity */}
          <div className="bg-white border border-[#1B2D3C]/10 p-6 rounded-xl space-y-4">
            <div>
              <h2 className="font-heading text-lg font-black text-[#1B2D3C]">Capacity</h2>
              <p className="text-xs text-[#1B2D3C]/70 mt-1">Maximum painters per studio and session type.</p>
            </div>
            {capacityRows.length === 0 ? (
              <p className="text-xs text-stone-500">Loading capacity settings…</p>
            ) : (
              <div className="space-y-3">
                {capacityRows.map((row, index) => (
                  <div key={`${row.studio}-${row.session_type}`} className="flex items-center gap-4 p-4 bg-[#DBE7E4]/30 rounded-lg">
                    <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase text-[#1B2D3C]/50">Studio</p>
                      <p className="text-sm font-bold text-[#1B2D3C]">{row.studio}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase text-[#1B2D3C]/50">Session Type</p>
                      <p className="text-sm font-bold text-[#1B2D3C]">{row.session_type}</p>
                    </div>
                    <div className="w-28">
                      <p className="text-[10px] font-bold uppercase text-[#1B2D3C]/50">Max Painters</p>
                      <input
                        type="number"
                        min={1}
                        value={row.max_painters}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10);
                          const updated = [...capacityRows];
                          updated[index] = { ...row, max_painters: Number.isNaN(value) ? row.max_painters : value };
                          setCapacityRows(updated);
                        }}
                        className="w-full px-2 py-1 border-2 border-[#1B2D3C] bg-white text-[#1B2D3C] text-sm font-bold focus:outline-none mt-0.5"
                      />
                    </div>
                    <button
                      onClick={() => updateCapacity(capacityRows[index])}
                      disabled={capacitySaving}
                      className="px-4 py-2 bg-[#1B2D3C] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1B2D3C]/90 disabled:opacity-50 cursor-pointer rounded-lg"
                    >
                      Save
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stripe Mode */}
          <div className="bg-white border border-[#1B2D3C]/10 p-6 rounded-xl space-y-4 max-w-xl">
            <div>
              <h2 className="font-heading text-lg font-black text-[#1B2D3C]">Stripe Mode</h2>
              <p className="text-xs text-[#1B2D3C]/70 mt-1">Switch between sandbox (test) and live payments.</p>
            </div>
            <div className="flex rounded-lg border border-[#1B2D3C]/20 overflow-hidden">
              {(['sandbox', 'live'] as const).map(mode => (
                <button key={mode} onClick={() => updateStripeMode(mode)}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    stripeMode === mode ? 'bg-[#1B2D3C] text-white' : 'bg-white text-[#1B2D3C]/60 hover:text-[#1B2D3C]'
                  }`}>
                  {mode}
                </button>
              ))}
            </div>
            <div className={`p-3 rounded-lg text-xs font-bold ${stripeMode === 'live' ? 'bg-red-50 text-red-700' : 'bg-[#DBE7E4]/30 text-[#1B2D3C]'}`}>
              {stripeMode === 'live'
                ? 'Live mode active — real payments will be processed.'
                : 'Sandbox mode active — use test card details.'}
            </div>
          </div>

        </div>
      )}

      {activeTab === 'analytics' && canManageStaff && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-8">
          <div>
            <h2 className="font-heading text-xl font-black text-[#1B2D3C]">Analytics Dashboard</h2>
            <p className="text-xs text-[#1B2D3C]/70 mt-1">Overview of bookings, gift card revenue, and popular dates.</p>
          </div>

          {(() => {
            const bookingStats = getBookingAnalytics();
            const giftCardStats = getGiftCardAnalytics();
            const maxMonthly = Math.max(...bookingStats.bookingsByMonth.map((d) => d.count), 1);
            const maxPopular = Math.max(...bookingStats.popularDates.map((d) => d.count), 1);
            const maxStudio = Math.max(...Object.values(bookingStats.studioCounts), 1);

            return (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 sm:p-6 border border-[#1B2D3C]/20 shadow-sm">
                    <p className="text-[10px] sm:text-xs text-stone-500 font-bold uppercase tracking-wider">Total Bookings</p>
                    <p className="font-heading text-3xl font-black text-[#1B2D3C] mt-2">{bookingStats.total}</p>
                  </div>
                  <div className="bg-white p-4 sm:p-6 border border-[#1B2D3C]/20 shadow-sm">
                    <p className="text-[10px] sm:text-xs text-stone-500 font-bold uppercase tracking-wider">Confirmed</p>
                    <p className="font-heading text-3xl font-black text-[#1B2D3C] mt-2">{bookingStats.confirmed}</p>
                    <p className="text-xs text-stone-500 mt-1">{bookingStats.pending} pending</p>
                  </div>
                  <div className="bg-white p-4 sm:p-6 border border-[#1B2D3C]/20 shadow-sm">
                    <p className="text-[10px] sm:text-xs text-stone-500 font-bold uppercase tracking-wider">Gift Card Revenue</p>
                    <p className="font-heading text-3xl font-black text-[#1B2D3C] mt-2">£{giftCardStats.totalRevenue.toFixed(2)}</p>
                    <p className="text-xs text-stone-500 mt-1">{giftCardStats.total} sold</p>
                  </div>
                  <div className="bg-white p-4 sm:p-6 border border-[#1B2D3C]/20 shadow-sm">
                    <p className="text-[10px] sm:text-xs text-stone-500 font-bold uppercase tracking-wider">Active Gift Balance</p>
                    <p className="font-heading text-3xl font-black text-[#1B2D3C] mt-2">£{giftCardStats.activeBalance.toFixed(2)}</p>
                    <p className="text-xs text-stone-500 mt-1">{giftCardStats.active} active</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Booking Trends */}
                  <div className="bg-white border border-[#1B2D3C]/10 p-6 rounded-xl space-y-4">
                    <h3 className="font-heading text-lg font-black text-[#1B2D3C]">Bookings by Month</h3>
                    {bookingStats.bookingsByMonth.length === 0 ? (
                      <p className="text-xs text-stone-500">No booking data yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {bookingStats.bookingsByMonth.map(({ month, count }) => (
                          <div key={month} className="flex items-center gap-3">
                            <span className="text-xs font-bold text-[#1B2D3C] w-20 shrink-0">{month}</span>
                            <div className="flex-1 h-4 bg-[#D6E2E9]/30 rounded overflow-hidden">
                              <div
                                className="h-full bg-[#DBE7E4] rounded"
                                style={{ width: `${(count / maxMonthly) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-[#1B2D3C] w-8 text-right">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Popular Dates */}
                  <div className="bg-white border border-[#1B2D3C]/10 p-6 rounded-xl space-y-4">
                    <h3 className="font-heading text-lg font-black text-[#1B2D3C]">Most Popular Dates</h3>
                    {bookingStats.popularDates.length === 0 ? (
                      <p className="text-xs text-stone-500">No booking data yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {bookingStats.popularDates.map(({ date, count }) => (
                          <div key={date} className="flex items-center gap-3">
                            <span className="text-xs font-bold text-[#1B2D3C] w-28 shrink-0">{format(parseISO(date), 'dd MMM yyyy')}</span>
                            <div className="flex-1 h-4 bg-[#D6E2E9]/30 rounded overflow-hidden">
                              <div
                                className="h-full bg-[#FFF1E6] rounded"
                                style={{ width: `${(count / maxPopular) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-[#1B2D3C] w-8 text-right">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Studio Breakdown */}
                  <div className="bg-white border border-[#1B2D3C]/10 p-6 rounded-xl space-y-4">
                    <h3 className="font-heading text-lg font-black text-[#1B2D3C]">Bookings by Studio</h3>
                    {Object.keys(bookingStats.studioCounts).length === 0 ? (
                      <p className="text-xs text-stone-500">No studio data yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(bookingStats.studioCounts).map(([studio, count]) => (
                          <div key={studio} className="flex items-center gap-3">
                            <span className="text-xs font-bold text-[#1B2D3C] w-24 shrink-0">{studio}</span>
                            <div className="flex-1 h-4 bg-[#D6E2E9]/30 rounded overflow-hidden">
                              <div
                                className="h-full bg-[#D6E2E9] rounded"
                                style={{ width: `${(count / maxStudio) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-[#1B2D3C] w-8 text-right">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Gift Card Status */}
                  <div className="bg-white border border-[#1B2D3C]/10 p-6 rounded-xl space-y-4">
                    <h3 className="font-heading text-lg font-black text-[#1B2D3C]">Gift Card Status</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-[#DBE7E4]/30 p-4 rounded-lg text-center">
                        <p className="font-heading text-2xl font-black text-[#1B2D3C]">{giftCardStats.active}</p>
                        <p className="text-[10px] font-bold uppercase text-[#1B2D3C]/70 mt-1">Active</p>
                      </div>
                      <div className="bg-[#D6E2E9]/30 p-4 rounded-lg text-center">
                        <p className="font-heading text-2xl font-black text-[#1B2D3C]">{giftCardStats.redeemed}</p>
                        <p className="text-[10px] font-bold uppercase text-[#1B2D3C]/70 mt-1">Redeemed</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg text-center">
                        <p className="font-heading text-2xl font-black text-red-700">{giftCardStats.expired}</p>
                        <p className="text-[10px] font-bold uppercase text-red-700/70 mt-1">Expired</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
      />
    </div>
  );
}
