import { useState, useEffect, useRef } from 'react';
import { Check, X, Pencil } from 'lucide-react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { Staff } from '../types';
import { useToast } from './ToastContext';

interface EditableTextProps {
  contentKey: string;
  page: string;
  defaultValue: string;
  className?: string;
  adminMode: boolean;
  onSave?: (value: string) => void;
}

export default function EditableText({ contentKey, page, defaultValue, className, adminMode, onSave }: EditableTextProps) {
  const { showToast } = useToast();
  const [value, setValue] = useState(defaultValue);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isSupabaseEnabled()) {
      supabase!
        .from('content')
        .select('value')
        .eq('key', contentKey)
        .eq('page', page)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.value) {
            setValue(data.value);
            setEditValue(data.value);
          }
        });
    }
  }, [contentKey, page]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (!isSupabaseEnabled()) {
      setValue(editValue);
      setIsEditing(false);
      onSave?.(editValue);
      return;
    }

    setLoading(true);
    try {
      let saved = false;
      if (adminMode) {
        const savedStaff = localStorage.getItem('pp_current_staff');
        const staff: Staff | null = savedStaff ? JSON.parse(savedStaff) : null;
        if (staff?.sessionToken) {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              action: 'save',
              username: staff.username,
              sessionToken: staff.sessionToken,
              key: contentKey,
              page,
              value: editValue,
              type: 'text',
            }),
          });
          const data = await response.json();
          if (!response.ok || data.error) throw new Error(data.error || 'Failed to save content');
          saved = true;
        }
      }

      if (!saved) {
        const { error } = await supabase!
          .from('content')
          .upsert({
            key: contentKey,
            value: editValue,
            type: 'text',
            page,
            updated_at: new Date().toISOString(),
          });
        if (error) throw error;
      }

      setValue(editValue);
      setIsEditing(false);
      onSave?.(editValue);
      showToast('Saved!', 'success');
    } catch (err) {
      console.error('Failed to save content:', err);
      showToast('Failed to save changes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (!adminMode) {
    return <span className={className}>{value}</span>;
  }

  return (
    <>
      <span
        className={`${className} relative cursor-pointer outline outline-2 outline-dashed outline-amber-400/60 outline-offset-2 rounded hover:outline-amber-500 hover:bg-amber-50/30 transition-all`}
        onClick={() => { setEditValue(value); setIsEditing(true); }}
        title="Click to edit"
      >
        {value}
        <Pencil className="inline-block w-3 h-3 ml-1 text-amber-500 opacity-70" />
      </span>

      {isEditing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-base font-black text-[#1B2D3C] flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-500" /> Edit Text
              </h3>
              <button onClick={handleCancel} className="p-1.5 rounded-full hover:bg-[#1B2D3C]/5 cursor-pointer">
                <X className="w-4 h-4 text-[#1B2D3C]/50" />
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border-2 border-[#1B2D3C]/20 rounded-xl text-sm text-[#1B2D3C] font-medium focus:outline-none focus:border-amber-400 resize-y"
            />
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
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
