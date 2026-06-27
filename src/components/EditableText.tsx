import { useState, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useToast } from './ToastContext';

interface EditableTextProps {
  key: string;
  page: string;
  defaultValue: string;
  className?: string;
  adminMode: boolean;
  onSave?: (value: string) => void;
}

export default function EditableText({ key: contentKey, page, defaultValue, className, adminMode, onSave }: EditableTextProps) {
  const { showToast } = useToast();
  const [value, setValue] = useState(defaultValue);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(defaultValue);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSupabaseEnabled()) {
      supabase!
        .from('content')
        .select('value')
        .eq('key', contentKey)
        .eq('page', page)
        .single()
        .then(({ data }) => {
          if (data?.value) {
            setValue(data.value);
            setEditValue(data.value);
          }
        });
    }
  }, [contentKey, page]);

  const handleSave = async () => {
    if (!isSupabaseEnabled()) {
      setValue(editValue);
      setIsEditing(false);
      onSave?.(editValue);
      return;
    }

    setLoading(true);
    try {
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

      setValue(editValue);
      setIsEditing(false);
      onSave?.(editValue);
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

  if (isEditing) {
    return (
      <div className="inline-flex items-center gap-2">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          className={`px-2 py-1 border-2 border-[#1B2D3C] bg-white text-[#1B2D3C] font-bold focus:outline-none ${className}`}
          autoFocus
        />
        <button
          onClick={handleSave}
          disabled={loading}
          className="p-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 cursor-pointer disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <span
      className={`${className} group relative cursor-pointer hover:bg-[#D6E2E9]/30 rounded px-1 -mx-1`}
      onClick={() => setIsEditing(true)}
    >
      {value}
      <Edit2 className="w-3 h-3 absolute -top-2 -right-2 text-[#1B2D3C] opacity-0 group-hover:opacity-100 transition-opacity" />
    </span>
  );
}
