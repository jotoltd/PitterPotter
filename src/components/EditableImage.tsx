import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Camera, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { Staff } from '../types';
import { useToast } from './ToastContext';
import { Images } from '../images';

interface EditableImageProps {
  contentKey: string;
  page: string;
  defaultSrc: string;
  alt: string;
  className?: string;
  adminMode: boolean;
  onSave?: (value: string) => void;
}

interface ExistingImage {
  id: string;
  key: string;
  page: string;
  value: string;
}

export default function EditableImage({ contentKey, page, defaultSrc, alt, className, adminMode, onSave }: EditableImageProps) {
  const { showToast } = useToast();
  const [src, setSrc] = useState(defaultSrc);
  const [loading, setLoading] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
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

  useEffect(() => {
    if (showGallery) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [showGallery]);

  const loadGallery = async () => {
    setGalleryLoading(true);
    try {
      const staticImages: ExistingImage[] = [
        { id: 'static-studio-hero', key: 'studio_hero', page: 'static', value: Images.studioHero },
        { id: 'static-birthday', key: 'birthday_parties', page: 'static', value: Images.birthdayParties },
        { id: 'static-clay', key: 'clay_imprint', page: 'static', value: Images.clayImprint },
        { id: 'static-gallery', key: 'pottery_gallery', page: 'static', value: Images.potteryGallery },
        { id: 'static-putney', key: 'putney_studio', page: 'static', value: Images.putneyStudio },
        { id: 'static-wimbledon', key: 'wimbledon_studio', page: 'static', value: Images.wimbledonStudio },
        ...Images.putneyGallery.map((src, i) => ({ id: `static-putney-${i}`, key: `putney_gallery_${i}`, page: 'static', value: src })),
        ...Images.wimbledonGallery.map((src, i) => ({ id: `static-wimbledon-${i}`, key: `wimbledon_gallery_${i}`, page: 'static', value: src })),
        ...Images.productGallery.map((src, i) => ({ id: `static-product-${i}`, key: `product_gallery_${i}`, page: 'static', value: src })),
      ];

      if (isSupabaseEnabled()) {
        const { data } = await supabase!
          .from('content')
          .select('id, key, page, value')
          .eq('type', 'image')
          .order('updated_at', { ascending: false });
        setExistingImages([...staticImages, ...(data || [])]);
      } else {
        setExistingImages(staticImages);
      }
    } catch (err) {
      console.error('Failed to load gallery:', err);
      setExistingImages([]);
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleSelectImage = async (imageUrl: string) => {
    setLoading(true);
    try {
      const savedStaff = localStorage.getItem('pp_current_staff');
      const staff: Staff | null = savedStaff ? JSON.parse(savedStaff) : null;

      if (isSupabaseEnabled() && adminMode && staff?.sessionToken) {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ action: 'save', username: staff.username, sessionToken: staff.sessionToken, key: contentKey, page, value: imageUrl, type: 'image' }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Save failed');
      } else if (isSupabaseEnabled()) {
        await supabase!.from('content').upsert({ key: contentKey, value: imageUrl, type: 'image', page, updated_at: new Date().toISOString() });
      }

      setSrc(imageUrl);
      onSave?.(imageUrl);
      setShowGallery(false);
      showToast('Image updated!', 'success');
    } catch (err) {
      console.error('Failed to save image:', err);
      showToast('Failed to save image', 'error');
    } finally {
      setLoading(false);
    }
  };

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
      setShowGallery(false);
      showToast('Image updated!', 'success');
    } catch (err) {
      console.error('Failed to upload image:', err);
      showToast('Failed to upload image', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGallery = () => {
    setShowGallery(true);
    loadGallery();
  };

  if (!adminMode) {
    return <img src={src} alt={alt} className={className} />;
  }

  return (
    <>
      <div data-editable="true" className="relative group inline-block cursor-pointer" onClick={handleOpenGallery} title="Click to change image">
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

      {showGallery && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowGallery(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#1B2D3C]/10">
              <h3 className="font-heading text-base font-black text-[#1B2D3C] flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-500" /> Image Gallery
              </h3>
              <button onClick={() => setShowGallery(false)} className="p-1.5 rounded-full hover:bg-[#1B2D3C]/5 cursor-pointer">
                <X className="w-4 h-4 text-[#1B2D3C]/50" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {galleryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[#1B2D3C]/40 animate-spin" />
                </div>
              ) : existingImages.length === 0 ? (
                <div className="text-center py-12 text-[#1B2D3C]/40">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No images uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {existingImages.map((img, index) => (
                    <button
                      key={`${img.id}-${index}`}
                      onClick={() => handleSelectImage(img.value)}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#1B2D3C]/10 hover:border-amber-400 transition-all cursor-pointer group"
                      title={`${img.page} / ${img.key}`}
                    >
                      <img src={img.value} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[#1B2D3C]/10">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full py-3 bg-[#1B2D3C] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#486581] cursor-pointer transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" /> Upload New Image
              </button>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
