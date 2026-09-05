import { useEffect, useState, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: () => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
  const [progress, setProgress] = useState(100);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  const duration = toast.type === 'error' ? 6000 : 3000;
  const interval = 30;
  const step = 100 / (duration / interval);

  useEffect(() => {
    const timer = setInterval(() => {
      if (pausedRef.current) return;
      setProgress((p) => {
        if (p <= step) {
          clearInterval(timer);
          setTimeout(onClose, 0);
          return 0;
        }
        return p - step;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [onClose, step]);

  const handleMouseEnter = () => {
    pausedRef.current = true;
    setPaused(true);
  };

  const handleMouseLeave = () => {
    pausedRef.current = false;
    setPaused(false);
  };

  const icon =
    toast.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> :
    toast.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> :
    <Info className="w-4 h-4 shrink-0" />;

  const bgClass =
    toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
    toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
    'bg-[#D6E2E9] border-[#1B2D3C]/20 text-[#1B2D3C]';

  const progressBar =
    toast.type === 'success' ? 'bg-emerald-400' :
    toast.type === 'error' ? 'bg-red-400' :
    'bg-[#1B2D3C]/30';

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative flex items-center gap-3 px-4 py-3 pr-10 border shadow-lg rounded-lg min-w-[280px] max-w-md overflow-hidden ${bgClass}`}
    >
      {icon}
      <span className="text-xs font-bold flex-1">{toast.message}</span>
      <button
        onClick={onClose}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-black/10 rounded cursor-pointer transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5">
        <div
          className={`h-full transition-none ${progressBar}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {paused && (
        <span className="absolute top-1 right-7 text-[8px] font-bold opacity-50">paused</span>
      )}
    </div>
  );
}
