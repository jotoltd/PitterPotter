import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const duration = 3000;
    const interval = 30;
    const step = 100 / (duration / interval);
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p <= step) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return p - step;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [onClose]);

  const icon =
    toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
    toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> :
    <Info className="w-4 h-4" />;

  const bgClass =
    toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
    toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
    'bg-[#D6E2E9] border-[#1B2D3C]/20 text-[#1B2D3C]';

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border shadow-lg rounded-lg min-w-[280px] max-w-md ${bgClass}`}>
      {icon}
      <span className="text-xs font-bold flex-1">{toast.message}</span>
      <button onClick={onClose} className="p-1 hover:bg-black/5 rounded cursor-pointer">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
