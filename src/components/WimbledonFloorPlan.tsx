import { useEffect, useMemo, useState } from 'react';
import { BookingInquiry } from '../types';

type TableSize = 'small' | 'large';
type ChairSide = 'top' | 'bottom' | 'left' | 'right';
type TableStatus = 'free' | 'partial' | 'full' | 'blocked' | 'selected';

interface TableDef {
  id: number;
  size: TableSize;
  chairs: ChairSide[];
  label: string;
  area?: 'main' | 'party1' | 'party2' | 'right-lower';
}

interface PositionedTable extends TableDef {
  x: number;
  y: number;
}

export interface WimbledonFloorPlanProps {
  bookings?: BookingInquiry[];
  selectedDate?: string;
  selectedTime?: string;
  highlightTableId?: string;
  onAssign?: (tableId: string) => void;
  readOnly?: boolean;
  showTablePanel?: boolean;
  onTableClick?: (tableId: string) => void;
}

interface BlockedTable {
  tableId: string;
  date: string;
  reason: string;
}

const SMALL_W = 52;
const SMALL_H = 52;
const LARGE_W = 88;
const LARGE_H = 52;
const CHAIR_R = 9;
const CHAIR_GAP = 5;
const BLOCKED_STORAGE_KEY = 'pitter_potter_blocked_tables';

const PARTY_CAPACITY = 16;

const STATUS_FILL: Record<TableStatus, string> = {
  free: '#FFFFFF',
  partial: '#fef9c3',
  full: '#ef4444',
  blocked: '#6b7280',
  selected: '#1B2D3C',
};
const STATUS_STROKE: Record<TableStatus, string> = {
  free: '#1B2D3C',
  partial: '#ca8a04',
  full: '#b91c1c',
  blocked: '#374151',
  selected: '#1B2D3C',
};
const STATUS_TEXT: Record<TableStatus, string> = {
  free: '#1B2D3C',
  partial: '#854d0e',
  full: '#FFFFFF',
  blocked: '#FFFFFF',
  selected: '#FFFFFF',
};
const STATUS_SUB: Record<TableStatus, string> = {
  free: '#1B2D3C99',
  partial: '#a16207',
  full: '#fecaca',
  blocked: '#d1d5db',
  selected: '#D6E2E9',
};

function tableWidth(size: TableSize) { return size === 'small' ? SMALL_W : LARGE_W; }
function tableHeight(size: TableSize) { return size === 'small' ? SMALL_H : LARGE_H; }

