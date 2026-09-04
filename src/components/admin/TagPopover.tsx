import { useState, useRef, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';

export interface TagInfo {
  label?: string;
  status: string;
  x: number;
  y: number;
}

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

interface TagPopoverProps {
  x: number;
  y: number;
  existingLabels: string[];
  onAdd: (label: string, status: string) => void;
  onClose: () => void;
}

export default function TagPopover({ x, y, existingLabels, onAdd, onClose }: TagPopoverProps) {
  const [status, setStatus] = useState('ready');
  const [label, setLabel] = useState('');
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

  const filteredSuggestions = existingLabels
    .filter(l => l.toLowerCase().includes(label.toLowerCase()) && l !== label)
    .slice(0, 5);

  const handleAdd = () => {
    onAdd(label.trim(), status);
    setLabel('');
    inputRef.current?.focus();
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

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="w-full px-2 py-1.5 text-[10px] font-bold border border-[#1B2D3C]/20 rounded-md mb-1.5 bg-white text-[#1B2D3C] focus:outline-none focus:border-[#1B2D3C]"
      >
        {TAG_STATUSES.map(s => (
          <option key={s} value={s}>{TAG_LABELS[s] || s}</option>
        ))}
      </select>

      <div className="relative mb-1.5">
        <input
          ref={inputRef}
          type="text"
          value={label}
          onChange={(e) => { setLabel(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Label (e.g. person name)"
          className="w-full px-2 py-1.5 text-[10px] border border-[#1B2D3C]/20 rounded-md text-[#1B2D3C] focus:outline-none focus:border-[#1B2D3C]"
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-[#1B2D3C]/20 rounded-md shadow-lg z-40 max-h-32 overflow-y-auto">
            {filteredSuggestions.map(s => (
              <button
                key={s}
                onMouseDown={(e) => { e.preventDefault(); setLabel(s); setShowSuggestions(false); }}
                className="w-full text-left px-2 py-1 text-[10px] text-[#1B2D3C] hover:bg-[#D6E2E9] cursor-pointer"
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
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-[#1B2D3C] text-white text-[9px] font-bold uppercase tracking-wider rounded-md hover:bg-[#486581] cursor-pointer"
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
