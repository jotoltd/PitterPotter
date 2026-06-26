import { useState, useEffect } from 'react';
import { Edit2, Check, X, Image as ImageIcon } from 'lucide-react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';

interface EditableImageProps {
  key: string;
  page: string;
  defaultSrc: string;
  alt: string;
  className?: string;
  adminMode: boolean;
  onSave?: (value: string) => void;
}

export default function EditableImage({ key: contentKey, page, defaultSrc, alt, className, adminMode, onSave }: EditableImageProps) {
  const [src, setSrc] = useState(defaultSrc);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(defaultSrc);
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
            setSrc(data.value);
            setEditValue(data.value);
          }
        });
    }
  }, [contentKey, page]);

  const handleSave = async () => {
    if (!isSupabaseEnabled()) {
      setSrc(editValue);
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
          type: 'image',
          page,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setSrc(editValue);
      setIsEditing(false);
      onSave?.(editValue);
    } catch (err) {
      console.error('Failed to save content:', err);
      alert('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(src);
    setIsEditing(false);
  };

  if (!adminMode) {
    return <img src={src} alt={alt} className={className} />;
  }

  if (isEditing) {
    return (
      <div className="inline-block">
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            className="flex-1 px-2 py-1 border-2 border-[#1B2D3C] bg-white text-[#1B2D3C] text-sm font-bold focus:outline-none"
            placeholder="Image URL"
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
        <img src={editValue || defaultSrc} alt={alt} className={className} />
      </div>
    );
  }

  return (
    <div className="relative group inline-block">
      <img src={src} alt={alt} className={className} />
      <button
        onClick={() => setIsEditing(true)}
        className="absolute top-2 right-2 p-2 bg-[#1B2D3C]/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-[#1B2D3C]"
      >
        <Edit2 className="w-4 h-4" />
      </button>
    </div>
  );
}
