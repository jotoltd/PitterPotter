import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Users, Mail, Phone, LogOut, Trash2, CheckCircle, XCircle, Plus } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format, isSameDay, parseISO } from 'date-fns';
import { BookingInquiry, GiftCard, Staff } from '../types';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { sha256 } from '../lib/hash';
import { loadBookings, createBooking, updateBooking, updateBookingStatus, deleteBooking, getRemainingCapacity } from '../lib/bookings';
import 'react-day-picker/dist/style.css';

interface AdminDashboardProps {
  staff: Staff;
  onLogout: () => void;
}

export default function AdminDashboardView({ staff, onLogout }: AdminDashboardProps) {
  const [inquiries, setInquiries] = useState<BookingInquiry[]>([]);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [activeTab, setActiveTab] = useState<'bookings' | 'gift-cards' | 'staff' | 'settings' | 'content'>('bookings');
  const [stripeMode, setStripeMode] = useState<'sandbox' | 'live'>('sandbox');
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [studioFilter, setStudioFilter] = useState<'all' | 'Putney' | 'Wimbledon'>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBooking, setEditingBooking] = useState<BookingInquiry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

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
    status: 'confirmed',
  });

  const [newBookingCapacity, setNewBookingCapacity] = useState<number | null>(null);
  const [editBookingCapacity, setEditBookingCapacity] = useState<number | null>(null);
  const [capacityLoading, setCapacityLoading] = useState(false);

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
    loadInquiries();
    loadGiftCards();
    loadStripeMode();
  }, []);

  const loadStripeMode = async () => {
    if (!isSupabaseEnabled()) return;
    try {
      const { data, error } = await supabase!.from('settings').select('value').eq('key', 'stripe_mode').single();
      if (!error && data?.value === 'live') {
        setStripeMode('live');
      }
    } catch (err) {
      console.error('Failed to load stripe mode:', err);
    }
  };

  const updateStripeMode = async (mode: 'sandbox' | 'live') => {
    if (!isSupabaseEnabled()) return;
    try {
      const { error } = await supabase!.from('settings').upsert({ key: 'stripe_mode', value: mode, updated_at: new Date().toISOString() });
      if (error) {
        console.error('Failed to update stripe mode:', error);
        alert('Failed to update Stripe mode');
        return;
      }
      setStripeMode(mode);
    } catch (err) {
      console.error('Failed to update stripe mode:', err);
      alert('Failed to update Stripe mode');
    }
  };

  const loadInquiries = async () => {
    try {
      const bookings = await loadBookings(staff);
      setInquiries(bookings);
    } catch (err) {
      console.error('Failed to load inquiries:', err);
    }
  };

  const loadGiftCards = async () => {
    if (isSupabaseEnabled()) {
      try {
        const { data, error } = await supabase!.from('gift_cards').select('*').order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase gift cards error:', error);
        } else if (data) {
          const mapped: GiftCard[] = data.map((row: any) => ({
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
        console.error('Supabase gift cards request failed:', err);
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

  const updateGiftCardStatus = async (id: string, status: 'active' | 'redeemed' | 'expired') => {
    if (!isSupabaseEnabled() || !staff.sessionToken) {
      alert('Gift card update unavailable');
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
    } catch (err) {
      console.error('Failed to update gift card status:', err);
      alert('Failed to update gift card status');
    }
  };

  const loadStaffList = async () => {
    if (!canManageStaff) return;

    if (isSupabaseEnabled()) {
      try {
        const { data, error } = await supabase!.from('staff').select('*').order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase staff error:', error);
        } else if (data) {
          const mapped: Staff[] = data.map((row: any) => ({
            id: row.id,
            name: row.name,
            username: row.username,
            passwordHash: row.password_hash,
            role: row.role,
            canUpdateStatus: !!row.can_update_status,
            canEditBookings: !!row.can_edit_bookings,
            canAddWalkIns: !!row.can_add_walk_ins,
            canDeleteBookings: !!row.can_delete_bookings,
            createdAt: row.created_at,
          }));
          setStaffList(mapped);
          return;
        }
      } catch (err) {
        console.error('Supabase staff request failed:', err);
      }
    }
  };

  const deleteInquiry = async (id: string) => {
    try {
      await deleteBooking(id, staff);
      setInquiries(inquiries.filter((i) => i.id !== id));
    } catch {
      alert('Failed to delete booking');
    }
  };

  const updateStatus = async (id: string, status: 'confirmed' | 'pending') => {
    try {
      await updateBookingStatus(id, status, staff);
      setInquiries(inquiries.map((i) => (i.id === id ? { ...i, status } : i)));
    } catch {
      alert('Failed to update status');
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    const statusMatch = filter === 'all' || inq.status === filter;
    const studioMatch = studioFilter === 'all' || inq.studio === studioFilter;
    const searchMatch = searchTerm === '' ||
      inq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.phone.includes(searchTerm);
    return statusMatch && studioMatch && searchMatch;
  });

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
      alert(`This session only has room for ${available} painter${available === 1 ? '' : 's'} after this edit.`);
      return;
    }

    try {
      await updateBooking(updatedBooking, staff);
      setInquiries(inquiries.map((i) => i.id === updatedBooking.id ? updatedBooking : i));
      setShowEditModal(false);
      setEditingBooking(null);
    } catch {
      alert('Failed to update booking');
    }
  };

  const saveNewBooking = async () => {
    if (!canAddWalkIn) {
      alert('You do not have permission to add bookings');
      return;
    }
    if (!newBooking.name || !newBooking.phone || !newBooking.date || !newBooking.time || !newBooking.studio) {
      alert('Please fill in all required fields');
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
      alert(`This session only has room for ${remaining} more painter${remaining === 1 ? '' : 's'}.`);
      return;
    }

    try {
      await createBooking(booking);
      setInquiries([booking, ...inquiries]);
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
    } catch {
      alert('Failed to add booking');
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
  });

  const addStaffMember = async () => {
    if (!canManageStaff) {
      alert('Only super admins can manage staff');
      return;
    }
    if (!newStaff.name || !newStaff.username || !newStaff.password) {
      alert('Please fill in all fields');
      return;
    }

    const passwordHash = await sha256(newStaff.password);

    if (isSupabaseEnabled()) {
      try {
        const { error } = await supabase!.from('staff').insert({
          name: newStaff.name,
          username: newStaff.username,
          password_hash: passwordHash,
          role: newStaff.role,
          can_update_status: newStaff.canUpdateStatus,
          can_edit_bookings: newStaff.canEditBookings,
          can_add_walk_ins: newStaff.canAddWalkIns,
          can_delete_bookings: newStaff.canDeleteBookings,
        });

        if (error) {
          console.error('Supabase add staff error:', error);
          alert('Failed to add staff member. Username may already exist.');
          return;
        }
      } catch (err) {
        console.error('Supabase add staff failed:', err);
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
    });
    setShowStaffModal(false);
  };

  const deleteStaffMember = async (id: string) => {
    if (!canManageStaff) {
      alert('Only super admins can manage staff');
      return;
    }
    if (id === staff.id) {
      alert('You cannot delete your own account');
      return;
    }
    if (!confirm('Are you sure you want to remove this staff member?')) return;

    if (isSupabaseEnabled()) {
      try {
        const { error } = await supabase!.from('staff').delete().eq('id', id);
        if (error) {
          console.error('Supabase delete staff error:', error);
        }
      } catch (err) {
        console.error('Supabase delete staff failed:', err);
      }
    }

    await loadStaffList();
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Header */}
      <div className="bg-[#1B2D3C] text-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-heading text-2xl font-black">Admin Dashboard</h1>
            <p className="text-xs text-white/60 mt-1">
              {staff.name} · {roleLabel[staff.role]}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        {/* Admin Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-[#1B2D3C]/10 pb-4">
          {[
            { value: 'bookings', label: 'Bookings' },
            { value: 'gift-cards', label: 'Gift Vouchers' },
            ...(canManageStaff ? [{ value: 'content', label: 'Content' }] : []),
            ...(canManageStaff ? [{ value: 'staff', label: 'Staff' }] : []),
            ...(canManageStaff ? [{ value: 'settings', label: 'Settings' }] : []),
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as typeof activeTab)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                activeTab === tab.value
                  ? 'bg-[#DBE7E4] border-[#DBE7E4] text-[#1B2D3C]'
                  : 'bg-white border-[#1B2D3C]/20 text-[#1B2D3C] hover:border-[#DBE7E4]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'bookings' && (
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
                <p className="text-[10px] sm:text-xs text-stone-500 font-bold uppercase tracking-wider">Pending</p>
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
            <button
              onClick={() => loadGiftCards()}
              className="text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C] hover:text-[#486581] underline"
            >
              Refresh
            </button>
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
                            onClick={() => navigator.clipboard.writeText(card.code)}
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
            <p className="text-xs text-stone-500 font-medium">No gift cards sold yet.</p>
          )}
        </div>
        )}

        {activeTab === 'bookings' && (
          <>
                    {/* Filter Tabs */}"

        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { value: 'all', label: 'All Bookings' },
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value as any)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                filter === tab.value
                  ? 'bg-[#DBE7E4] border-[#DBE7E4] text-[#1B2D3C]'
                  : 'bg-white border-[#1B2D3C]/20 text-[#1B2D3C] hover:border-[#DBE7E4]'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <div className="w-px bg-[#1B2D3C]/30 mx-2" />
          {[
            { value: 'all', label: 'All Studios' },
            { value: 'Putney', label: 'Putney' },
            { value: 'Wimbledon', label: 'Wimbledon' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStudioFilter(tab.value as any)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                studioFilter === tab.value
                  ? 'bg-[#DBE7E4] border-[#DBE7E4] text-[#1B2D3C]'
                  : 'bg-white border-[#1B2D3C]/20 text-[#1B2D3C] hover:border-[#DBE7E4]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search and Export */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-[#1B2D3C]/20 text-xs text-[#1B2D3C] font-bold rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20"
            />
          </div>
          {canAddWalkIn && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#DBE7E4] text-[#1B2D3C] font-bold text-xs uppercase tracking-wider border border-[#1B2D3C]/20 hover:bg-[#D6E2E9] transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Booking
            </button>
          )}
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-[#DBE7E4] text-[#1B2D3C] font-bold text-xs uppercase tracking-wider border border-[#1B2D3C]/20 hover:bg-[#D6E2E9] transition-all cursor-pointer"
          >
            Export CSV
          </button>
        </div>

        {/* Calendar View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="lg:col-span-1 bg-white p-4 sm:p-6 border border-[#1B2D3C]/20 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading text-base sm:text-lg font-black text-[#1B2D3C]">
                Booking Calendar {studioFilter !== 'all' && `- ${studioFilter}`}
              </h3>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#1B2D3C] hover:text-[#1B2D3C] transition-colors"
              >
                Today
              </button>
            </div>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rdp"
            />
            {selectedDate && (
              <div className="mt-4 pt-4 border-t border-[#1B2D3C]/20">
                <p className="text-[10px] sm:text-xs font-bold text-[#1B2D3C] uppercase tracking-wider">
                  Selected: {format(selectedDate, 'PPP')}
                </p>
                <p className="text-[10px] sm:text-xs text-stone-500 mt-1">
                  {bookingsForSelectedDate.length} booking{bookingsForSelectedDate.length !== 1 ? 's' : ''} on this date
                </p>
              </div>
            )}
          </div>

          {/* Bookings for Selected Date */}
          <div className="lg:col-span-2 bg-white p-4 sm:p-6 border border-[#1B2D3C]/20 shadow-sm">
            <h3 className="font-heading text-base sm:text-lg font-black text-[#1B2D3C] mb-4">
              {selectedDate ? `Bookings for ${format(selectedDate, 'PPP')}` : 'Select a date to view bookings'}
            </h3>
            {selectedDate && bookingsForSelectedDate.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-stone-500 font-semibold">No bookings for this date</p>
              </div>
            ) : selectedDate ? (
              <div className="space-y-3 sm:space-y-4">
                {bookingsForSelectedDate.map((inq) => (
                  <div key={inq.id} className="bg-[#FFFFFF] p-3 sm:p-4 border border-[#1B2D3C]/10">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div className="space-y-1.5 sm:space-y-2 flex-1">
                        <p className="font-bold text-[#1B2D3C] text-sm sm:text-base">{inq.name}</p>
                        <p className="text-[10px] sm:text-xs text-stone-600">
                          <span className="font-semibold">Studio:</span> {inq.studio} |
                          <span className="font-semibold ml-2">Time:</span> {inq.time} |
                          <span className="font-semibold ml-2">Painters:</span> {inq.paintersCount}
                        </p>
                        <p className="text-[10px] sm:text-xs text-stone-600">
                          <span className="font-semibold">Session:</span> {inq.sessionType}
                        </p>
                        <p className="text-[10px] sm:text-xs text-stone-600">
                          <span className="font-semibold">Contact:</span> {inq.email} | {inq.phone}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {canEdit && (
                          <button
                            onClick={() => handleEditBooking(inq)}
                            className="p-1.5 hover:bg-white border border-[#1B2D3C]/20 transition-all cursor-pointer"
                            title="Edit booking"
                          >
                            <svg className="w-4 h-4 text-[#1B2D3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {canUpdateStatus && (
                          <button
                            onClick={() => updateStatus(inq.id, inq.status === 'confirmed' ? 'pending' : 'confirmed')}
                            className="p-1.5 hover:bg-white border border-[#1B2D3C]/20 transition-all cursor-pointer"
                            title={inq.status === 'confirmed' ? 'Mark as pending' : 'Mark as confirmed'}
                          >
                            {inq.status === 'confirmed' ? (
                              <XCircle className="w-4 h-4 text-amber-600" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            )}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => deleteInquiry(inq.id)}
                            className="p-1.5 hover:bg-red-50 border border-[#1B2D3C]/20 transition-all cursor-pointer"
                            title="Delete booking"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-stone-500 font-semibold">Click on a date in the calendar to view bookings</p>
              </div>
            )}
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white border border-[#1B2D3C]/20 shadow-sm overflow-hidden">
          {filteredInquiries.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <p className="text-sm text-stone-500 font-semibold">No bookings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-[#D6E2E9] border-b border-[#1B2D3C]/20">
                  <tr>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]">Date</th>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]">Time</th>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]">Studio</th>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]">Name</th>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]">Contact</th>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]">Session</th>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]">Painters</th>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]">Source</th>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]">Status</th>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInquiries.map((inq) => (
                    <tr key={inq.id} className="border-b border-[#1B2D3C]/10 hover:bg-[#FFFFFF]/50">
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold text-[#1B2D3C]">{inq.date}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold text-[#1B2D3C]">{inq.time}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold text-[#1B2D3C]">{inq.studio}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold text-[#1B2D3C]">{inq.name}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <div className="space-y-1">
                          <p className="text-[10px] sm:text-xs font-semibold text-[#1B2D3C] flex items-center gap-1">
                            <Mail className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span className="hidden sm:inline">{inq.email}</span>
                            <span className="sm:hidden">{inq.email.split('@')[0]}...</span>
                          </p>
                          <p className="text-[10px] sm:text-xs font-semibold text-[#1B2D3C] flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            {inq.phone}
                          </p>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold text-[#1B2D3C]">{inq.sessionType}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold text-[#1B2D3C]">{inq.paintersCount}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold text-[#1B2D3C]">
                        {inq.source === 'walk-in' ? 'Walk-in' : 'Online'}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border ${
                            inq.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {inq.status === 'confirmed' ? (
                            <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          ) : (
                            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          )}
                          {inq.status}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <div className="flex gap-1 sm:gap-2">
                          {canEdit && (
                            <button
                              onClick={() => handleEditBooking(inq)}
                              className="p-1 sm:p-1.5 hover:bg-[#D6E2E9] border border-[#1B2D3C]/20 transition-all cursor-pointer"
                              title="Edit booking"
                            >
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1B2D3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          {canUpdateStatus && (
                            <button
                              onClick={() => updateStatus(inq.id, inq.status === 'confirmed' ? 'pending' : 'confirmed')}
                              className="p-1 sm:p-1.5 hover:bg-[#D6E2E9] border border-[#1B2D3C]/20 transition-all cursor-pointer"
                              title={inq.status === 'confirmed' ? 'Mark as pending' : 'Mark as confirmed'}
                            >
                              {inq.status === 'confirmed' ? (
                                <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                              )}
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => deleteInquiry(inq.id)}
                              className="p-1 sm:p-1.5 hover:bg-red-50 border border-[#1B2D3C]/20 transition-all cursor-pointer"
                              title="Delete booking"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

          </>
        )}

        {/* Staff Management - super admin only */}
        {activeTab === 'staff' && canManageStaff && (
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

      {activeTab === 'settings' && canManageStaff && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
          <div className="bg-white border border-[#1B2D3C]/10 p-6 rounded-xl max-w-xl space-y-6">
            <div>
              <h2 className="font-heading text-xl font-black text-[#1B2D3C]">Stripe Mode</h2>
              <p className="text-xs text-[#1B2D3C]/70 mt-1">Switch between sandbox (test) and live payments.</p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => updateStripeMode('sandbox')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer rounded-lg ${
                  stripeMode === 'sandbox'
                    ? 'bg-[#DBE7E4] border-[#DBE7E4] text-[#1B2D3C]'
                    : 'bg-white border-[#1B2D3C]/20 text-[#1B2D3C] hover:border-[#DBE7E4]'
                }`}
              >
                Sandbox
              </button>
              <button
                onClick={() => updateStripeMode('live')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer rounded-lg ${
                  stripeMode === 'live'
                    ? 'bg-[#DBE7E4] border-[#DBE7E4] text-[#1B2D3C]'
                    : 'bg-white border-[#1B2D3C]/20 text-[#1B2D3C] hover:border-[#DBE7E4]'
                }`}
              >
                Live
              </button>
            </div>

            <div className={`p-3 rounded-lg text-xs font-bold ${stripeMode === 'live' ? 'bg-red-50 text-red-700' : 'bg-[#DBE7E4]/30 text-[#1B2D3C]'}`}>
              {stripeMode === 'live'
                ? 'Live mode is active. Real payments will be processed. Make sure live Stripe keys are configured in Supabase secrets.'
                : 'Sandbox mode is active. Use test card details for payments.'}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'content' && canManageStaff && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
          <div className="bg-white border border-[#1B2D3C]/10 p-6 rounded-xl space-y-6">
            <div>
              <h2 className="font-heading text-xl font-black text-[#1B2D3C]">Content Management</h2>
              <p className="text-xs text-[#1B2D3C]/70 mt-1">Edit website content directly. Toggle "Edit Mode" in the navbar to edit inline on the site.</p>
            </div>
            <div className="p-4 bg-[#DBE7E4]/30 rounded-lg text-xs font-bold text-[#1B2D3C]">
              <p>Use the "Edit Mode" toggle in the top navigation bar to click and edit text/images directly on the website.</p>
              <p className="mt-2">Changes are saved to the database and persist across all users.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
