import { useState, useEffect, useRef } from 'react';
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
  const [images, setImages] = useState<string[]>(defaultImages);
  const [loading, setLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [addMode, setAddMode] = useState<'upload' | 'url' | null>(null);
  const draggedOrderRef = useRef<string[]>([]);
  const [urlValue, setUrlValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contentKey = `${location}_gallery`;
  const page = location;
  const title = location === 'putney' ? 'Our Putney Studio' : 'Our Wimbledon Studio';

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    if (!isSupabaseEnabled()) return;
    try {
      const { data } = await supabase!
        .from('content')
        .select('value')
        .eq('key', contentKey)
        .eq('page', page)
        .maybeSingle();
      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value) as string[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setImages(parsed);
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
      const savedStaff = localStorage.getItem('pp_current_staff');
      const staff: Staff | null = savedStaff ? JSON.parse(savedStaff) : null;

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
            value: JSON.stringify(nextImages),
            type: 'text',
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Save failed');
      } else {
        const { error } = await supabase!
          .from('content')
          .upsert({
            key: contentKey,
            page,
            value: JSON.stringify(nextImages),
            type: 'text',
            updated_at: new Date().toISOString(),
          });
        if (error) throw error;
      }

      setImages(nextImages);
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
    if (!urlValue.trim()) return;
    const nextImages = [...images, urlValue.trim()];
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
          if (!uploadRes.ok || uploadData.error) throw new Error(uploadData.error || 'Upload failed');
          imageUrl = uploadData.url;
        }

        newUrls.push(imageUrl);
      }

      await saveImages([...images, ...newUrls]);
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
    if (mobileIndex >= nextImages.length) {
      setMobileIndex(Math.max(0, nextImages.length - 1));
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

  return (
    <div className="space-y-8">
      {/* Desktop grid */}
      <div className="hidden md:grid grid-cols-3 gap-4">
        {images.map((src, idx) => (
          <div
            key={`${src}-${idx}`}
            draggable={adminMode}
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            className={`aspect-[4/3] overflow-hidden rounded-lg relative group ${adminMode ? 'cursor-move' : ''}`}
          >
            <button
              onClick={() => setLightboxIndex(idx)}
              className="w-full h-full cursor-pointer"
            >
              <img
                src={src}
                alt={`${title} gallery ${idx + 1}`}
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
      </div>

      {/* Mobile carousel */}
      <div className="md:hidden relative">
        <div className="aspect-[4/3] overflow-hidden rounded-lg">
          <button
            onClick={() => setLightboxIndex(mobileIndex)}
            className="w-full h-full cursor-pointer"
          >
            <img
              src={images[mobileIndex]}
              alt={`${title} gallery ${mobileIndex + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        </div>
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => setMobileIndex((mobileIndex - 1 + images.length) % images.length)}
            className="p-2 bg-[#DBE7E4] text-[#1B2D3C] rounded-lg hover:bg-[#D6E2E9] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-[#1B2D3C]">
            {mobileIndex + 1} / {images.length}
          </span>
          <button
            onClick={() => setMobileIndex((mobileIndex + 1) % images.length)}
            className="p-2 bg-[#DBE7E4] text-[#1B2D3C] rounded-lg hover:bg-[#D6E2E9] transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Admin controls */}
      {adminMode && (
        <div className="bg-white border-2 border-[#1B2D3C]/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAddMode(addMode === 'upload' ? null : 'upload')}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-[#1B2D3C] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#486581] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4" /> Upload Image
            </button>
            <button
              onClick={() => setAddMode(addMode === 'url' ? null : 'url')}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 border border-[#1B2D3C]/20 text-[#1B2D3C] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#F8FAFB] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Link className="w-4 h-4" /> Add URL
            </button>
          </div>

          {addMode === 'upload' && (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full py-3 border-2 border-dashed border-[#1B2D3C]/20 rounded-xl text-xs font-bold text-[#1B2D3C] hover:bg-[#F8FAFB] cursor-pointer transition-colors"
              >
                {loading ? 'Uploading...' : 'Click to select an image'}
              </button>
            </div>
          )}

          {addMode === 'url' && (
            <div className="flex gap-2">
              <input
                type="text"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-4 py-2 border-2 border-[#1B2D3C]/20 rounded-xl text-sm text-[#1B2D3C] focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={handleAddUrl}
                disabled={loading || !urlValue.trim()}
                className="px-4 py-2 bg-[#1B2D3C] text-white text-xs font-bold rounded-lg hover:bg-[#486581] cursor-pointer disabled:opacity-50"
              >
                Add
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-[#1B2D3C]/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
            className="absolute top-4 right-4 z-20 p-2.5 bg-white text-[#1B2D3C] hover:bg-[#f0f0f0] rounded-xl transition-colors shadow-lg cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + images.length) % images.length); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-white/90 hover:bg-white text-[#1B2D3C] rounded-full transition-colors shadow-lg cursor-pointer"
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
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-white/90 hover:bg-white text-[#1B2D3C] rounded-full transition-colors shadow-lg cursor-pointer"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
}
