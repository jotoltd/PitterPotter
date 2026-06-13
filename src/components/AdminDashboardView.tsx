import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Mail, Phone, MapPin, LogOut, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format, isSameDay, parseISO } from 'date-fns';
import { BookingInquiry } from '../types';
import 'react-day-picker/dist/style.css';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboardView({ onLogout }: AdminDashboardProps) {
  const [inquiries, setInquiries] = useState<BookingInquiry[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [studioFilter, setStudioFilter] = useState<'all' | 'Putney' | 'Wimbledon'>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBooking, setEditingBooking] = useState<BookingInquiry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = () => {
    const saved = localStorage.getItem('pp_inquiries');
    if (saved) {
      try {
        setInquiries(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to load inquiries:', err);
      }
    }
  };

  const deleteInquiry = (id: string) => {
    const updated = inquiries.filter((i) => i.id !== id);
    setInquiries(updated);
    localStorage.setItem('pp_inquiries', JSON.stringify(updated));
  };

  const updateStatus = (id: string, status: 'confirmed' | 'pending') => {
    const updated = inquiries.map((i) => (i.id === id ? { ...i, status } : i));
    setInquiries(updated);
    localStorage.setItem('pp_inquiries', JSON.stringify(updated));
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

  // Get modifiers for calendar (days with bookings)
  const modifiers = {
    hasPending: inquiries
      .filter((inq) => (studioFilter === 'all' || inq.studio === studioFilter) && inq.status === 'pending')
      .map((inq) => parseISO(inq.date)),
    hasConfirmed: inquiries
      .filter((inq) => (studioFilter === 'all' || inq.studio === studioFilter) && inq.status === 'confirmed')
      .map((inq) => parseISO(inq.date)),
  };

  // Get booking count per day
  const getBookingCountForDay = (date: Date) => {
    return inquiries.filter((inq) => {
      const bookingDate = parseISO(inq.date);
      const dateMatch = isSameDay(bookingDate, date);
      const studioMatch = studioFilter === 'all' || inq.studio === studioFilter;
      return dateMatch && studioMatch;
    }).length;
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Studio', 'Date', 'Time', 'Painters', 'Session Type', 'Status', 'Notes', 'Request Date'];
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
        inq.notes || '',
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

  // Edit booking
  const handleEditBooking = (booking: BookingInquiry) => {
    setEditingBooking(booking);
    setShowEditModal(true);
  };

  const saveBookingEdit = (updatedBooking: BookingInquiry) => {
    const updated = inquiries.map((i) => i.id === updatedBooking.id ? updatedBooking : i);
    setInquiries(updated);
    localStorage.setItem('pp_inquiries', JSON.stringify(updated));
    setShowEditModal(false);
    setEditingBooking(null);
  };

  const stats = {
    total: inquiries.length,
    pending: inquiries.filter((i) => i.status === 'pending').length,
    confirmed: inquiries.filter((i) => i.status === 'confirmed').length,
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      {/* Header */}
      <div className="bg-[#1B2D3C] text-white py-4 px-6 border-b-2 border-[#1B2D3C]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-heading text-2xl font-black italic">Admin Dashboard</h1>
            <p className="text-xs text-white/60 mt-1">Pitter Potter Booking Management</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-xs font-bold uppercase tracking-wider transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 sm:p-6 border-2 border-[#1B2D3C]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-stone-500 font-bold uppercase tracking-wider">Total Bookings</p>
                <p className="text-2xl sm:text-3xl font-black text-[#1B2D3C] mt-2">{stats.total}</p>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-[#74919e]" />
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 border-2 border-[#1B2D3C]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-stone-500 font-bold uppercase tracking-wider">Pending</p>
                <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">{stats.pending}</p>
              </div>
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 border-2 border-[#1B2D3C]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-stone-500 font-bold uppercase tracking-wider">Confirmed</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">{stats.confirmed}</p>
              </div>
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { value: 'all', label: 'All Bookings' },
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value as any)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 transition-all cursor-pointer ${
                filter === tab.value
                  ? 'bg-[#74919e] border-[#1B2D3C] text-white'
                  : 'bg-white border-[#1B2D3C] text-[#1B2D3C] hover:bg-[#D9E2EC]/40'
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
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 transition-all cursor-pointer ${
                studioFilter === tab.value
                  ? 'bg-[#74919e] border-[#1B2D3C] text-white'
                  : 'bg-white border-[#1B2D3C] text-[#1B2D3C] hover:bg-[#D9E2EC]/40'
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
              className="w-full px-4 py-2 border-2 border-[#1B2D3C] text-xs text-[#1B2D3C] font-bold rounded-none focus:outline-none focus:bg-[#D9E2EC]/20"
            />
          </div>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-[#74919e] text-white font-bold text-xs uppercase tracking-wider border-2 border-[#1B2D3C] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
          >
            Export CSV
          </button>
        </div>

        {/* Calendar View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="lg:col-span-1 bg-white p-4 sm:p-6 border-2 border-[#1B2D3C]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading text-base sm:text-lg font-black italic text-[#1B2D3C]">
                Booking Calendar {studioFilter !== 'all' && `- ${studioFilter}`}
              </h3>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#74919e] hover:text-[#1B2D3C] transition-colors"
              >
                Today
              </button>
            </div>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={modifiers}
              modifiersStyles={{
                hasPending: {
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  fontWeight: 'bold',
                },
                hasConfirmed: {
                  backgroundColor: '#10b981',
                  color: 'white',
                  fontWeight: 'bold',
                },
              }}
              components={{
                Day: ({ date, modifiers, ...props }) => {
                  const bookingCount = getBookingCountForDay(date);
                  return (
                    <div {...props} className="relative">
                      <span>{format(date, 'd')}</span>
                      {bookingCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[#1B2D3C] text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                          {bookingCount}
                        </span>
                      )}
                    </div>
                  );
                },
              }}
              className="rdp rdp-mobile"
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
          <div className="lg:col-span-2 bg-white p-4 sm:p-6 border-2 border-[#1B2D3C]">
            <h3 className="font-heading text-base sm:text-lg font-black italic text-[#1B2D3C] mb-4">
              {selectedDate ? `Bookings for ${format(selectedDate, 'PPP')}` : 'Select a date to view bookings'}
            </h3>
            {selectedDate && bookingsForSelectedDate.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-stone-500 font-semibold">No bookings for this date</p>
              </div>
            ) : selectedDate ? (
              <div className="space-y-3 sm:space-y-4">
                {bookingsForSelectedDate.map((inq) => (
                  <div key={inq.id} className="bg-[#F0F4F8] p-3 sm:p-4 border-2 border-[#1B2D3C]/30">
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
                        <button
                          onClick={() => handleEditBooking(inq)}
                          className="p-1.5 hover:bg-white border border-[#1B2D3C]/20 transition-all"
                          title="Edit booking"
                        >
                          <svg className="w-4 h-4 text-[#74919e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => updateStatus(inq.id, inq.status === 'confirmed' ? 'pending' : 'confirmed')}
                          className="p-1.5 hover:bg-white border border-[#1B2D3C]/20 transition-all"
                          title={inq.status === 'confirmed' ? 'Mark as pending' : 'Mark as confirmed'}
                        >
                          {inq.status === 'confirmed' ? (
                            <XCircle className="w-4 h-4 text-amber-600" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteInquiry(inq.id)}
                          className="p-1.5 hover:bg-red-50 border border-[#1B2D3C]/20 transition-all"
                          title="Delete booking"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
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
        <div className="bg-white border-2 border-[#1B2D3C] overflow-hidden">
          {filteredInquiries.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <p className="text-sm text-stone-500 font-semibold">No bookings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-[#D9E2EC] border-b-2 border-[#1B2D3C]">
                  <tr>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]">Date</th>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]">Time</th>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]">Studio</th>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]">Name</th>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]">Contact</th>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]">Session</th>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]">Painters</th>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]">Status</th>
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInquiries.map((inq) => (
                    <tr key={inq.id} className="border-b border-[#1B2D3C]/10 hover:bg-[#F0F4F8]/50">
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
                          <button
                            onClick={() => handleEditBooking(inq)}
                            className="p-1 sm:p-1.5 hover:bg-[#D9E2EC] border border-[#1B2D3C]/20 transition-all"
                            title="Edit booking"
                          >
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#74919e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => updateStatus(inq.id, inq.status === 'confirmed' ? 'pending' : 'confirmed')}
                            className="p-1 sm:p-1.5 hover:bg-[#D9E2EC] border border-[#1B2D3C]/20 transition-all"
                            title={inq.status === 'confirmed' ? 'Mark as pending' : 'Mark as confirmed'}
                          >
                            {inq.status === 'confirmed' ? (
                              <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                            )}
                          </button>
                          <button
                            onClick={() => deleteInquiry(inq.id)}
                            className="p-1 sm:p-1.5 hover:bg-red-50 border border-[#1B2D3C]/20 transition-all"
                            title="Delete booking"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Booking Modal */}
      {showEditModal && editingBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 border-2 border-[#1B2D3C] max-w-md w-full space-y-4">
            <h3 className="font-heading text-xl font-black italic text-[#1B2D3C]">Edit Booking</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Name</label>
                <input
                  type="text"
                  value={editingBooking.name}
                  onChange={(e) => setEditingBooking({ ...editingBooking, name: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-[#1B2D3C] text-xs text-[#1B2D3C] font-bold rounded-none focus:outline-none focus:bg-[#D9E2EC]/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Email</label>
                <input
                  type="email"
                  value={editingBooking.email}
                  onChange={(e) => setEditingBooking({ ...editingBooking, email: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-[#1B2D3C] text-xs text-[#1B2D3C] font-bold rounded-none focus:outline-none focus:bg-[#D9E2EC]/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Phone</label>
                <input
                  type="tel"
                  value={editingBooking.phone}
                  onChange={(e) => setEditingBooking({ ...editingBooking, phone: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-[#1B2D3C] text-xs text-[#1B2D3C] font-bold rounded-none focus:outline-none focus:bg-[#D9E2EC]/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Date</label>
                <input
                  type="date"
                  value={editingBooking.date}
                  onChange={(e) => setEditingBooking({ ...editingBooking, date: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-[#1B2D3C] text-xs text-[#1B2D3C] font-bold rounded-none focus:outline-none focus:bg-[#D9E2EC]/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Time</label>
                <select
                  value={editingBooking.time}
                  onChange={(e) => setEditingBooking({ ...editingBooking, time: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-[#1B2D3C] text-xs text-[#1B2D3C] font-bold rounded-none focus:outline-none focus:bg-[#D9E2EC]/20"
                >
                  <option value="10:00">10:00 am</option>
                  <option value="11:30">11:30 am</option>
                  <option value="13:00">1:00 pm</option>
                  <option value="14:30">2:30 pm</option>
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
                  className="w-full px-3 py-2 border-2 border-[#1B2D3C] text-xs text-[#1B2D3C] font-bold rounded-none focus:outline-none focus:bg-[#D9E2EC]/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={editingBooking.notes || ''}
                  onChange={(e) => setEditingBooking({ ...editingBooking, notes: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-[#1B2D3C] text-xs text-[#1B2D3C] font-bold rounded-none focus:outline-none focus:bg-[#D9E2EC]/20"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 bg-[#F0F4F8] text-[#1B2D3C] font-bold text-xs uppercase tracking-wider border-2 border-[#1B2D3C] hover:bg-[#D9E2EC] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => saveBookingEdit(editingBooking)}
                className="flex-1 px-4 py-2 bg-[#74919e] text-white font-bold text-xs uppercase tracking-wider border-2 border-[#1B2D3C] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
