import { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Users, Loader2, CheckCircle2, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { format, getDay, parseISO, startOfDay, isBefore } from 'date-fns';
import { getSlots, filterPastSlots, SlotSessionType, DayType, Studio } from '../lib/timeSlots';
import { getBusyDates } from '../lib/bookings';
import { loadClosuresFromSupabase, getClosureDates, getClosedDatesForStudio, ClosureDates } from '../lib/closures';
import Calendar from './Calendar';
import { Page } from '../types';

interface ManageBookingViewProps {
  setCurrentPage: (page: Page) => void;
}

interface BookingData {
  bookingId: string;
  name: string;
  email: string;
  phone: string;
  studio: string;
  date: string;
  time: string;
  paintersCount: number;
  sessionType: string;
  status: string;
  notes: string | null;
}

const SESSION_LABELS: Record<string, string> = {
  'painting': 'Pottery Painting',
  'clay-imprints': 'Baby Prints',
  'birthday-party': 'Birthday Party',
  'baby-shower-hen': 'Baby Shower / Hen Do',
  'corporate': 'Corporate Event',
};

export default function ManageBookingView({ setCurrentPage }: ManageBookingViewProps) {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'view' | 'reschedule' | 'cancel'>('view');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [busyDates, setBusyDates] = useState<Date[]>([]);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [closures, setClosures] = useState<ClosureDates>(getClosureDates());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (!token) {
      setError('Invalid link. Please use the link from your booking confirmation email.');
      setLoading(false);
      return;
    }
    fetchBooking();
    loadClosuresFromSupabase().then(setClosures).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!booking) return;
    getBusyDates(booking.studio as Studio, calendarMonth.getFullYear(), calendarMonth.getMonth()).then((dates) => {
      setBusyDates(dates.map((d) => new Date(d)));
    });
  }, [calendarMonth, booking]);

  const minDate = useMemo(() => startOfDay(new Date()), []);
  const closedDatesAsDate = useMemo(() => {
    if (!booking) return [];
    return getClosedDatesForStudio(closures.closedDates, booking.studio as 'Putney' | 'Wimbledon').map(d => new Date(d + 'T00:00:00'));
  }, [closures.closedDates, booking]);
  const disabledDates = useMemo(() => [...busyDates, ...closedDatesAsDate], [busyDates, closedDatesAsDate]);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: 'view', token }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        setError(data.error || 'Failed to load booking');
        setLoading(false);
        return;
      }
      setBooking(data.booking);
      setNewDate(data.booking.date);
      setNewTime(data.booking.time);
      setSelectedDate(new Date(data.booking.date + 'T00:00:00'));
      setLoading(false);
    } catch {
      setError('Failed to load booking');
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime) return;
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: 'reschedule', token, newDate, newTime }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        setError(data.error || 'Failed to reschedule');
        setSubmitting(false);
        return;
      }
      setBooking(prev => prev ? { ...prev, date: newDate, time: newTime } : prev);
      setSuccessMsg('Your booking has been rescheduled successfully.');
      setMode('view');
      setSubmitting(false);
    } catch {
      setError('Failed to reschedule booking');
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: 'cancel', token }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        setError(data.error || 'Failed to cancel');
        setSubmitting(false);
        return;
      }
      setBooking(prev => prev ? { ...prev, status: 'cancelled' } : prev);
      setSuccessMsg('Your booking has been cancelled. We hope to see you another time!');
      setMode('view');
      setSubmitting(false);
    } catch {
      setError('Failed to cancel booking');
      setSubmitting(false);
    }
  };

  const getAvailableSlots = () => {
    if (!booking || !newDate) return [];
    const slotKey: SlotSessionType = ['birthday-party', 'baby-shower-hen', 'corporate'].includes(booking.sessionType)
      ? 'party'
      : booking.sessionType === 'clay-imprints' ? 'baby-prints' : 'painting';
    const dt: DayType = (() => {
      const d = getDay(parseISO(newDate));
      return d === 0 || d === 6 ? 'weekend' : 'weekday';
    })();
    return filterPastSlots(getSlots(slotKey, booking.studio as Studio, dt), parseISO(newDate));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1B2D3C]" />
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#1B2D3C]/20 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-black text-[#1B2D3C] mb-2">Something went wrong</h1>
          <p className="text-sm text-[#1B2D3C]/70 mb-6">{error}</p>
          <button
            onClick={() => setCurrentPage('home')}
            className="px-6 py-3 bg-[#1B2D3C] text-white text-sm font-bold rounded-lg hover:bg-[#486581] transition-all cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const isCancelled = booking.status === 'cancelled';

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-heading text-3xl font-black text-[#1B2D3C]">Manage Your Booking</h1>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-emerald-800">{successMsg}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-red-800">{error}</p>
          </div>
        )}

        {/* Booking details card */}
        <div className="bg-white rounded-2xl border border-[#1B2D3C]/20 p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-black text-[#1B2D3C]">Booking Details</h2>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-full ${
              isCancelled ? 'bg-red-100 text-red-700' :
              booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {isCancelled ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {isCancelled ? 'Cancelled' : booking.status === 'confirmed' ? 'Confirmed' : 'Pending'}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-[#1B2D3C]/50 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-[#1B2D3C]/50 uppercase tracking-wider">Studio</p>
                <p className="text-sm font-bold text-[#1B2D3C]">{booking.studio}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-4 h-4 text-[#1B2D3C]/50 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-[#1B2D3C]/50 uppercase tracking-wider">Date</p>
                <p className="text-sm font-bold text-[#1B2D3C]">
                  {format(parseISO(booking.date), 'EEEE, d MMMM yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-[#1B2D3C]/50 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-[#1B2D3C]/50 uppercase tracking-wider">Time</p>
                <p className="text-sm font-bold text-[#1B2D3C]">{booking.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-[#1B2D3C]/50 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-[#1B2D3C]/50 uppercase tracking-wider">Painters</p>
                <p className="text-sm font-bold text-[#1B2D3C]">{booking.paintersCount}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#1B2D3C]/10">
            <p className="text-[10px] font-bold text-[#1B2D3C]/50 uppercase tracking-wider mb-1">Session Type</p>
            <p className="text-sm font-bold text-[#1B2D3C]">{SESSION_LABELS[booking.sessionType] || booking.sessionType}</p>
          </div>

        </div>

        {/* Reschedule form */}
        {mode === 'reschedule' && !isCancelled && (
          <div className="bg-white rounded-2xl border border-[#1B2D3C]/20 p-6 mb-4">
            <h2 className="font-heading text-xl font-black text-[#1B2D3C] mb-4">Reschedule Booking</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">New Date</label>
                <Calendar
                  selected={selectedDate}
                  onSelect={(d) => { if (d) { setSelectedDate(d); setNewDate(format(d, 'yyyy-MM-dd')); setNewTime(''); } }}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  disabled={disabledDates}
                  minDate={minDate}
                  dayOfWeekDisabled={[1]}
                  schoolHolidayDates={closures.schoolHolidays}
                  marks={busyDates}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">New Time</label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#1B2D3C]/20 text-sm text-[#1B2D3C] font-bold rounded-lg focus:outline-none focus:bg-[#D6E2E9]/20"
                >
                  <option value="">Select a time</option>
                  {getAvailableSlots().map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setMode('view'); setNewDate(booking.date); setNewTime(booking.time); setError(''); }}
                  className="flex-1 px-4 py-2.5 bg-white text-[#1B2D3C] font-bold text-xs uppercase tracking-wider border border-[#1B2D3C]/20 rounded-lg hover:bg-[#D6E2E9] transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleReschedule}
                  disabled={submitting || !newDate || !newTime || (newDate === booking.date && newTime === booking.time)}
                  className="flex-1 px-4 py-2.5 bg-[#1B2D3C] text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-[#486581] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel confirmation */}
        {mode === 'cancel' && !isCancelled && (
          <div className="bg-white rounded-2xl border border-red-200 p-6 mb-4">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h2 className="font-heading text-xl font-black text-[#1B2D3C]">Cancel Booking?</h2>
                <p className="text-sm text-[#1B2D3C]/70 mt-1">
                  This will permanently cancel your booking for {format(parseISO(booking.date), 'd MMM yyyy')} at {booking.time}. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setMode('view'); setError(''); }}
                className="flex-1 px-4 py-2.5 bg-white text-[#1B2D3C] font-bold text-xs uppercase tracking-wider border border-[#1B2D3C]/20 rounded-lg hover:bg-[#D6E2E9] transition-all cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancel}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-red-700 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {mode === 'view' && !isCancelled && (
          <div className="space-y-3">
            <button
              onClick={() => { setMode('reschedule'); setError(''); setSuccessMsg(''); setCalendarMonth(new Date()); }}
              className="w-full px-6 py-3.5 bg-[#1B2D3C] text-white text-sm font-bold rounded-xl hover:bg-[#486581] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CalendarIcon className="w-4 h-4" /> Reschedule Booking
            </button>
            <button
              onClick={() => { setMode('cancel'); setError(''); setSuccessMsg(''); }}
              className="w-full px-6 py-3.5 bg-white text-red-600 text-sm font-bold rounded-xl border border-red-200 hover:bg-red-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" /> Cancel Booking
            </button>
          </div>
        )}

        {isCancelled && (
          <div className="text-center">
            <button
              onClick={() => setCurrentPage('home')}
              className="px-6 py-3 bg-[#1B2D3C] text-white text-sm font-bold rounded-lg hover:bg-[#486581] transition-all cursor-pointer inline-flex items-center gap-2"
            >
              Back to Home <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Footer note */}
        {!isCancelled && (
          <p className="text-center text-xs text-[#1B2D3C]/50 mt-6">
            Questions? Call us at {booking.studio === 'Putney' ? '020 8788 1635' : '020 3770 4499'}.
          </p>
        )}
      </div>
    </div>
  );
}
