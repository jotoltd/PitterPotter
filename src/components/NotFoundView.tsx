import { Home } from 'lucide-react';
import { Page } from '../types';
import EditableText from './EditableText';

interface NotFoundViewProps {
  setCurrentPage: (page: Page) => void;
  adminMode?: boolean;
}

export default function NotFoundView({ setCurrentPage, adminMode = false }: NotFoundViewProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-20">
      <div className="text-center space-y-6 max-w-md">
        <div className="font-heading text-7xl font-black text-[#1B2D3C]">404</div>
        <h1 className="font-heading text-2xl font-black text-[#1B2D3C]"><EditableText contentKey="notfound_title" page="not-found" defaultValue="Page Not Found" adminMode={adminMode} className="font-heading text-2xl text-[#1B2D3C]" /></h1>
        <p className="text-[#1B2D3C]/85 text-sm leading-relaxed">
          <EditableText contentKey="notfound_text" page="not-found" defaultValue="We couldn't find the page you were looking for. It might have been moved or doesn't exist." adminMode={adminMode} className="text-sm text-[#1B2D3C]/85 leading-relaxed" />
        </p>
        <button
          onClick={() => setCurrentPage('home')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#DBE7E4] text-[#1B2D3C] font-bold text-xs uppercase tracking-widest border border-[#1B2D3C]/20 hover:bg-[#D6E2E9] transition-all cursor-pointer"
        >
          <Home className="w-4 h-4" /> <EditableText contentKey="notfound_button" page="not-found" defaultValue="Back to Home" adminMode={adminMode} className="text-xs uppercase tracking-widest" />
        </button>
      </div>
    </div>
  );
}
