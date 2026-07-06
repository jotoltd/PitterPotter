import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { Staff } from '../types';
import { useToast } from './ToastContext';

interface EditableImageProps {
  contentKey: string;
  page: string;
  defaultSrc: string;
  alt: string;
  className?: string;
  adminMode: boolean;
  onSave?: (value: string) => void;
}

export default function EditableImage({ contentKey, page, defaultSrc, alt, className, adminMode, onSave }: EditableImageProps) {
  const { showToast } = useToast();
  const [src, setSrc] = useState(defaultSrc);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            setSrc(data.value);
          }
        });
    }
  }, [contentKey, page]);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setLoading(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      if (!isSupabaseEnabled()) {
        setSrc(dataUrl);
        onSave?.(dataUrl);
        showToast('Image updated!', 'success');
        return;
      }

      const savedStaff = localStorage.getItem('pp_current_staff');
      const staff: Staff | null = savedStaff ? JSON.parse(savedStaff) : null;

      if (adminMode && staff?.sessionToken) {
        const uploadRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ action: 'upload', username: staff.username, sessionToken: staff.sessionToken, key: contentKey, page, fileData: dataUrl, fileName: file.name }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || uploadData.error) throw new Error(uploadData.error || 'Upload failed');

        const saveRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ action: 'save', username: staff.username, sessionToken: staff.sessionToken, key: contentKey, page, value: uploadData.url, type: 'image' }),
        });
        const saveData = await saveRes.json();
        if (!saveRes.ok || saveData.error) throw new Error(saveData.error || 'Save failed');

        setSrc(uploadData.url);
        onSave?.(uploadData.url);
      } else {
        await supabase!.from('content').upsert({ key: contentKey, value: dataUrl, type: 'image', page, updated_at: new Date().toISOString() });
        setSrc(dataUrl);
        onSave?.(dataUrl);
      }
      showToast('Image updated!', 'success');
    } catch (err) {
      console.error('Failed to upload image:', err);
      showToast('Failed to upload image', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!adminMode) {
    return <img src={src} alt={alt} className={className} />;
  }

  return (
    <div className="relative group inline-block cursor-pointer" onClick={() => !loading && fileInputRef.current?.click()} title="Click to change image">
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
      <img src={src} alt={alt} className={className} />
      <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 rounded transition-opacity ${
        loading ? 'bg-black/40 opacity-100' : 'bg-black/0 group-hover:bg-black/40 opacity-0 group-hover:opacity-100'
      }`}>
        {loading
          ? <Loader2 className="w-8 h-8 text-white animate-spin" />
          : <>
              <Camera className="w-8 h-8 text-white" />
              <span className="text-white text-xs font-bold uppercase tracking-wider">Change Image</span>
            </>
        }
      </div>
      <div className="absolute top-2 right-2 px-2 py-1 bg-amber-400 text-white text-[9px] font-bold uppercase tracking-wider rounded opacity-0 group-hover:opacity-100 transition-opacity">
        Edit
      </div>
    </div>
  );
}
