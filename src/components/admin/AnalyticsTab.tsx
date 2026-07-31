import { format, parseISO } from 'date-fns';
import { BookingInquiry, GiftCard } from '../../types';
import { getBookingAnalytics, getGiftCardAnalytics } from './adminUtils';

interface AnalyticsTabProps {
  inquiries: BookingInquiry[];
  giftCards: GiftCard[];
}

export default function AnalyticsTab({ inquiries, giftCards }: AnalyticsTabProps) {
  const bookingStats = getBookingAnalytics(inquiries);
  const giftCardStats = getGiftCardAnalytics(giftCards);
  const maxMonthly = Math.max(...bookingStats.bookingsByMonth.map((d) => d.count), 1);
  const maxPopular = Math.max(...bookingStats.popularDates.map((d) => d.count), 1);
  const maxStudio = Math.max(...Object.values(bookingStats.studioCounts), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-8">
      <div>
        <h2 className="font-heading text-xl font-black text-[#1B2D3C]">Analytics Dashboard</h2>
        <p className="text-xs text-[#1B2D3C]/70 mt-1">Overview of bookings, gift card revenue, and popular dates.</p>
      </div>

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
                    <div className="h-full bg-[#DBE7E4] rounded" style={{ width: `${(count / maxMonthly) * 100}%` }} />
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
                    <div className="h-full bg-[#FFF1E6] rounded" style={{ width: `${(count / maxPopular) * 100}%` }} />
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
                    <div className="h-full bg-[#D6E2E9] rounded" style={{ width: `${(count / maxStudio) * 100}%` }} />
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
    </div>
  );
}
