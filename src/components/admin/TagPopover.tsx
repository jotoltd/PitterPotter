import { useState, useRef, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';

export interface TagInfo {
  label?: string;
  status: string;
  x: number;
  y: number;
}

const COLOR_PALETTE = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-emerald-100 text-emerald-700',
  'bg-red-100 text-red-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
  'bg-amber-100 text-amber-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
];

export const TAG_COLORS: Record<string, string> = {
  painted: 'bg-blue-100 text-blue-700',
  glazing: 'bg-purple-100 text-purple-700',
  firing: 'bg-orange-100 text-orange-700',
  ready: 'bg-emerald-100 text-emerald-700',
  needs_touchup: 'bg-red-100 text-red-700',
};

export const TAG_LABELS: Record<string, string> = {
  painted: 'Painted',
  glazing: 'Glazing',
  firing: 'Firing',
  ready: 'Ready',
  needs_touchup: 'Touch-up',
};

export const TAG_STATUSES = ['painted', 'glazing', 'firing', 'ready', 'needs_touchup'];

export function getTagColor(status: string): string {
  if (TAG_COLORS[status]) return TAG_COLORS[status];
  let hash = 0;
  for (let i = 0; i < status.length; i++) {
    hash = ((hash << 5) - hash) + status.charCodeAt(i);
    hash |= 0;
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}

interface TagPopoverProps {
  x: number;
  y: number;
  existingTags: string[];
  onAdd: (label: string, status: string) => void;
  onClose: () => void;
}

export default function TagPopover({ x, y, existingTags, onAdd, onClose }: TagPopoverProps) {
  const [tagValue, setTagValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const filteredSuggestions = existingTags
    .filter(t => t.toLowerCase().includes(tagValue.toLowerCase()) && t !== tagValue)
    .slice(0, 6);

  const handleAdd = () => {
    const trimmed = tagValue.trim();
    if (!trimmed) return;
    onAdd('', trimmed);
    setTagValue('');
    setShowSuggestions(true);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div
      ref={popoverRef}
      className="absolute z-30 bg-white rounded-lg shadow-xl border border-[#1B2D3C]/20 p-2 min-w-[180px]"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[8px] font-bold uppercase tracking-wider text-[#1B2D3C]/50">Add Tag</span>
        <button onClick={onClose} className="text-[#1B2D3C]/40 hover:text-[#1B2D3C] cursor-pointer">
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="relative mb-1.5">
        <input
          ref={inputRef}
          type="text"
          value={tagValue}
          onChange={(e) => { setTagValue(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder="Tag (e.g. Kitchen, Face...)"
          className="w-full px-2 py-1.5 text-[10px] font-bold border border-[#1B2D3C]/20 rounded-md text-[#1B2D3C] focus:outline-none focus:border-[#1B2D3C]"
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-[#1B2D3C]/20 rounded-md shadow-lg z-40 max-h-40 overflow-y-auto">
            {filteredSuggestions.map(s => (
              <button
                key={s}
                onMouseDown={(e) => { e.preventDefault(); setTagValue(s); setShowSuggestions(false); inputRef.current?.focus(); }}
                className="w-full text-left px-2 py-1 text-[10px] font-bold text-[#1B2D3C] hover:bg-[#D6E2E9] cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-1">
        <button
          onClick={handleAdd}
          disabled={!tagValue.trim()}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-[#1B2D3C] text-white text-[9px] font-bold uppercase tracking-wider rounded-md hover:bg-[#486581] cursor-pointer disabled:opacity-40"
        >
          <Plus className="w-3 h-3" /> Add Tag
        </button>
        <button
          onClick={onClose}
          className="flex items-center justify-center px-2 py-1.5 bg-[#D6E2E9] text-[#1B2D3C] text-[9px] font-bold uppercase tracking-wider rounded-md hover:bg-[#C4D5DE] cursor-pointer"
        >
          <Check className="w-3 h-3" /> Done
        </button>
      </div>
    </div>
  );
}
