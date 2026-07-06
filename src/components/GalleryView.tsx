import { useState, useEffect } from 'react';
import { GALLERY_ITEMS } from '../data';
import { Images } from '../images';
import EditableText from './EditableText';
import EditableImage from './EditableImage';
import { Plus, Trash2, Upload, GripVertical, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
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
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [addMethod, setAddMethod] = useState<'file' | 'url'>('file');

  useEffect(() => {
    loadGalleryItems();
  }, []);

  const loadGalleryItems = async () => {
    if (!isSupabaseEnabled()) return;
    
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
          const id = item.key.replace('_image', '');
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
            const id = item.key.replace('_title', '');
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
        
        setItems(mergedItems);
      }
    } catch (err) {
      console.error('Failed to load gallery items:', err);
    }
  };

  const handleAddImages = async (files: File[]) => {
    setLoading(true);
    setUploadProgress(0);
    try {
      const newItems: GalleryItem[] = [];
      
      if (isSupabaseEnabled() && adminMode) {
        const savedStaff = localStorage.getItem('pp_current_staff');
        const staff: Staff | null = savedStaff ? JSON.parse(savedStaff) : null;
        
        if (staff?.sessionToken) {
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const newId = `gallery${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const reader = new FileReader();
            const base64 = await new Promise<string>((resolve) => {
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsDataURL(file);
            });
            
            const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
              body: JSON.stringify({ action: 'upload', username: staff.username, sessionToken: staff.sessionToken, key: `gallery_${newId}_image`, page: 'gallery', fileData: base64, fileName: file.name }),
            });
            const data = await res.json();
            if (data.url) {
              newItems.push({ id: newId, title: '', imageUrl: data.url });
            }
            
            setUploadProgress(Math.round(((i + 1) / files.length) * 100));
          }
        }
      }
      
      if (newItems.length > 0) {
        setItems([...items, ...newItems]);
        await saveOrder([...items, ...newItems]);
        showToast(`${newItems.length} image${newItems.length > 1 ? 's' : ''} added!`, 'success');
      }
    } catch (err) {
      console.error('Failed to add images:', err);
      showToast('Failed to add images', 'error');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleAddFromUrl = async (url: string) => {
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
            setItems([...items, { id: newId, title: '', imageUrl: url }]);
            await saveOrder([...items, { id: newId, title: '', imageUrl: url }]);
            setUploadProgress(100);
            showToast('Image added from URL!', 'success');
          } else {
            throw new Error('Failed to save image URL');
          }
        }
      }
    } catch (err) {
      console.error('Failed to add image from URL:', err);
      showToast('Failed to add image from URL', 'error');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm('Remove this image?')) return;
    
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
      setItems(newItems);
      await saveOrder(newItems);
      showToast('Image removed', 'success');
    } catch (err) {
      console.error('Failed to delete image:', err);
      showToast('Failed to delete image', 'error');
    } finally {
      setLoading(false);
    }
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
      console.error('Failed to save order:', err);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);
    setItems(newItems);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    await saveOrder(items);
  };

  return (
    <div id="gallery-view" className="space-y-8 pb-20 pt-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center flex items-center justify-between gap-4">
        <div className="flex-1">
          <EditableText contentKey="gallery_title" page="gallery" defaultValue="Gallery" adminMode={adminMode} className="font-heading text-3xl font-black text-[#1B2D3C]" />
        </div>
        {adminMode && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B2D3C] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#486581] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Image
          </button>
        )}
      </div>

      {/* Add Image Form */}
      {isAdding && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="bg-white border-2 border-[#1B2D3C]/20 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-base font-black text-[#1B2D3C]">Add New Image</h3>
              <button onClick={() => { setIsAdding(false); setUploadProgress(0); setImageUrl(''); }} className="p-1.5 rounded-full hover:bg-[#1B2D3C]/5 cursor-pointer">
                <Trash2 className="w-4 h-4 text-[#1B2D3C]/50" />
              </button>
            </div>
            
            {/* Method Toggle */}
            <div className="flex rounded-lg border border-[#1B2D3C]/20 overflow-hidden">
              <button
                type="button"
                onClick={() => setAddMethod('file')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${addMethod === 'file' ? 'bg-[#1B2D3C] text-white' : 'bg-white text-[#1B2D3C]/50 hover:text-[#1B2D3C]'}`}
              >
                <Upload className="w-3 h-3" /> Upload File
              </button>
              <button
                type="button"
                onClick={() => setAddMethod('url')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${addMethod === 'url' ? 'bg-[#1B2D3C] text-white' : 'bg-white text-[#1B2D3C]/50 hover:text-[#1B2D3C]'}`}
              >
                <Plus className="w-3 h-3" /> From URL
              </button>
            </div>
            
            {addMethod === 'file' ? (
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Images</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.multiple = true;
                      input.onchange = (e) => {
                        const files = Array.from((e.target as HTMLInputElement).files || []);
                        if (files.length > 0) {
                          handleAddImages(files);
                          setIsAdding(false);
                        }
                      };
                      input.click();
                    }}
                    disabled={loading}
                    className="w-20 h-20 border-2 border-dashed border-[#1B2D3C]/20 rounded-lg flex items-center justify-center hover:border-[#1B2D3C] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-5 h-5 text-[#1B2D3C]/40" />
                  </button>
                  <p className="text-xs text-[#1B2D3C]/60">Click to upload images (multiple allowed)</p>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 border-2 border-[#1B2D3C]/20 rounded-xl text-sm text-[#1B2D3C] font-medium focus:outline-none focus:border-amber-400"
                  disabled={loading}
                />
                <button
                  onClick={() => {
                    if (imageUrl.trim()) {
                      handleAddFromUrl(imageUrl.trim());
                      setImageUrl('');
                      setIsAdding(false);
                    }
                  }}
                  disabled={loading || !imageUrl.trim()}
                  className="mt-3 w-full py-3 bg-[#1B2D3C] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#486581] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add Image'}
                </button>
              </div>
            )}
            
            {/* Progress Bar */}
            {loading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[#1B2D3C]/60">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-[#1B2D3C]/10 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-[#1B2D3C] h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Masonry columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
          {items.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              draggable={adminMode}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`break-inside-avoid mb-3 relative group ${adminMode ? 'cursor-move' : ''}`}
            >
              <button
                onClick={() => setLightboxIndex(index)}
                className="w-full text-left cursor-pointer"
              >
                <EditableImage
                  contentKey={`gallery_${item.id}_image`}
                  page="gallery"
                  defaultSrc={item.imageUrl}
                  alt={item.title}
                  className="w-full rounded-lg object-cover"
                  adminMode={adminMode}
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
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => setLightboxIndex(lightboxIndex === 0 ? items.length - 1 : lightboxIndex - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <button
            onClick={() => setLightboxIndex(lightboxIndex === items.length - 1 ? 0 : lightboxIndex + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          
          <div className="max-w-5xl max-h-[90vh] w-full">
            <img
              src={items[lightboxIndex].imageUrl}
              alt={items[lightboxIndex].title}
              className="w-full h-full object-contain max-h-[90vh]"
            />
          </div>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {items.map((_, idx) => (
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
