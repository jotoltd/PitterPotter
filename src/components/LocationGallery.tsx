import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, Plus, Link, GripVertical, Upload } from 'lucide-react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { compressImage } from '../lib/imageCompression';
import { Staff } from '../types';
import { useToast } from './ToastContext';

interface LocationGalleryProps {
  location: 'putney' | 'wimbledon';
  defaultImages: string[];
  adminMode: boolean;
}

export default function LocationGallery({ location, defaultImages, adminMode }: LocationGalleryProps) {
  const { showToast } = useToast();
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [addMode, setAddMode] = useState<'upload' | 'url' | null>(null);
  const draggedOrderRef = useRef<string[]>([]);
  const [urlValue, setUrlValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadVersionRef = useRef(0);

  const contentKey = `${location}_gallery`;
  const page = location;
  const title = location === 'putney' ? 'Our Putney Studio' : 'Our Wimbledon Studio';

  useEffect(() => {
    loadImages();
  }, [location]);

  const isPersistableUrl = (url: string) => /^https?:\/\//i.test(url) || /^data:/i.test(url);

  const loadImages = async () => {
    if (!isSupabaseEnabled()) return;
    const version = ++loadVersionRef.current;
    try {
      const { data } = await supabase!
        .from('content')
        .select('value')
        .eq('key', contentKey)
        .eq('page', page)
        .maybeSingle();
      if (version !== loadVersionRef.current) return;
      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value) as unknown;
          const validImages = Array.isArray(parsed)
            ? parsed.filter((image): image is string => typeof image === 'string' && isPersistableUrl(image.trim()))
            : [];
          if (validImages.length > 0) {
            setImages(validImages);
          }
        } catch (err) {
          console.error('Failed to parse gallery JSON:', err);
        }
      }
    } catch (err) {
      console.error('Failed to load gallery:', err);
    }
  };

  const saveImages = async (nextImages: string[]) => {
    if (!isSupabaseEnabled()) {
      setImages(nextImages);
      return true;
    }

    setLoading(true);
    try {
      // Invalidate any in-flight load so an older read doesn't overwrite this save.
      loadVersionRef.current++;
      const savedStaff = localStorage.getItem('pp_current_staff');
      const staff: Staff | null = savedStaff ? JSON.parse(savedStaff) : null;

      const persistableImages = nextImages.filter(isPersistableUrl);

      let usedDirectSave = false;
      if (adminMode && staff?.sessionToken) {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({
            action: 'save',
            username: staff.username,
            sessionToken: staff.sessionToken,
            key: contentKey,
            page,
            value: JSON.stringify(persistableImages),
            type: 'text',
          }),
        });
        if (res.status === 401) {
          usedDirectSave = true;
        } else {
          const data = await res.json();
          if (!res.ok || data.error) throw new Error(data.error || 'Save failed');
        }
      } else {
        usedDirectSave = true;
      }
      if (usedDirectSave) {
        const { error } = await supabase!
          .from('content')
          .upsert({
            key: contentKey,
            page,
            value: JSON.stringify(persistableImages),
            type: 'text',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'key,page' });
        if (error) throw error;
      }

      setImages(persistableImages);
      showToast('Gallery updated!', 'success');
      return true;
    } catch (err) {
      console.error('Failed to save gallery:', err);
      showToast('Failed to update gallery', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleAddUrl = async () => {
    const rawUrl = urlValue.trim();
    if (!rawUrl) return;
    if (!isPersistableUrl(rawUrl)) {
      showToast('Please enter a valid image URL', 'error');
      return;
    }
    const nextImages = [...images, rawUrl];
    if (await saveImages(nextImages)) {
      setUrlValue('');
      setAddMode(null);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    e.target.value = '';

    setLoading(true);
    try {
      const savedStaff = localStorage.getItem('pp_current_staff');
      const staff: Staff | null = savedStaff ? JSON.parse(savedStaff) : null;

      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const dataUrl = await compressImage(file);

        let imageUrl = dataUrl;

        if (isSupabaseEnabled() && adminMode && staff?.sessionToken) {
          const uploadRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
            body: JSON.stringify({
              action: 'upload',
              username: staff.username,
              sessionToken: staff.sessionToken,
              key: `${location}_gallery_${Date.now()}`,
              page,
              fileData: dataUrl,
              fileName: file.name,
            }),
          });
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok || uploadData.error || !uploadData.url) {
            throw new Error(uploadData.error || uploadData.details || 'Image upload failed');
          }
          imageUrl = uploadData.url;
        }

        newUrls.push(imageUrl);
      }

      const merged = [...images, ...newUrls];
      setImages(merged);
      await saveImages(merged);
      setAddMode(null);
    } catch (err) {
      console.error('Failed to upload image:', err);
      showToast('Failed to upload image', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm('Are you sure you want to remove this image from the gallery?')) return;
    const nextImages = images.filter((_, i) => i !== index);
    await saveImages(nextImages);
    if (lightboxIndex === index) {
      setLightboxIndex(null);
    } else if (lightboxIndex !== null && lightboxIndex > index) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const nextImages = [...images];
    const [dragged] = nextImages.splice(draggedIndex, 1);
    nextImages.splice(index, 0, dragged);
    draggedOrderRef.current = nextImages;
    setImages(nextImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    const nextImages = draggedOrderRef.current.length > 0 ? draggedOrderRef.current : images;
    await saveImages(nextImages);
    draggedOrderRef.current = [];
  };

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const failedSrc = event.currentTarget.src;
    event.currentTarget.onerror = null;
    console.error('Gallery image failed to load:', failedSrc);
  };

  const galleryImages = images.length > 0 ? images : defaultImages;
  const displayedImages = adminMode ? galleryImages : galleryImages.slice(0, 6);
  const lightboxImages = galleryImages;

  return (
    <div className="space-y-8">
      {/* Thumbnail grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {displayedImages.map((src, idx) => (
          <div
            key={`${src}-${idx}`}
            draggable={adminMode}
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            className={`aspect-square overflow-hidden rounded-lg relative group ${adminMode ? 'cursor-move' : ''}`}
          >
            <button
              onClick={() => setLightboxIndex(idx)}
              className="w-full h-full cursor-pointer"
            >
              <img
                src={src}
                alt={`${title} gallery ${idx + 1}`}
                onError={(event) => handleImageError(event)}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </button>
            {adminMode && (
              <div className="absolute top-2 right-2 flex gap-1">
                <div className="p-1.5 bg-[#1B2D3C]/70 text-white rounded-md cursor-grab" title="Drag to reorder">
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
                <button
                  onClick={() => handleDelete(idx)}
                  disabled={loading}
                  className="p-1.5 bg-red-500/80 text-white rounded-md hover:bg-red-600 transition-colors cursor-pointer"
                  title="Delete image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
        {adminMode && (
          <div className="aspect-square rounded-lg border-2 border-dashed border-[#1B2D3C]/20 flex flex-col items-center justify-center gap-2 bg-[#F8FAFB] hover:bg-[#eef3f6] transition-colors">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="flex flex-col items-center gap-2 text-[#1B2D3C]/60 hover:text-[#1B2D3C] cursor-pointer disabled:opacity-50 transition-colors"
            >
              <Upload className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-wider">{loading ? 'Uploading...' : 'Add Image'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Hidden file input (shared) */}
      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />

      {/* Admin controls — URL option + mobile upload */}
      {adminMode && (
        <div className="border border-[#1B2D3C]/10 rounded-xl p-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="md:hidden flex items-center gap-2 px-3 py-2 bg-[#DBE7E4] text-[#1B2D3C] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#D6E2E9] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4" /> {loading ? 'Uploading...' : 'Add Image'}
            </button>
            <button
              onClick={() => setAddMode(addMode === 'url' ? null : 'url')}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 border border-[#1B2D3C]/20 text-[#1B2D3C] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#F8FAFB] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Link className="w-4 h-4" /> Add by URL
            </button>
          </div>
          {addMode === 'url' && (
            <div className="flex gap-2">
              <input
                type="text"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 border border-[#1B2D3C]/20 rounded-lg text-sm text-[#1B2D3C] focus:outline-none focus:border-[#1B2D3C]/50"
              />
              <button
                onClick={handleAddUrl}
                disabled={loading || !urlValue.trim()}
                className="px-4 py-2 bg-[#DBE7E4] text-[#1B2D3C] text-xs font-bold rounded-lg hover:bg-[#D6E2E9] cursor-pointer disabled:opacity-50"
              >
                Add
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lightbox — rendered via portal to escape stacking contexts */}
      {lightboxIndex !== null && createPortal(
        <div
          className="fixed inset-0 bg-[#1B2D3C]/90 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
            style={{ zIndex: 10000 }}
            className="absolute top-4 right-4 p-2.5 bg-white text-[#1B2D3C] hover:bg-[#f0f0f0] rounded-xl transition-colors shadow-lg cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + images.length) % images.length); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 hover:bg-white text-[#1B2D3C] rounded-full transition-colors shadow-lg cursor-pointer"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <img
            src={images[lightboxIndex]}
            alt={`Gallery image ${lightboxIndex + 1}`}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % images.length); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 hover:bg-white text-[#1B2D3C] rounded-full transition-colors shadow-lg cursor-pointer"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
