import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Search, Camera, Users, Clock, MapPin, ChevronRight, Check, Package, Phone, X } from 'lucide-react';
import { BookingInquiry } from '../../types';
import Skeleton from '../Skeleton';

export type CollectionStage = 'painted' | 'ready' | 'collected';

interface CollectionsTabProps {
  bookings: BookingInquiry[];
  loading: boolean;
  canUpdate: boolean;
  onSetStage: (booking: BookingInquiry, stage: CollectionStage) => void;
  onOpenBooking: (booking: BookingInquiry) => void;
  onUploadPhotos: (booking: BookingInquiry, files: File[]) => void;
  uploadingId: string | null;
}

const STAGES: { value: CollectionStage; label: string; empty: string }[] = [
  { value: 'painted', label: 'Painted', empty: 'Nothing painted yet' },
  { value: 'ready', label: 'Ready to Collect', empty: 'Nothing ready to collect' },
  { value: 'collected', label: 'Collected', empty: 'Nothing collected yet' },
];

const STAGE_CHIP: Record<CollectionStage, string> = {
  painted: 'bg-amber-100 text-amber-800',
  ready: 'bg-blue-100 text-blue-800',
  collected: 'bg-emerald-100 text-emerald-800',
};

export function resolveStage(booking: BookingInquiry): CollectionStage {
  if (booking.collectionStatus) return booking.collectionStatus;
  return 'painted';
}

