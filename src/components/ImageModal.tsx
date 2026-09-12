import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface PhotoTagData {
  label?: string;
  status: string;
  x: number;
  y: number;
}

interface ImageModalProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
  photoTags?: Record<number, PhotoTagData[]>;
}

const TAG_COLORS: Record<string, string> = {
  painted: 'bg-blue-500 text-white',
  glazing: 'bg-purple-500 text-white',
  firing: 'bg-orange-500 text-white',
  ready: 'bg-emerald-500 text-white',
  needs_touchup: 'bg-red-500 text-white',
};

const TAG_LABELS: Record<string, string> = {
  painted: 'Painted',
  glazing: 'Glazing',
  firing: 'Firing',
  ready: 'Ready',
  needs_touchup: 'Touch-up',
};

function getTagColor(status: string): string {
  return TAG_COLORS[status] || 'bg-white/90 text-[#1B2D3C]';
}

export default function ImageModal({ images, initialIndex, onClose, photoTags }: ImageModalProps) {
  const [index, setIndex] = useState(initialIndex);

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex(i => (i - 1 + images.length) % images.length);
  };

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex(i => (i + 1) % images.length);
  };

  const tags = photoTags?.[index] || [];

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[210] p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer shadow-lg"
      >
        <X className="w-6 h-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="fixed left-4 top-1/2 -translate-y-1/2 z-[210] p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer shadow-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={next}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-[210] p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer shadow-lg"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
        <img
          src={images[index]}
          alt={`Photo ${index + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
        {tags.map((t, ti) => (
          <div
            key={ti}
            className="absolute flex items-center gap-0.5"
            style={{ left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <span
              className={`px-2 py-1 text-xs font-black uppercase tracking-wider rounded-full flex items-center gap-0.5 whitespace-nowrap shadow-lg ${getTagColor(t.status)}`}
            >
              {t.label ? `${TAG_LABELS[t.status] || t.status} - ${t.label}` : (TAG_LABELS[t.status] || t.status)}
            </span>
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[210] px-3 py-1.5 bg-white/20 rounded-full text-white text-xs font-bold">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
