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
  area?: 'main' | 'party';
}

interface PositionedTable extends TableDef {
  x: number;
  y: number;
}

export interface PutneyFloorPlanProps {
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
const BLOCKED_STORAGE_KEY = 'pitter_potter_blocked_tables_putney';

const STATUS_FILL: Record<TableStatus, string> = {
  free: '#FFFFFF', partial: '#fef9c3', full: '#ef4444', blocked: '#6b7280', selected: '#1B2D3C',
};
const STATUS_STROKE: Record<TableStatus, string> = {
  free: '#1B2D3C', partial: '#ca8a04', full: '#b91c1c', blocked: '#374151', selected: '#1B2D3C',
};
const STATUS_TEXT: Record<TableStatus, string> = {
  free: '#1B2D3C', partial: '#854d0e', full: '#FFFFFF', blocked: '#FFFFFF', selected: '#FFFFFF',
};
const STATUS_SUB: Record<TableStatus, string> = {
  free: '#1B2D3C99', partial: '#a16207', full: '#fecaca', blocked: '#d1d5db', selected: '#D6E2E9',
};

function tableWidth(size: TableSize) { return size === 'small' ? SMALL_W : LARGE_W; }
function tableHeight(size: TableSize) { return size === 'small' ? SMALL_H : LARGE_H; }

function loadBlockedTables(): BlockedTable[] {
  try { return JSON.parse(localStorage.getItem(BLOCKED_STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveBlockedTables(blocked: BlockedTable[]) {
  localStorage.setItem(BLOCKED_STORAGE_KEY, JSON.stringify(blocked));
}

export function findAvailablePutneyTable(
  bookings: BookingInquiry[],
  blockedTables: BlockedTable[],
  date: string,
  time: string,
): string | null {
  const allTables = [...MAIN_TABLES, ...PARTY_TABLES];
  const blockedIds = new Set(blockedTables.filter(b => b.date === date).map(b => b.tableId));
  const assignedIds = new Set(
    bookings.filter(b => b.date === date && b.time === time && b.tableId).map(b => b.tableId!)
  );
  for (const t of allTables) {
    const tid = `T${t.id}`;
    if (!blockedIds.has(tid) && !assignedIds.has(tid)) return tid;
  }
  return null;
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
      tableId, bookingsCount, paintersCount: painterCounts[tableId] || 0,
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

function TableShape({ def, status, count, onClick }: {
  def: PositionedTable; status: TableStatus; count: number; onClick: () => void;
}) {
  const w = tableWidth(def.size);
  const h = tableHeight(def.size);
  const chairs: { cx: number; cy: number }[] = [];

  const topCount = def.chairs.filter(c => c === 'top').length;
  const bottomCount = def.chairs.filter(c => c === 'bottom').length;
  const leftCount = def.chairs.filter(c => c === 'left').length;
  const rightCount = def.chairs.filter(c => c === 'right').length;

  for (let i = 0; i < topCount; i++) {
    chairs.push({ cx: def.x + (w / (topCount + 1)) * (i + 1), cy: def.y - CHAIR_R - CHAIR_GAP });
  }
  for (let i = 0; i < bottomCount; i++) {
    chairs.push({ cx: def.x + (w / (bottomCount + 1)) * (i + 1), cy: def.y + h + CHAIR_R + CHAIR_GAP });
  }
  for (let i = 0; i < leftCount; i++) {
    chairs.push({ cx: def.x - CHAIR_R - CHAIR_GAP, cy: def.y + (h / (leftCount + 1)) * (i + 1) });
  }
  for (let i = 0; i < rightCount; i++) {
    chairs.push({ cx: def.x + w + CHAIR_R + CHAIR_GAP, cy: def.y + (h / (rightCount + 1)) * (i + 1) });
  }

  const label = status === 'blocked' ? 'BLOCKED' : status === 'full' ? 'FULL' : count > 0 ? `${count} booked` : 'free';

  return (
    <g onClick={onClick} className="cursor-pointer" role="button" aria-label={`Table ${def.id}`}>
      {chairs.map((c, i) => <Chair key={i} cx={c.cx} cy={c.cy} status={status} />)}
      <rect x={def.x} y={def.y} width={w} height={h} rx={4}
        fill={STATUS_FILL[status]} stroke={STATUS_STROKE[status]} strokeWidth={status === 'selected' ? 2.5 : 1.5} />
      <text x={def.x + w / 2} y={def.y + h / 2 - 6} textAnchor="middle" dominantBaseline="middle"
        fontSize={11} fontWeight="800" fill={STATUS_TEXT[status]}>T{def.id}</text>
      <text x={def.x + w / 2} y={def.y + h / 2 + 7} textAnchor="middle" dominantBaseline="middle"
        fontSize={8} fill={STATUS_SUB[status]}>{label}</text>
    </g>
  );
}

// Left column: T1–T4 (small, portrait orientation)
// Right column: T5–T6 (large, landscape)
// Party area: T7 (large), T8 (small), T9 (small), T10 (large)
const MAIN_TABLES: PositionedTable[] = [
  { id: 1, size: 'small', chairs: ['top', 'left', 'left', 'right', 'right'], area: 'main', label: 'T1', x: 55, y: 55 },
  { id: 2, size: 'small', chairs: ['left', 'right'],                          area: 'main', label: 'T2', x: 55, y: 165 },
  { id: 3, size: 'small', chairs: ['left', 'right'],                          area: 'main', label: 'T3', x: 55, y: 255 },
  { id: 4, size: 'small', chairs: ['left', 'left', 'right', 'right', 'bottom'], area: 'main', label: 'T4', x: 55, y: 345 },
  { id: 5, size: 'large', chairs: ['top', 'top', 'bottom', 'bottom'],         area: 'main', label: 'T5', x: 270, y: 55 },
  { id: 6, size: 'large', chairs: ['top', 'top', 'bottom', 'bottom'],         area: 'main', label: 'T6', x: 270, y: 165 },
];

const PARTY_TABLES: PositionedTable[] = [
  { id: 7,  size: 'large', chairs: ['top', 'top', 'bottom', 'bottom'], area: 'party', label: 'T7',  x: 30,  y: 560 },
  { id: 8,  size: 'small', chairs: ['top', 'bottom'],                   area: 'party', label: 'T8',  x: 165, y: 560 },
  { id: 9,  size: 'small', chairs: ['top', 'bottom'],                   area: 'party', label: 'T9',  x: 255, y: 560 },
  { id: 10, size: 'large', chairs: ['top', 'top', 'bottom', 'bottom'], area: 'party', label: 'T10', x: 330, y: 560 },
];

export default function PutneyFloorPlan({
  bookings = [],
  selectedDate,
  selectedTime,
  highlightTableId,
  onAssign,
  readOnly = false,
  showTablePanel = true,
  onTableClick,
}: PutneyFloorPlanProps) {
  const [localSelected, setLocalSelected] = useState<string | null>(null);
  const [blockedTables, setBlockedTables] = useState<BlockedTable[]>([]);
  const [blockReason, setBlockReason] = useState('');
  const [showBlockInput, setShowBlockInput] = useState(false);

  useEffect(() => { setBlockedTables(loadBlockedTables()); }, []);

  const allTables = [...MAIN_TABLES, ...PARTY_TABLES];

  const bookingsByTable = useMemo(() => {
    const map = new Map<string, BookingInquiry[]>();
    if (!selectedDate) return map;
    bookings
      .filter(b => b.date === selectedDate && b.studio === 'Putney')
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
    if (readOnly) { onTableClick?.(tid); return; }
    if (blockedIdsForDate.has(tid)) return;
    setLocalSelected(prev => prev === tid ? null : tid);
    onTableClick?.(tid);
    if (onAssign) onAssign(tid);
  };

  const selectedTable = localSelected ? allTables.find(t => `T${t.id}` === localSelected) : null;
  const selectedBookings = localSelected ? (bookingsByTable.get(localSelected) || []).sort((a, b) => a.time.localeCompare(b.time)) : [];
  const selectedBlock = localSelected ? blockedTables.find(b => b.tableId === localSelected && b.date === selectedDate) : null;

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
      <TableShape key={t.id} def={t} status={status} count={count} onClick={() => handleClick(t.id)} />
    );
  };

  return (
    <div className="bg-white border border-[#1B2D3C]/20 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-heading font-black text-[#1B2D3C] text-base">Putney Studio</h3>
          <p className="text-[10px] text-[#1B2D3C]/50 font-semibold mt-0.5">10 tables · 234 Upper Richmond Road</p>
        </div>
        {selectedTable && (
          <div className="bg-[#1B2D3C] text-white px-3 py-1.5 rounded-lg text-xs font-bold">
            {selectedTable.label} selected · {selectedTable.chairs.length} seats
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] font-semibold text-[#1B2D3C]/70">
        <div className="flex items-center gap-1.5"><div className="w-4 h-3 bg-white border border-[#1B2D3C] rounded-sm" /><span>Free</span></div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-3 bg-yellow-100 border border-yellow-600 rounded-sm" /><span>Has bookings</span></div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-3 bg-red-500 border border-red-700 rounded-sm" /><span>Selected slot taken</span></div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-3 bg-gray-500 border border-gray-700 rounded-sm" /><span>Blocked</span></div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-3 bg-[#1B2D3C] rounded-sm" /><span>Selected</span></div>
      </div>

      <div className="overflow-x-auto">
        <svg width="470" height="700" className="block mx-auto">
          {/* Main area border */}
          <rect x={10} y={10} width={440} height={490} rx={8} fill="#F8FAFB" stroke="#1B2D3C" strokeWidth={1} strokeDasharray="4 3" />
          <text x={225} y={30} textAnchor="middle" fontSize={10} fontWeight="700" fill="#1B2D3C99" letterSpacing="2">MAIN AREA</text>

          {/* Bar fixture — right column, below T6 */}
          <rect x={270} y={270} width={88} height={190} rx={4} fill="#DBE7E4" stroke="#1B2D3C" strokeWidth={1.2} />
          <text x={314} y={370} textAnchor="middle" fontSize={13} fontWeight="800" fill="#1B2D3C" letterSpacing="3">BAR</text>

          {MAIN_TABLES.map(renderTable)}

          {/* Divider line */}
          <line x1={10} y1={510} x2={450} y2={510} stroke="#1B2D3C" strokeWidth={1.5} />

          {/* Party area */}
          <rect x={10} y={520} width={440} height={165} rx={8} fill="#f0fdf4" stroke="#16a34a" strokeWidth={1} strokeDasharray="4 3" />
          <text x={225} y={540} textAnchor="middle" fontSize={10} fontWeight="700" fill="#16a34a99" letterSpacing="2">PARTY AREA</text>

          {PARTY_TABLES.map(renderTable)}
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
                  <button onClick={handleUnblock}
                    className="px-3 py-1.5 bg-white border border-red-300 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded hover:bg-red-50 cursor-pointer">
                    Unblock ({selectedBlock.reason})
                  </button>
                ) : (
                  <>
                    {showBlockInput ? (
                      <div className="flex gap-2">
                        <input type="text" value={blockReason} onChange={e => setBlockReason(e.target.value)}
                          placeholder="Reason" className="px-2 py-1 text-[10px] border border-[#1B2D3C]/20 rounded w-28" />
                        <button onClick={handleBlock} className="px-2 py-1 bg-gray-600 text-white text-[10px] font-bold rounded cursor-pointer">Block</button>
                        <button onClick={() => setShowBlockInput(false)} className="px-2 py-1 text-[10px] font-bold text-[#1B2D3C] cursor-pointer">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setShowBlockInput(true)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-[10px] font-bold uppercase tracking-wider rounded hover:bg-gray-300 cursor-pointer">
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
