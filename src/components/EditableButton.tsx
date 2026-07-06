import { useState, useEffect } from 'react';
import { Check, X, Pencil, ExternalLink, ArrowRight } from 'lucide-react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { Staff, Page } from '../types';
import { useToast } from './ToastContext';

const INTERNAL_PAGES: { value: Page; label: string }[] = [
  { value: 'home', label: 'Home' },
  { value: 'book', label: 'Book a Session' },
  { value: 'baby-prints', label: 'Baby Prints' },
  { value: 'baby-prints-book', label: 'Book Baby Prints' },
  { value: 'parties', label: 'Parties' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'faqs', label: 'FAQs' },
  { value: 'contact', label: 'Contact' },
  { value: 'contact-info', label: 'Contact Info' },
  { value: 'putney', label: 'Putney Studio' },
  { value: 'wimbledon', label: 'Wimbledon Studio' },
  { value: 'buy-gift-card', label: 'Buy Gift Card' },
  { value: 'gift-card-balance', label: 'Gift Card Balance' },
  { value: 'food-drink', label: 'Food & Drink' },
];

interface EditableButtonProps {
  contentKey: string;
  page: string;
  defaultLabel: string;
  defaultHref?: string;
  adminMode: boolean;
  className?: string;
  onClick?: () => void;
  onNavigate?: (page: Page) => void;
  children?: React.ReactNode;
}

export default function EditableButton({
  contentKey,
  page,
  defaultLabel,
  defaultHref = '',
  adminMode,
  className = '',
  onClick,
  onNavigate,
  children,
}: EditableButtonProps) {
  const { showToast } = useToast();
  const [label, setLabel] = useState(defaultLabel);
  const [href, setHref] = useState(defaultHref);
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(defaultLabel);
  const [editHref, setEditHref] = useState(defaultHref);
  const [linkType, setLinkType] = useState<'internal' | 'external'>(
    defaultHref.startsWith('http') ? 'external' : 'internal'
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseEnabled()) return;
    supabase!
      .from('content')
      .select('value, metadata')
      .eq('key', contentKey)
      .eq('page', page)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setLabel(data.value);
        if ((data as any)?.metadata?.href) {
          const h = (data as any).metadata.href;
          setHref(h);
          setEditHref(h);
          setLinkType(h.startsWith('http') ? 'external' : 'internal');
        }
      });
  }, [contentKey, page]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const savedStaff = localStorage.getItem('pp_current_staff');
      const staff: Staff | null = savedStaff ? JSON.parse(savedStaff) : null;
      if (isSupabaseEnabled() && adminMode && staff?.sessionToken) {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({
            action: 'save',
            username: staff.username,
            sessionToken: staff.sessionToken,
            key: contentKey,
            page,
            value: editLabel,
            type: 'button',
            metadata: { href: editHref },
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Failed to save');
      } else if (isSupabaseEnabled()) {
        await supabase!.from('content').upsert({
          key: contentKey,
          value: editLabel,
          type: 'button',
          page,
          updated_at: new Date().toISOString(),
        });
      }
      setLabel(editLabel);
      setHref(editHref);
      setIsEditing(false);
      showToast('Button saved!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save button', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (adminMode) { setEditLabel(label); setEditHref(href); setIsEditing(true); return; }
    if (href) {
      if (href.startsWith('http')) {
        window.open(href, '_blank', 'noopener noreferrer');
      } else if (onNavigate) {
        onNavigate(href as Page);
      }
    } else {
      onClick?.();
    }
  };

  return (
    <>
      <button
        type="button"
        data-editable="true"
        onClick={handleButtonClick}
        className={`${className} ${adminMode ? 'outline outline-2 outline-dashed outline-amber-400/70 outline-offset-2 cursor-pointer' : ''}`}
        title={adminMode ? 'Click to edit button' : undefined}
      >
        {children ?? label}
        {adminMode && <Pencil className="inline-block w-3 h-3 ml-1 text-amber-500 opacity-70" />}
      </button>

      {isEditing && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setIsEditing(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-base font-black text-[#1B2D3C] flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-500" /> Edit Button
              </h3>
              <button onClick={() => setIsEditing(false)} className="p-1.5 rounded-full hover:bg-[#1B2D3C]/5 cursor-pointer">
                <X className="w-4 h-4 text-[#1B2D3C]/50" />
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Button Label</label>
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-[#1B2D3C]/20 rounded-xl text-sm text-[#1B2D3C] font-medium focus:outline-none focus:border-amber-400"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-2">Link Destination</label>
              <div className="flex rounded-lg border border-[#1B2D3C]/20 overflow-hidden mb-3">
                <button
                  type="button"
                  onClick={() => setLinkType('internal')}
                  className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${linkType === 'internal' ? 'bg-[#1B2D3C] text-white' : 'bg-white text-[#1B2D3C]/50 hover:text-[#1B2D3C]'}`}
                >
                  <ArrowRight className="w-3 h-3" /> Internal Page
                </button>
                <button
                  type="button"
                  onClick={() => setLinkType('external')}
                  className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${linkType === 'external' ? 'bg-[#1B2D3C] text-white' : 'bg-white text-[#1B2D3C]/50 hover:text-[#1B2D3C]'}`}
                >
                  <ExternalLink className="w-3 h-3" /> External URL
                </button>
              </div>

              {linkType === 'internal' ? (
                <select
                  value={editHref}
                  onChange={(e) => setEditHref(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-[#1B2D3C]/20 rounded-xl text-sm text-[#1B2D3C] font-medium focus:outline-none focus:border-amber-400"
                >
                  <option value="">— No link (use existing action) —</option>
                  {INTERNAL_PAGES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="url"
                  value={editHref}
                  onChange={(e) => setEditHref(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2.5 border-2 border-[#1B2D3C]/20 rounded-xl text-sm text-[#1B2D3C] font-medium focus:outline-none focus:border-amber-400"
                />
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 border border-[#1B2D3C]/20 rounded-xl text-xs font-bold text-[#1B2D3C] hover:bg-[#F8FAFB] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 py-2.5 bg-[#1B2D3C] text-white rounded-xl text-xs font-bold hover:bg-[#486581] cursor-pointer transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> {loading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
