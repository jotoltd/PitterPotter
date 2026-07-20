import { useState, useEffect, useRef } from 'react';
import { GALLERY_ITEMS } from '../data';
import { Images } from '../images';
import EditableText from './EditableText';
import EditableImage from './EditableImage';
import { Plus, Upload, GripVertical, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import ImageLibrary from './ImageLibrary';
import { compressImage } from '../lib/imageCompression';
import { Staff } from '../types';
import { useToast } from './ToastContext';

interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
}

interface GalleryViewProps {
  adminMode?: boolean;
}

export default function GalleryView({ adminMode = false }: GalleryViewProps) {
  const { showToast } = useToast();
  const [items, setItems] = useState<GalleryItem[]>(GALLERY_ITEMS.map((item, idx) => ({
    id: item.id,
    title: item.title,
    imageUrl: item.imageUrl
  })));
  const [showLibrary, setShowLibrary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const draggedOrderRef = useRef<string[]>([]);
  const loadVersionRef = useRef<number>(0);

  useEffect(() => {
    loadGalleryItems();
  }, []);

  const loadGalleryItems = async () => {
    if (!isSupabaseEnabled()) return;

    const version = ++loadVersionRef.current;
    try {
      const { data } = await supabase!
        .from('content')
        .select('key, value')
        .eq('page', 'gallery')
        .like('key', 'gallery_%_image');
      
      if (data && data.length > 0) {
        const loadedItems: GalleryItem[] = [];
        const ids = new Set<string>();
        
        data.forEach(item => {
          const match = item.key.match(/^gallery_(.+)_image$/);
          if (!match) return;
          const id = match[1];
          if (!ids.has(id)) {
            ids.add(id);
            loadedItems.push({
              id,
              title: '',
              imageUrl: item.value
            });
          }
        });
        
        // Load titles
        const { data: titleData } = await supabase!
          .from('content')
          .select('key, value')
          .eq('page', 'gallery')
          .like('key', 'gallery_%_title');
        
        if (titleData) {
          titleData.forEach(item => {
            const match = item.key.match(/^gallery_(.+)_title$/);
            if (!match) return;
            const id = match[1];
            const galleryItem = loadedItems.find(i => i.id === id);
            if (galleryItem) {
              galleryItem.title = item.value;
            }
          });
        }
        
        // Load order
        const { data: orderData } = await supabase!
          .from('content')
          .select('key, value')
          .eq('page', 'gallery')
          .eq('key', 'gallery_order');
        
        if (orderData && orderData[0]?.value) {
          const order = JSON.parse(orderData[0].value) as string[];
          loadedItems.sort((a, b) => {
            const aIdx = order.indexOf(a.id);
            const bIdx = order.indexOf(b.id);
            return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
          });
        }
        
        // Merge with default items - keep defaults that aren't in Supabase, add Supabase items
        const defaultIds = new Set(GALLERY_ITEMS.map(item => item.id));
        const supabaseIds = new Set(loadedItems.map(item => item.id));
        
        const mergedItems = [
          ...GALLERY_ITEMS.filter(item => !supabaseIds.has(item.id)).map(item => ({
            id: item.id,
            title: item.title,
            imageUrl: item.imageUrl
          })),
          ...loadedItems
        ];
        if (version === loadVersionRef.current) {
          setItems(mergedItems);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to load gallery items:', errorMessage, err);
    }
  };

  const handleAddImages = async (files: File[]) => {
    if (filteredItems.length >= 6) {
      showToast('Gallery can only hold 6 images', 'error');
      return;
    }
    setLoading(true);
    setUploadProgress(0);
    try {
      const newItems: GalleryItem[] = [];
      const remaining = 6 - filteredItems.length;
      const filesToUpload = files.slice(0, remaining);
      if (filesToUpload.length < files.length) {
        showToast(`Only ${remaining} of ${files.length} images can be added (6 max)`, 'error');
      }
      
      if (isSupabaseEnabled() && adminMode) {
        const savedStaff = localStorage.getItem('pp_current_staff');
        const staff: Staff | null = savedStaff ? JSON.parse(savedStaff) : null;
        
        if (staff?.sessionToken) {
          for (let i = 0; i < filesToUpload.length; i++) {
            const file = filesToUpload[i];
            const newId = `gallery${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const base64 = await compressImage(file);
            
            const uploadRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
              body: JSON.stringify({ action: 'upload', username: staff.username, sessionToken: staff.sessionToken, key: `gallery_${newId}_image`, page: 'gallery', fileData: base64, fileName: file.name }),
            });
            const uploadData = await uploadRes.json();
            if (uploadData.url) {
              const saveRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
                body: JSON.stringify({ action: 'save', username: staff.username, sessionToken: staff.sessionToken, key: `gallery_${newId}_image`, page: 'gallery', value: uploadData.url, type: 'image' }),
              });
              if (saveRes.ok) {
                newItems.push({ id: newId, title: '', imageUrl: uploadData.url });
              } else {
                const saveErr = await saveRes.json().catch(() => ({}));
                console.error('Failed to save gallery image:', saveErr);
                throw new Error(saveErr.error || 'Failed to save image metadata');
              }
            }

            setUploadProgress(Math.round(((i + 1) / files.length) * 100));
          }
        }
      }
      
      if (newItems.length > 0) {
        loadVersionRef.current++;
        const merged = [...items, ...newItems];
        setItems(merged);
        await saveOrder(merged);
        showToast(`${newItems.length} image${newItems.length > 1 ? 's' : ''} added!`, 'success');
        setShowLibrary(false);
      } else {
        setShowLibrary(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to add images:', errorMessage, err);
      showToast(`Failed to add images: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleSelectExisting = async (url: string) => {
    if (filteredItems.length >= 6) {
      showToast('Gallery can only hold 6 images', 'error');
      setShowLibrary(false);
      return;
    }
    setLoading(true);
    setUploadProgress(0);
    try {
      const newId = `gallery${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (isSupabaseEnabled() && adminMode) {
        const savedStaff = localStorage.getItem('pp_current_staff');
        const staff: Staff | null = savedStaff ? JSON.parse(savedStaff) : null;
        
        if (staff?.sessionToken) {
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
            body: JSON.stringify({ action: 'save', username: staff.username, sessionToken: staff.sessionToken, key: `gallery_${newId}_image`, page: 'gallery', value: url, type: 'image' }),
          });
          
          if (res.ok) {
            loadVersionRef.current++;
            const merged = [...items, { id: newId, title: '', imageUrl: url }];
            setItems(merged);
            await saveOrder(merged);
            setUploadProgress(100);
            showToast('Image added from library!', 'success');
            setShowLibrary(false);
          } else {
            throw new Error('Failed to save image URL');
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to add image from URL:', errorMessage, err);
      showToast(`Failed to add image from URL: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const removeImage = async (id: string) => {
    setLoading(true);
    try {
      if (isSupabaseEnabled() && adminMode) {
        const savedStaff = localStorage.getItem('pp_current_staff');
        const staff: Staff | null = savedStaff ? JSON.parse(savedStaff) : null;

        if (staff?.sessionToken) {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
            body: JSON.stringify({ action: 'delete', username: staff.username, sessionToken: staff.sessionToken, key: `gallery_${id}_image`, page: 'gallery' }),
          });
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
            body: JSON.stringify({ action: 'delete', username: staff.username, sessionToken: staff.sessionToken, key: `gallery_${id}_title`, page: 'gallery' }),
          });
        }
      }

      const newItems = items.filter(i => i.id !== id);
      loadVersionRef.current++;
      setItems(newItems);
      await saveOrder(newItems);
      showToast('Image removed', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to delete image:', errorMessage, err);
      showToast(`Failed to delete image: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = (id: string) => {
    if (!confirm('Remove this image?')) return;
    removeImage(id);
  };

  const saveOrder = async (currentItems: GalleryItem[]) => {
    if (!isSupabaseEnabled() || !adminMode) return;
    
    try {
      const savedStaff = localStorage.getItem('pp_current_staff');
      const staff: Staff | null = savedStaff ? JSON.parse(savedStaff) : null;
      
      if (staff?.sessionToken) {
        const order = currentItems.map(i => i.id);
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ action: 'save', username: staff.username, sessionToken: staff.sessionToken, key: 'gallery_order', page: 'gallery', value: JSON.stringify(order), type: 'text' }),
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to save order:', errorMessage, err);
    }
  };

  const filteredItems = items.filter(item => item.imageUrl);
  const displayedItems = filteredItems.slice(0, 6);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...filteredItems];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);
    draggedOrderRef.current = newItems.map(i => i.id);
    loadVersionRef.current++;
    setItems(newItems);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    const currentItems = draggedOrderRef.current.length > 0 ? items.filter(i => draggedOrderRef.current.includes(i.id)) : items;
    await saveOrder(currentItems);
    draggedOrderRef.current = [];
  };

  return (
    <div id="gallery-view" className="space-y-8 pb-20 pt-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center flex items-center justify-between gap-4">
        <div className="flex-1">
          <EditableText contentKey="gallery_title" page="gallery" defaultValue="Gallery" adminMode={adminMode} className="font-heading text-3xl font-black text-[#1B2D3C]" />
        </div>
        {adminMode && filteredItems.length < 6 && (
          <button
            onClick={() => setShowLibrary(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#DBE7E4] text-[#1B2D3C] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#D6E2E9] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Image
          </button>
        )}
      </div>

      <ImageLibrary
        open={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelect={handleSelectExisting}
        onUpload={handleAddImages}
      />

      {/* Gallery thumbnails */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {displayedItems.map((item, index) => (
            <div
              key={item.id}
              draggable={adminMode}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`aspect-square overflow-hidden rounded-lg relative group ${adminMode ? 'cursor-move' : ''}`}
            >
              <button
                onClick={() => setLightboxIndex(index)}
                className="w-full h-full cursor-pointer"
              >
                <EditableImage
                  contentKey={`gallery_${item.id}_image`}
                  page="gallery"
                  defaultSrc={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  adminMode={adminMode}
                  onSave={(value) => setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, imageUrl: value } : i))}
                  onDelete={() => removeImage(item.id)}
                />
              </button>
              {adminMode && (
                <>
                  <div className="absolute top-2 left-2 p-1 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-4 h-4 text-[#1B2D3C]" />
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteImage(item.id); }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 cursor-pointer"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 bg-black/90 z-[120] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setLightboxIndex(null); }}>
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
            className="absolute top-4 right-4 z-20 p-2.5 bg-white text-[#1B2D3C] hover:bg-[#f0f0f0] rounded-xl transition-colors shadow-lg cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex === 0 ? filteredItems.length - 1 : lightboxIndex - 1); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-white/90 hover:bg-white text-[#1B2D3C] rounded-full transition-colors shadow-lg cursor-pointer"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex === filteredItems.length - 1 ? 0 : lightboxIndex + 1); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-white/90 hover:bg-white text-[#1B2D3C] rounded-full transition-colors shadow-lg cursor-pointer"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          
          <div className="max-w-5xl max-h-[90vh] w-full">
            <img
              src={filteredItems[lightboxIndex].imageUrl}
              alt={filteredItems[lightboxIndex].title}
              className="w-full h-full object-contain max-h-[90vh]"
            />
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {filteredItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setLightboxIndex(idx)}
                className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                  idx === lightboxIndex ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
