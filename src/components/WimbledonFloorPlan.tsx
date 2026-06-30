import { useState } from 'react';
import { BookingInquiry } from '../types';

type TableSize = 'small' | 'large';
type ChairSide = 'top' | 'bottom' | 'left' | 'right';
type TableStatus = 'free' | 'assigned' | 'selected';

interface TableDef {
  id: number;
  size: TableSize;
  chairs: ChairSide[];
  label: string;
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
}

const SMALL_W = 52;
const SMALL_H = 52;
const LARGE_W = 88;
const LARGE_H = 52;
const CHAIR_R = 9;
const CHAIR_GAP = 5;

const STATUS_FILL: Record<TableStatus, string> = {
  free: '#FFFFFF',
  assigned: '#ef4444',
  selected: '#1B2D3C',
};
const STATUS_STROKE: Record<TableStatus, string> = {
  free: '#1B2D3C',
  assigned: '#b91c1c',
  selected: '#1B2D3C',
};
const STATUS_TEXT: Record<TableStatus, string> = {
  free: '#1B2D3C',
  assigned: '#FFFFFF',
  selected: '#FFFFFF',
};
const STATUS_SUB: Record<TableStatus, string> = {
  free: '#1B2D3C99',
  assigned: '#fecaca',
  selected: '#D6E2E9',
};

function tableWidth(size: TableSize) { return size === 'small' ? SMALL_W : LARGE_W; }
function tableHeight(size: TableSize) { return size === 'small' ? SMALL_H : LARGE_H; }

function Chair({ cx, cy, status }: { cx: number; cy: number; status: TableStatus }) {
  const fill = status === 'assigned' ? '#fca5a5' : status === 'selected' ? '#486581' : '#D6E2E9';
  return <circle cx={cx} cy={cy} r={CHAIR_R} fill={fill} stroke="#1B2D3C" strokeWidth={1.2} />;
}

function Table({
  def, status, booking, onClick,
}: {
  def: PositionedTable;
  status: TableStatus;
  booking?: BookingInquiry;
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
        {status === 'assigned' && booking ? booking.name.split(' ')[0] : `${def.chairs.length} seats`}
      </text>
    </g>
  );
}

const TABLES: PositionedTable[] = [
  // ── LEFT COLUMN ──────────────────────────────────────────────
  { id: 1, size: 'small', chairs: ['top', 'bottom'],                    label: 'T1',  x: 40,  y: 60  },
  { id: 2, size: 'large', chairs: ['top', 'top', 'bottom', 'bottom', 'right'], label: 'T2',  x: 40,  y: 165 },
  { id: 3, size: 'large', chairs: ['top', 'top', 'bottom', 'bottom', 'right'], label: 'T3',  x: 40,  y: 270 },
  { id: 4, size: 'large', chairs: ['top', 'top', 'bottom', 'bottom', 'right'], label: 'T4',  x: 40,  y: 370 },

  // ── RIGHT COLUMN ─────────────────────────────────────────────
  { id: 5,  size: 'small', chairs: ['top', 'right', 'bottom'],            label: 'T5',  x: 310, y: 60  },
  { id: 6,  size: 'small', chairs: ['left', 'right'],                     label: 'T6',  x: 310, y: 155 },
  { id: 7,  size: 'small', chairs: ['left', 'right'],                     label: 'T7',  x: 310, y: 240 },
  { id: 8,  size: 'small', chairs: ['left', 'left', 'right', 'right'],    label: 'T8',  x: 310, y: 325 },
  // ✕ separator rendered in JSX at y≈405
  { id: 9,  size: 'small', chairs: ['left', 'left', 'right', 'right'],    label: 'T9',  x: 310, y: 430 },
  { id: 10, size: 'small', chairs: ['left', 'right', 'bottom'],           label: 'T10', x: 310, y: 525 },
];

const PARTY_1_TABLES: PositionedTable[] = [
  { id: 11, size: 'large', chairs: ['top', 'top', 'bottom', 'bottom'],   label: 'T11', x: 40,  y: 680 },
  { id: 12, size: 'large', chairs: ['top', 'top', 'bottom', 'bottom'],   label: 'T12', x: 155, y: 680 },
];

const PARTY_2_TABLES: PositionedTable[] = [
  { id: 15, size: 'large', chairs: ['top', 'top', 'bottom', 'bottom'],   label: 'T15', x: 40,  y: 900 },
  { id: 16, size: 'large', chairs: ['top', 'top', 'bottom', 'bottom'],   label: 'T16', x: 155, y: 900 },
  { id: 17, size: 'large', chairs: ['top', 'top', 'bottom', 'bottom'],   label: 'T17', x: 310, y: 980 },
];

const RIGHT_LOWER_TABLES: PositionedTable[] = [
  { id: 13, size: 'small', chairs: ['left', 'right'],                     label: 'T13', x: 310, y: 680 },
  { id: 14, size: 'small', chairs: ['left', 'right', 'bottom'],           label: 'T14', x: 310, y: 775 },
];

