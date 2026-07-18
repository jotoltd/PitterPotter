import { useState, useEffect, useRef, ChangeEvent, useMemo } from 'react';
import { Camera, Loader2, Upload, X, Image as ImageIcon, Pencil, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { getCachedContent, setCachedContent } from '../lib/contentCache';
import { compressImage } from '../lib/imageCompression';
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
  onDelete?: (contentKey: string) => void;
}

interface ExistingImage {
  id: string;
  key: string;
  page: string;
  value: string;
  set: 'static' | 'putney' | 'wimbledon' | 'product' | 'uploaded';
}

export default function EditableImage({ contentKey, page, defaultSrc, alt, className, adminMode, onSave, onDelete }: EditableImageProps) {
  const { showToast } = useToast();
  const [src, setSrc] = useState(() => getCachedContent(page, contentKey, defaultSrc));
  const [loading, setLoading] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
            setCachedContent(page, contentKey, data.value);
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

  const getImageSet = (key: string, page: string): ExistingImage['set'] => {
    if (page === 'static') {
      if (key.startsWith('putney_gallery')) return 'putney';
      if (key.startsWith('wimbledon_gallery')) return 'wimbledon';
      if (key.startsWith('product_gallery')) return 'product';
      return 'static';
    }
    return 'uploaded';
  };

  const loadGallery = async () => {
    setGalleryLoading(true);
    try {
      const staticImages: ExistingImage[] = [
        { id: 'static-studio-hero', key: 'studio_hero', page: 'static', value: Images.studioHero, set: 'static' },
        { id: 'static-birthday', key: 'birthday_parties', page: 'static', value: Images.birthdayParties, set: 'static' },
        { id: 'static-clay', key: 'clay_imprint', page: 'static', value: Images.clayImprint, set: 'static' },
        { id: 'static-gallery', key: 'pottery_gallery', page: 'static', value: Images.potteryGallery, set: 'static' },
        { id: 'static-putney', key: 'putney_studio', page: 'static', value: Images.putneyStudio, set: 'static' },
        { id: 'static-wimbledon', key: 'wimbledon_studio', page: 'static', value: Images.wimbledonStudio, set: 'static' },
        ...Images.putneyGallery.map((src, i) => ({ id: `static-putney-${i}`, key: `putney_gallery_${i}`, page: 'static' as const, value: src, set: 'putney' as const })),
        ...Images.wimbledonGallery.map((src, i) => ({ id: `static-wimbledon-${i}`, key: `wimbledon_gallery_${i}`, page: 'static' as const, value: src, set: 'wimbledon' as const })),
        ...Images.productGallery.map((src, i) => ({ id: `static-product-${i}`, key: `product_gallery_${i}`, page: 'static' as const, value: src, set: 'product' as const })),
      ];

      if (isSupabaseEnabled()) {
        const { data } = await supabase!
          .from('content')
          .select('id, key, page, value')
          .eq('type', 'image')
          .order('updated_at', { ascending: false });
        const uploadedImages: ExistingImage[] = (data || []).map((img: any) => ({
          id: img.id,
          key: img.key,
          page: img.page,
          value: img.value,
          set: getImageSet(img.key, img.page),
        }));
        setExistingImages([...staticImages, ...uploadedImages]);
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
        if (!res.ok || data.error) {
          console.error('admin-content image save error:', data);
          throw new Error(data.details || data.error || 'Save failed');
        }
      } else if (isSupabaseEnabled()) {
        await supabase!.from('content').upsert({ key: contentKey, value: imageUrl, type: 'image', page, updated_at: new Date().toISOString() });
      }

      setSrc(imageUrl);
      setCachedContent(page, contentKey, imageUrl);
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
      const dataUrl = await compressImage(file);

      if (!isSupabaseEnabled()) {
        setSrc(dataUrl);
        setCachedContent(page, contentKey, dataUrl);
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
        if (!uploadRes.ok || uploadData.error) {
          console.error('admin-content image upload error:', uploadData);
          throw new Error(uploadData.details || uploadData.error || 'Upload failed');
        }

        const saveRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ action: 'save', username: staff.username, sessionToken: staff.sessionToken, key: contentKey, page, value: uploadData.url, type: 'image' }),
        });
        const saveData = await saveRes.json();
        if (!saveRes.ok || saveData.error) {
          console.error('admin-content image save error:', saveData);
          throw new Error(saveData.details || saveData.error || 'Save failed');
        }

        setSrc(uploadData.url);
        setCachedContent(page, contentKey, uploadData.url);
        onSave?.(uploadData.url);
      } else {
        await supabase!.from('content').upsert({ key: contentKey, value: dataUrl, type: 'image', page, updated_at: new Date().toISOString() });
        setSrc(dataUrl);
        setCachedContent(page, contentKey, dataUrl);
        onSave?.(dataUrl);
      }
      await loadGallery();
      showToast('Image updated!', 'success');
    } catch (err) {
      console.error('Failed to upload image:', err);
      showToast('Failed to upload image', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (img: ExistingImage) => {
    if (img.page === 'static') {
      showToast('Cannot delete built-in image', 'error');
      return;
    }
    if (!confirm('Delete this image from the gallery?')) return;

    setLoading(true);
    try {
      const savedStaff = localStorage.getItem('pp_current_staff');
      const staff: Staff | null = savedStaff ? JSON.parse(savedStaff) : null;

      if (isSupabaseEnabled() && adminMode && staff?.sessionToken) {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ action: 'delete', username: staff.username, sessionToken: staff.sessionToken, key: img.key, page: img.page }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Delete failed');
      } else if (isSupabaseEnabled()) {
        await supabase!.from('content').delete().eq('key', img.key).eq('page', img.page);
      }

      setExistingImages((prev) => prev.filter((i) => i.id !== img.id));
      if (img.key === contentKey && img.page === page) {
        setSrc(defaultSrc);
        onDelete?.(contentKey);
      }
      showToast('Image deleted', 'success');
    } catch (err) {
      console.error('Failed to delete image:', err);
      showToast('Failed to delete image', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGallery = () => {
    setShowGallery(true);
    loadGallery();
  };

  const groupedImages = useMemo(() => {
    const groups: Record<ExistingImage['set'], ExistingImage[]> = {
      static: [],
      putney: [],
      wimbledon: [],
      product: [],
      uploaded: [],
    };
    existingImages.forEach((img) => {
      groups[img.set].push(img);
    });
    return groups;
  }, [existingImages]);

  const setLabels: Record<ExistingImage['set'], string> = {
    static: 'General',
    putney: 'Putney Studio',
    wimbledon: 'Wimbledon Studio',
    product: 'Product Gallery',
    uploaded: 'Uploaded Images',
  };

  const scrollSet = (set: ExistingImage['set'], direction: 'left' | 'right') => {
    const el = scrollRefs.current[set];
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  if (!adminMode) {
    return <img src={src} alt={alt} className={className} />;
  }

  return (
    <>
      <div
        data-editable="true"
        className="relative group inline-block cursor-pointer"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenGallery(); }}
        title="Click to change image"
      >
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
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-amber-400 text-white text-[9px] font-bold uppercase tracking-wider rounded opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <Pencil className="w-3 h-3" /> Edit
        </div>
      </div>

      {showGallery && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowGallery(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#1B2D3C]/10">
              <h3 className="font-heading text-base font-black text-[#1B2D3C] flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-500" /> Image Gallery
              </h3>
              <button onClick={() => setShowGallery(false)} className="p-1.5 rounded-full hover:bg-[#D6E2E9] cursor-pointer">
                <X className="w-4 h-4 text-[#1B2D3C]/50" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                (Object.keys(groupedImages) as ExistingImage['set'][]).map((set) => {
                  const images = groupedImages[set];
                  if (images.length === 0) return null;
                  return (
                    <div key={set} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#1B2D3C]/60">{setLabels[set]}</h4>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => scrollSet(set, 'left')}
                            className="p-1 rounded hover:bg-[#D6E2E9] text-[#1B2D3C]/60 transition-colors cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => scrollSet(set, 'right')}
                            className="p-1 rounded hover:bg-[#D6E2E9] text-[#1B2D3C]/60 transition-colors cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div
                        ref={(el) => { scrollRefs.current[set] = el; }}
                        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x"
                      >
                        {images.map((img, index) => (
                          <div
                            key={`${img.id}-${index}`}
                            className="relative flex-shrink-0 w-28 h-28 snap-start group"
                          >
                            <button
                              onClick={() => handleSelectImage(img.value)}
                              className="w-full h-full rounded-lg overflow-hidden border-2 border-[#1B2D3C]/10 hover:border-amber-400 transition-all cursor-pointer"
                              title={`${img.page} / ${img.key}`}
                            >
                              <img src={img.value} alt="" className="w-full h-full object-cover" />
                            </button>
                            {img.page !== 'static' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteImage(img); }}
                                disabled={loading}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 cursor-pointer disabled:opacity-50 z-10 shadow-sm"
                                title="Delete image"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-6 border-t border-[#1B2D3C]/10">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full py-3 bg-[#DBE7E4] text-[#1B2D3C] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#D6E2E9] cursor-pointer transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