function loadBlockedTables(): BlockedTable[] {
  try {
    return JSON.parse(localStorage.getItem(BLOCKED_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}
function saveBlockedTables(blocked: BlockedTable[]) {
  localStorage.setItem(BLOCKED_STORAGE_KEY, JSON.stringify(blocked));
}

export function findAvailableTable(
  bookings: BookingInquiry[],
  blockedTables: BlockedTable[],
  date: string,
  time: string,
  partyArea?: 'party1' | 'party2'
): string | null {
  const allTables = [...TABLES, ...PARTY_1_TABLES, ...PARTY_2_TABLES, ...RIGHT_LOWER_TABLES];
  const candidates = partyArea
    ? allTables.filter(t => t.area === partyArea)
    : allTables.filter(t => !t.area?.startsWith('party'));
  const blockedIds = new Set(blockedTables.filter(b => b.date === date).map(b => b.tableId));
  const assignedIds = new Set(
    bookings.filter(b => b.date === date && b.time === time && b.tableId)
      .flatMap(b => b.tableId!.split(',').map(t => t.trim()))
  );
  for (const t of candidates) {
    const tid = `T${t.id}`;
    if (!blockedIds.has(tid) && !assignedIds.has(tid)) return tid;
  }
  return null;
}

export function findMultipleTables(
  bookings: BookingInquiry[],
  blockedTables: BlockedTable[],
  date: string,
  time: string,
  paintersCount: number,
  partyArea?: 'party1' | 'party2'
): string[] {
  const allTables = [...TABLES, ...PARTY_1_TABLES, ...PARTY_2_TABLES, ...RIGHT_LOWER_TABLES];
  const candidates = partyArea
    ? allTables.filter(t => t.area === partyArea)
    : allTables.filter(t => !t.area?.startsWith('party'));
  const blockedIds = new Set(blockedTables.filter(b => b.date === date).map(b => b.tableId));
  const assignedIds = new Set(
    bookings.filter(b => b.date === date && b.time === time && b.tableId)
      .flatMap(b => b.tableId!.split(',').map(t => t.trim()))
  );
  const available = candidates.filter(t => {
    const tid = `T${t.id}`;
    return !blockedIds.has(tid) && !assignedIds.has(tid);
  });
  const result: string[] = [];
  let seated = 0;
  for (const t of available) {
    if (seated >= paintersCount) break;
    result.push(`T${t.id}`);
    seated += t.chairs.length;
  }
  return result;
}

export function computePartyAreaCapacity(
  bookings: BookingInquiry[],
  blockedTables: BlockedTable[],
  date: string,
  areaTables: PositionedTable[]
): { used: number; total: number; remaining: number; percentage: number } {
  const total = PARTY_CAPACITY;
  const tableIds = new Set(areaTables.map(t => `T${t.id}`));
  const blockedIds = new Set(blockedTables.filter(b => b.date === date && tableIds.has(b.tableId)).map(b => b.tableId));
  const used = bookings
    .filter(b => b.date === date && b.tableId && tableIds.has(b.tableId))
    .reduce((sum, b) => sum + b.paintersCount, 0);
  const remaining = Math.max(0, total - used);
  return { used, total, remaining, percentage: (used / total) * 100 };
}

export function useTableAnalytics(bookings: BookingInquiry[] = []) {
  return useMemo(() => {
    const counts: Record<string, number> = {};
    const painterCounts: Record<string, number> = {};
    bookings.forEach(b => {
      if (!b.tableId) return;
      counts[b.tableId] = (counts[b.tableId] || 0) + 1;
      painterCounts[b.tableId] = (painterCounts[b.tableId] || 0) + b.paintersCount;
    });
    const entries = Object.entries(counts).map(([tableId, bookingsCount]) => ({
      tableId,
      bookingsCount,
      paintersCount: painterCounts[tableId] || 0,
    }));
    return {
      mostUsed: entries.sort((a, b) => b.bookingsCount - a.bookingsCount).slice(0, 5),
      totalAssignments: entries.reduce((sum, e) => sum + e.bookingsCount, 0),
      tableStats: entries,
    };
  }, [bookings]);
}

function Chair({ cx, cy, status }: { cx: number; cy: number; status: TableStatus }) {
  const fill = status === 'blocked' ? '#9ca3af' : status === 'full' ? '#fca5a5' : status === 'partial' ? '#fde047' : status === 'selected' ? '#486581' : '#D6E2E9';
  return <circle cx={cx} cy={cy} r={CHAIR_R} fill={fill} stroke="#1B2D3C" strokeWidth={1.2} />;
}

function TableShape({
  def, status, count, onClick,
}: {
  def: PositionedTable;
  status: TableStatus;
  count: number;
  onClick: () => void;
}) {
  const w = tableWidth(def.size);
  const h = tableHeight(def.size);
  const chairs: { cx: number; cy: number }[] = [];

  const topChairs = def.chairs.filter(c => c === 'top').length;
  const bottomChairs = def.chairs.filter(c => c === 'bottom').length;
  const leftChairs = def.chairs.filter(c => c === 'left').length;
  const rightChairs = def.chairs.filter(c => c === 'right').length;

  for (let i = 0; i < topChairs; i++) {
    const spacing = w / (topChairs + 1);
    chairs.push({ cx: def.x + spacing * (i + 1), cy: def.y - CHAIR_R - CHAIR_GAP });
  }
  for (let i = 0; i < bottomChairs; i++) {
    const spacing = w / (bottomChairs + 1);
    chairs.push({ cx: def.x + spacing * (i + 1), cy: def.y + h + CHAIR_R + CHAIR_GAP });
  }
  for (let i = 0; i < leftChairs; i++) {
    const spacing = h / (leftChairs + 1);
    chairs.push({ cx: def.x - CHAIR_R - CHAIR_GAP, cy: def.y + spacing * (i + 1) });
  }
  for (let i = 0; i < rightChairs; i++) {
    const spacing = h / (rightChairs + 1);
    chairs.push({ cx: def.x + w + CHAIR_R + CHAIR_GAP, cy: def.y + spacing * (i + 1) });
  }

  const label = status === 'blocked' ? 'BLOCKED' : status === 'full' ? 'FULL' : count > 0 ? `${count} booked` : 'free';

  return (
    <g onClick={onClick} className="cursor-pointer" role="button" aria-label={`Table ${def.id}`}>
      {chairs.map((c, i) => <Chair key={i} cx={c.cx} cy={c.cy} status={status} />)}
      <rect
        x={def.x} y={def.y} width={w} height={h} rx={4}
        fill={STATUS_FILL[status]}
        stroke={STATUS_STROKE[status]}
        strokeWidth={status === 'selected' ? 2.5 : 1.5}
      />
      <text x={def.x + w / 2} y={def.y + h / 2 - 6} textAnchor="middle" dominantBaseline="middle"
        fontSize={11} fontWeight="800" fill={STATUS_TEXT[status]}>
        T{def.id}
      </text>
      <text x={def.x + w / 2} y={def.y + h / 2 + 7} textAnchor="middle" dominantBaseline="middle"
        fontSize={8} fill={STATUS_SUB[status]}>
        {label}
      </text>
    </g>
  );
}

const TABLES: PositionedTable[] = [
  // ── LEFT COLUMN ──────────────────────────────────────────────
  { id: 1, size: 'small', chairs: ['top', 'bottom'], area: 'main', label: 'T1',  x: 40,  y: 60  },
  { id: 2, size: 'large', chairs: ['top', 'top', 'bottom', 'bottom', 'right'], area: 'main', label: 'T2',  x: 40,  y: 165 },
  { id: 3, size: 'large', chairs: ['top', 'top', 'bottom', 'bottom', 'right'], area: 'main', label: 'T3',  x: 40,  y: 270 },
  { id: 4, size: 'large', chairs: ['top', 'top', 'bottom', 'bottom', 'right'], area: 'main', label: 'T4',  x: 40,  y: 370 },

  // ── RIGHT COLUMN ─────────────────────────────────────────────
  { id: 5,  size: 'small', chairs: ['top', 'right', 'bottom'], area: 'main', label: 'T5',  x: 310, y: 60  },
  { id: 6,  size: 'small', chairs: ['left', 'right'], area: 'main', label: 'T6',  x: 310, y: 155 },
  { id: 7,  size: 'small', chairs: ['left', 'right'], area: 'main', label: 'T7',  x: 310, y: 240 },
  { id: 8,  size: 'small', chairs: ['left', 'left', 'right', 'right'], area: 'main', label: 'T8',  x: 310, y: 325 },
  { id: 9,  size: 'small', chairs: ['left', 'left', 'right', 'right'], area: 'main', label: 'T9',  x: 310, y: 430 },
  { id: 10, size: 'small', chairs: ['left', 'right', 'bottom'], area: 'main', label: 'T10', x: 310, y: 525 },
];

const PARTY_1_TABLES: PositionedTable[] = [
  { id: 11, size: 'large', chairs: ['top', 'top', 'bottom', 'bottom'], area: 'party1', label: 'T11', x: 40,  y: 680 },
  { id: 12, size: 'large', chairs: ['top', 'top', 'bottom', 'bottom'], area: 'party1', label: 'T12', x: 155, y: 680 },
];

const PARTY_2_TABLES: PositionedTable[] = [
  { id: 15, size: 'large', chairs: ['top', 'top', 'bottom', 'bottom'], area: 'party2', label: 'T15', x: 40,  y: 900 },
  { id: 16, size: 'large', chairs: ['top', 'top', 'bottom', 'bottom'], area: 'party2', label: 'T16', x: 155, y: 900 },
  { id: 17, size: 'large', chairs: ['top', 'top', 'bottom', 'bottom'], area: 'party2', label: 'T17', x: 310, y: 980 },
];

const RIGHT_LOWER_TABLES: PositionedTable[] = [
  { id: 13, size: 'small', chairs: ['left', 'right'], area: 'right-lower', label: 'T13', x: 310, y: 680 },
  { id: 14, size: 'small', chairs: ['left', 'right', 'bottom'], area: 'right-lower', label: 'T14', x: 310, y: 775 },
];

export default function WimbledonFloorPlan({
  bookings = [],
  selectedDate,
  selectedTime,
  highlightTableId,
  onAssign,
  readOnly = false,
  showTablePanel = true,
  onTableClick,
}: WimbledonFloorPlanProps) {
  const [localSelected, setLocalSelected] = useState<string | null>(null);
  const [blockedTables, setBlockedTables] = useState<BlockedTable[]>([]);
  const [blockReason, setBlockReason] = useState('');
  const [showBlockInput, setShowBlockInput] = useState(false);

  useEffect(() => {
    setBlockedTables(loadBlockedTables());
  }, []);

  const allTables = [...TABLES, ...PARTY_1_TABLES, ...PARTY_2_TABLES, ...RIGHT_LOWER_TABLES];

  const bookingsByTable = useMemo(() => {
    const map = new Map<string, BookingInquiry[]>();
    if (!selectedDate) return map;
    bookings
      .filter(b => b.date === selectedDate && b.studio === 'Wimbledon')
      .forEach(b => {
        if (!b.tableId) return;
        const list = map.get(b.tableId) || [];
        list.push(b);
        map.set(b.tableId, list);
      });
    return map;
  }, [bookings, selectedDate]);

  const blockedIdsForDate = useMemo(() => {
    return new Set(blockedTables.filter(b => b.date === selectedDate).map(b => b.tableId));
  }, [blockedTables, selectedDate]);

  const getStatus = (tableId: string): TableStatus => {
    if (localSelected === tableId || highlightTableId === tableId) return 'selected';
    if (blockedIdsForDate.has(tableId)) return 'blocked';
    const list = bookingsByTable.get(tableId) || [];
    if (list.length === 0) return 'free';
    if (selectedTime && list.some(b => b.time === selectedTime)) return 'full';
    return 'partial';
  };

  const handleClick = (id: number) => {
    const tid = `T${id}`;
    if (readOnly) {
      onTableClick?.(tid);
      return;
    }
    if (blockedIdsForDate.has(tid)) return;
    setLocalSelected(prev => prev === tid ? null : tid);
    onTableClick?.(tid);
    if (onAssign) onAssign(tid);
  };

  const selectedTable = localSelected ? allTables.find(t => `T${t.id}` === localSelected) : null;
  const selectedBookings = localSelected ? (bookingsByTable.get(localSelected) || []).sort((a, b) => a.time.localeCompare(b.time)) : [];
  const selectedBlock = localSelected ? blockedTables.find(b => b.tableId === localSelected && b.date === selectedDate) : null;

  const party1Capacity = selectedDate ? computePartyAreaCapacity(bookings, blockedTables, selectedDate, PARTY_1_TABLES) : null;
  const party2Capacity = selectedDate ? computePartyAreaCapacity(bookings, blockedTables, selectedDate, PARTY_2_TABLES) : null;

  const handleBlock = () => {
    if (!localSelected || !selectedDate) return;
    const reason = blockReason.trim() || 'Blocked';
    const next = [...blockedTables, { tableId: localSelected, date: selectedDate, reason }];
    saveBlockedTables(next);
    setBlockedTables(next);
    setBlockReason('');
    setShowBlockInput(false);
  };

  const handleUnblock = () => {
    if (!localSelected || !selectedDate) return;
    const next = blockedTables.filter(b => !(b.tableId === localSelected && b.date === selectedDate));
    saveBlockedTables(next);
    setBlockedTables(next);
  };

  const renderTable = (t: PositionedTable) => {
    const tid = `T${t.id}`;
    const status = getStatus(tid);
    const count = status === 'blocked' ? 0 : (bookingsByTable.get(tid)?.length || 0);
    return (
      <TableShape
        key={t.id}
        def={t}
        status={status}
        count={count}
        onClick={() => handleClick(t.id)}
      />
    );
  };

  return (
    <div className="bg-white border border-[#1B2D3C]/20 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-heading font-black text-[#1B2D3C] text-base">Wimbledon Studio</h3>
          <p className="text-[10px] text-[#1B2D3C]/50 font-semibold mt-0.5">17 tables · 52 Wimbledon Hill Road</p>
        </div>
        {selectedTable && (
          <div className="bg-[#1B2D3C] text-white px-3 py-1.5 rounded-lg text-xs font-bold">
            {selectedTable.label} selected · {selectedTable.chairs.length} seats
          </div>
        )}
      </div>

      {/* Party area capacity bars */}
      {selectedDate && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {party1Capacity && (
            <div className="bg-[#f0fdf4] border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-green-800 mb-1">
                <span>Party Area 1</span>
                <span>{party1Capacity.used}/{party1Capacity.total}</span>
              </div>
              <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-600 rounded-full transition-all" style={{ width: `${party1Capacity.percentage}%` }} />
              </div>
              <p className="text-[10px] text-green-700 mt-1 font-semibold">{party1Capacity.remaining} seats remaining</p>
            </div>
          )}
          {party2Capacity && (
            <div className="bg-[#eff6ff] border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-blue-800 mb-1">
                <span>Party Area 2</span>
                <span>{party2Capacity.used}/{party2Capacity.total}</span>
              </div>
              <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${party2Capacity.percentage}%` }} />
              </div>
              <p className="text-[10px] text-blue-700 mt-1 font-semibold">{party2Capacity.remaining} seats remaining</p>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] font-semibold text-[#1B2D3C]/70">
        <div className="flex items-center gap-1.5"><div className="w-4 h-3 bg-white border border-[#1B2D3C] rounded-sm" /><span>Free</span></div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-3 bg-yellow-100 border border-yellow-600 rounded-sm" /><span>Has bookings</span></div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-3 bg-red-500 border border-red-700 rounded-sm" /><span>Selected slot taken</span></div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-3 bg-gray-500 border border-gray-700 rounded-sm" /><span>Blocked</span></div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-3 bg-[#1B2D3C] rounded-sm" /><span>Selected</span></div>
      </div>

      <div className="overflow-x-auto">
        <svg width="450" height="1080" className="block mx-auto">
          <rect x={10} y={10} width={420} height={615} rx={8} fill="#F8FAFB" stroke="#1B2D3C" strokeWidth={1} strokeDasharray="4 3" />
          <text x={220} y={30} textAnchor="middle" fontSize={10} fontWeight="700" fill="#1B2D3C99" letterSpacing="2">MAIN AREA</text>

          <rect x={10} y={480} width={170} height={60} rx={4} fill="#DBE7E4" stroke="#1B2D3C" strokeWidth={1.2} />
          <text x={95} y={515} textAnchor="middle" fontSize={13} fontWeight="800" fill="#1B2D3C" letterSpacing="3">BAR</text>

          <line x1={290} y1={400} x2={390} y2={400} stroke="#1B2D3C" strokeWidth={1.5} />
          <line x1={310} y1={398} x2={375} y2={415} stroke="#1B2D3C55" strokeWidth={1} />
          <line x1={375} y1={398} x2={310} y2={415} stroke="#1B2D3C55" strokeWidth={1} />
          <text x={342} y={410} textAnchor="middle" fontSize={9} fontWeight="700" fill="#1B2D3C80">SEPARATOR</text>

          {TABLES.map(renderTable)}
          <line x1={10} y1={635} x2={430} y2={635} stroke="#1B2D3C" strokeWidth={1.5} />

          <rect x={10} y={645} width={280} height={140} rx={8} fill="#f0fdf4" stroke="#16a34a" strokeWidth={1} strokeDasharray="4 3" />
          <text x={150} y={665} textAnchor="middle" fontSize={10} fontWeight="700" fill="#16a34a99" letterSpacing="2">PARTY AREA 1</text>
          {PARTY_1_TABLES.map(renderTable)}

          <line x1={10} y1={800} x2={280} y2={800} stroke="#1B2D3C" strokeWidth={1.5} />

          <rect x={10} y={810} width={420} height={250} rx={8} fill="#eff6ff" stroke="#2563eb" strokeWidth={1} strokeDasharray="4 3" />
          <text x={220} y={832} textAnchor="middle" fontSize={10} fontWeight="700" fill="#2563eb99" letterSpacing="2">PARTY AREA 2</text>
          {PARTY_2_TABLES.map(renderTable)}
          {RIGHT_LOWER_TABLES.map(renderTable)}
        </svg>
      </div>

      {showTablePanel && selectedTable && selectedDate && (
        <div className="border border-[#1B2D3C]/20 rounded-xl p-4 bg-[#F8FAFB]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-heading font-black text-[#1B2D3C] text-sm">
              {selectedTable.label} — {selectedDate} schedule
            </h4>
            {!readOnly && (
              <div className="flex gap-2">
                {selectedBlock ? (
                  <button
                    onClick={handleUnblock}
                    className="px-3 py-1.5 bg-white border border-red-300 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded hover:bg-red-50 cursor-pointer"
                  >
                    Unblock ({selectedBlock.reason})
                  </button>
                ) : (
                  <>
                    {showBlockInput ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={blockReason}
                          onChange={e => setBlockReason(e.target.value)}
                          placeholder="Reason"
                          className="px-2 py-1 text-[10px] border border-[#1B2D3C]/20 rounded w-28"
                        />
                        <button onClick={handleBlock} className="px-2 py-1 bg-gray-600 text-white text-[10px] font-bold rounded cursor-pointer">Block</button>
                        <button onClick={() => setShowBlockInput(false)} className="px-2 py-1 text-[10px] font-bold text-[#1B2D3C] cursor-pointer">Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowBlockInput(true)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-[10px] font-bold uppercase tracking-wider rounded hover:bg-gray-300 cursor-pointer"
                      >
                        Block table
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {selectedBlock ? (
            <p className="text-xs text-gray-500 font-semibold">Table blocked: {selectedBlock.reason}</p>
          ) : selectedBookings.length === 0 ? (
            <p className="text-xs text-[#1B2D3C]/50 font-semibold">No bookings on this table for the selected date.</p>
          ) : (
            <div className="space-y-2">
              {selectedBookings.map(b => (
                <div key={b.id} className="flex items-center justify-between bg-white border border-[#1B2D3C]/10 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#1B2D3C] bg-[#D6E2E9] px-2 py-0.5 rounded">{b.time}</span>
                    <span className="text-xs font-semibold text-[#1B2D3C]">{b.name}</span>
                    <span className="text-[10px] text-[#1B2D3C]/60 font-semibold">{b.paintersCount} painters · {b.sessionType}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