function BookingRow({
  booking,
  stage,
  canUpdate,
  onSetStage,
  onOpenBooking,
  onUploadPhotos,
  uploading,
}: {
  booking: BookingInquiry;
  stage: CollectionStage;
  canUpdate: boolean;
  onSetStage: (booking: BookingInquiry, stage: CollectionStage) => void;
  onOpenBooking: (booking: BookingInquiry) => void;
  onUploadPhotos: (booking: BookingInquiry, files: File[]) => void;
  uploading: boolean;
}) {
  const photos = booking.photos ?? [];

  return (
    <div className="bg-white border border-[#1B2D3C]/15 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={() => onOpenBooking(booking)}
          className="text-left min-w-0 flex-1 group cursor-pointer"
        >
          <p className="text-sm font-black text-[#1B2D3C] truncate group-hover:underline">{booking.name}</p>
          <div className="flex items-center gap-2 mt-1 text-[10px] font-semibold text-[#1B2D3C]/60 flex-wrap">
            <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{booking.time}</span>
            <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{booking.paintersCount}</span>
            <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{booking.studio}</span>
            {booking.phone && <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" />{booking.phone}</span>}
          </div>
        </button>
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${STAGE_CHIP[stage]}`}>
          {STAGES.find(s => s.value === stage)?.label}
        </span>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-5 gap-1.5">
          {photos.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="aspect-square rounded-lg overflow-hidden border border-[#1B2D3C]/15 hover:opacity-80 transition-opacity"
            >
              <img src={url} alt={`${booking.name} painting ${i + 1}`} className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      )}

      {canUpdate && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <label className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${
            uploading
              ? 'bg-[#D6E2E9]/40 text-[#1B2D3C]/50 cursor-wait'
              : 'bg-[#DBE7E4] text-[#1B2D3C] hover:bg-[#D6E2E9] cursor-pointer'
          }`}>
            <Camera className="w-3 h-3" />
            {uploading ? 'Uploading...' : photos.length > 0 ? 'Add More' : 'Add Photos'}
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              onChange={(e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                const arr = Array.from(files);
                e.target.value = '';
                onUploadPhotos(booking, arr);
              }}
              className="hidden"
            />
          </label>

          {stage !== 'painted' && (
            <button
              onClick={() => onSetStage(booking, stage === 'collected' ? 'ready' : 'painted')}
              className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-[#1B2D3C]/15 text-[#1B2D3C] text-[9px] font-bold uppercase tracking-wider rounded-lg hover:bg-[#D6E2E9] transition-colors cursor-pointer"
            >
              Back
            </button>
          )}

          {stage === 'painted' && (
            <button
              onClick={() => onSetStage(booking, 'ready')}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ml-auto"
            >
              <Package className="w-3 h-3" /> Ready
            </button>
          )}
          {stage === 'ready' && (
            <button
              onClick={() => onSetStage(booking, 'collected')}
              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ml-auto"
            >
              <Check className="w-3 h-3" /> Collected
            </button>
          )}
          {stage === 'collected' && booking.collectedAt && (
            <span className="text-[9px] font-semibold text-[#1B2D3C]/40 ml-auto">
              {format(parseISO(booking.collectedAt), 'd MMM, HH:mm')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function CollectionsTab({
  bookings,
  loading,
  canUpdate,
  onSetStage,
  onOpenBooking,
  onUploadPhotos,
  uploadingId,
}: CollectionsTabProps) {
  const [stage, setStage] = useState<CollectionStage>('painted');
  const [nameQuery, setNameQuery] = useState('');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [dateQuery, setDateQuery] = useState('');

  const eligible = useMemo(
    () => bookings.filter(b => b.status !== 'cancelled' && b.status !== 'no_show'),
    [bookings],
  );

  const counts = useMemo(() => {
    const acc: Record<CollectionStage, number> = { painted: 0, ready: 0, collected: 0 };
    for (const b of eligible) acc[resolveStage(b)] += 1;
    return acc;
  }, [eligible]);

  const filtered = useMemo(() => {
    const name = nameQuery.trim().toLowerCase();
    const phone = phoneQuery.replace(/\D/g, '');
    return eligible.filter(b => {
      if (resolveStage(b) !== stage) return false;
      if (name && !b.name.toLowerCase().includes(name)) return false;
      if (phone && !(b.phone ?? '').replace(/\D/g, '').includes(phone)) return false;
      if (dateQuery && b.date !== dateQuery) return false;
      return true;
    });
  }, [eligible, stage, nameQuery, phoneQuery, dateQuery]);

  const grouped = useMemo(() => {
    const map = new Map<string, BookingInquiry[]>();
    for (const b of filtered) {
      const list = map.get(b.date) ?? [];
      list.push(b);
      map.set(b.date, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.time.localeCompare(b.time));
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const hasFilters = Boolean(nameQuery || phoneQuery || dateQuery);

  const clearFilters = () => {
    setNameQuery('');
    setPhoneQuery('');
    setDateQuery('');
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-xl font-black text-[#1B2D3C]">Collections</h2>
        <p className="text-xs text-[#1B2D3C]/70 mt-1">
          Track pottery from painted through to collected. Photos link back to the original booking.
        </p>
      </div>

      {/* Stage tabs */}
      <div className="flex items-center gap-1 border-b border-[#1B2D3C]/10 overflow-x-auto scrollbar-hide">
        {STAGES.map(s => (
          <button
            key={s.value}
            onClick={() => setStage(s.value)}
            className={`shrink-0 px-4 py-3 text-xs font-bold tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              stage === s.value
                ? 'border-[#1B2D3C] text-[#1B2D3C]'
                : 'border-transparent text-[#1B2D3C]/50 hover:text-[#1B2D3C]'
            }`}
          >
            {s.label}
            <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-black rounded-full ${
              stage === s.value ? 'bg-[#1B2D3C] text-white' : 'bg-[#1B2D3C]/10 text-[#1B2D3C]/60'
            }`}>
              {counts[s.value]}
            </span>
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="bg-[#F8FAFA] border border-[#1B2D3C]/10 rounded-xl p-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1B2D3C]/40" />
            <input
              type="text"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              placeholder="Name"
              className="w-full pl-8 pr-3 py-2 text-xs font-semibold text-[#1B2D3C] bg-white border border-[#1B2D3C]/15 rounded-lg focus:outline-none focus:border-[#1B2D3C]/40"
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1B2D3C]/40" />
            <input
              type="tel"
              value={phoneQuery}
              onChange={(e) => setPhoneQuery(e.target.value)}
              placeholder="Phone"
              className="w-full pl-8 pr-3 py-2 text-xs font-semibold text-[#1B2D3C] bg-white border border-[#1B2D3C]/15 rounded-lg focus:outline-none focus:border-[#1B2D3C]/40"
            />
          </div>
          <input
            type="date"
            value={dateQuery}
            onChange={(e) => setDateQuery(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold text-[#1B2D3C] bg-white border border-[#1B2D3C]/15 rounded-lg focus:outline-none focus:border-[#1B2D3C]/40"
          />
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]/50 hover:text-[#1B2D3C] cursor-pointer"
          >
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="bg-white border border-[#1B2D3C]/15 rounded-xl p-12 text-center">
          <p className="text-sm text-[#1B2D3C]/60 font-semibold">
            {hasFilters ? 'No bookings match your search' : STAGES.find(s => s.value === stage)?.empty}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, items]) => (
            <div key={date} className="space-y-2">
              <div className="flex items-center gap-2 sticky top-[104px] bg-white py-1 z-10">
                <h3 className="text-sm font-black text-[#1B2D3C] uppercase tracking-wider">
                  {format(parseISO(date), 'EEE d MMM yyyy')}
                </h3>
                <span className="px-2 py-0.5 bg-[#1B2D3C]/10 text-[#1B2D3C]/60 text-[10px] font-black rounded-full">
                  {items.length}
                </span>
                <ChevronRight className="w-3 h-3 text-[#1B2D3C]/20" />
              </div>
              <div className="space-y-2">
                {items.map(b => (
                  <BookingRow
                    key={b.id}
                    booking={b}
                    stage={stage}
                    canUpdate={canUpdate}
                    onSetStage={onSetStage}
                    onOpenBooking={onOpenBooking}
                    onUploadPhotos={onUploadPhotos}
                    uploading={uploadingId === b.id}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