export default function WimbledonFloorPlan({
  bookings = [],
  selectedDate,
  selectedTime,
  highlightTableId,
  onAssign,
  readOnly = false,
}: WimbledonFloorPlanProps) {
  const [localSelected, setLocalSelected] = useState<number | null>(null);

  const allTables = [...TABLES, ...PARTY_1_TABLES, ...PARTY_2_TABLES, ...RIGHT_LOWER_TABLES];

  const assignedMap = new Map<string, BookingInquiry>();
  if (selectedDate && selectedTime) {
    bookings
      .filter(b => b.date === selectedDate && b.time === selectedTime && b.tableId && b.studio === 'Wimbledon')
      .forEach(b => assignedMap.set(b.tableId!, b));
  }

  const getStatus = (tableId: string): TableStatus => {
    if (`T${localSelected}` === tableId) return 'selected';
    if (assignedMap.has(tableId)) return 'assigned';
    return 'free';
  };

  const handleClick = (id: number) => {
    if (readOnly) return;
    const tid = `T${id}`;
    if (assignedMap.has(tid)) return;
    setLocalSelected(prev => prev === id ? null : id);
    if (onAssign) onAssign(tid);
  };

  const selectedTable = localSelected ? allTables.find(t => t.id === localSelected) : null;
  const selectedBooking = highlightTableId ? assignedMap.get(highlightTableId) : undefined;

  const renderTable = (t: PositionedTable) => {
    const tid = `T${t.id}`;
    const status = highlightTableId === tid ? 'selected' : getStatus(tid);
    return (
      <Table
        key={t.id}
        def={t}
        status={status}
        booking={assignedMap.get(tid)}
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
        {(selectedTable || selectedBooking) && (
          <div className="bg-[#1B2D3C] text-white px-3 py-1.5 rounded-lg text-xs font-bold">
            {selectedBooking
              ? `T${highlightTableId?.replace('T', '')} → ${selectedBooking.name}`
              : selectedTable
                ? `T${selectedTable.id} selected · ${selectedTable.chairs.length} seats`
                : null}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] font-semibold text-[#1B2D3C]/70">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 bg-white border border-[#1B2D3C] rounded-sm" />
          <span>Free</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 bg-red-500 border border-red-700 rounded-sm" />
          <span>Assigned</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 bg-[#1B2D3C] rounded-sm" />
          <span>Selected</span>
        </div>
        {(!selectedDate || !selectedTime) && (
          <span className="text-amber-600 font-bold">← Pick a date &amp; time to see occupancy</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <svg width="450" height="1080" className="block mx-auto">

          {/* MAIN AREA */}
          <rect x={10} y={10} width={420} height={615} rx={8} fill="#F8FAFB" stroke="#1B2D3C" strokeWidth={1} strokeDasharray="4 3" />
          <text x={220} y={30} textAnchor="middle" fontSize={10} fontWeight="700" fill="#1B2D3C99" letterSpacing="2">MAIN AREA</text>

          {/* BAR */}
          <rect x={10} y={480} width={170} height={60} rx={4} fill="#DBE7E4" stroke="#1B2D3C" strokeWidth={1.2} />
          <text x={95} y={515} textAnchor="middle" fontSize={13} fontWeight="800" fill="#1B2D3C" letterSpacing="3">BAR</text>

          {/* SEPARATOR */}
          <line x1={290} y1={400} x2={390} y2={400} stroke="#1B2D3C" strokeWidth={1.5} />
          <line x1={310} y1={398} x2={375} y2={415} stroke="#1B2D3C55" strokeWidth={1} />
          <line x1={375} y1={398} x2={310} y2={415} stroke="#1B2D3C55" strokeWidth={1} />
          <text x={342} y={410} textAnchor="middle" fontSize={9} fontWeight="700" fill="#1B2D3C80">SEPARATOR</text>

          {TABLES.map(renderTable)}

          <line x1={10} y1={635} x2={430} y2={635} stroke="#1B2D3C" strokeWidth={1.5} />

          {/* PARTY AREA 1 */}
          <rect x={10} y={645} width={280} height={140} rx={8} fill="#f0fdf4" stroke="#16a34a" strokeWidth={1} strokeDasharray="4 3" />
          <text x={150} y={665} textAnchor="middle" fontSize={10} fontWeight="700" fill="#16a34a99" letterSpacing="2">PARTY AREA 1</text>

          {PARTY_1_TABLES.map(renderTable)}

          <line x1={10} y1={800} x2={280} y2={800} stroke="#1B2D3C" strokeWidth={1.5} />

          {/* PARTY AREA 2 */}
          <rect x={10} y={810} width={420} height={250} rx={8} fill="#eff6ff" stroke="#2563eb" strokeWidth={1} strokeDasharray="4 3" />
          <text x={220} y={832} textAnchor="middle" fontSize={10} fontWeight="700" fill="#2563eb99" letterSpacing="2">PARTY AREA 2</text>

          {PARTY_2_TABLES.map(renderTable)}

          {/* RIGHT LOWER */}
          {RIGHT_LOWER_TABLES.map(renderTable)}

        </svg>
      </div>

      <p className="text-[10px] text-[#1B2D3C]/40 font-medium text-center">
        {readOnly ? 'Floor plan view only' : 'Click a free table to assign it'}
      </p>
    </div>
  );
}
