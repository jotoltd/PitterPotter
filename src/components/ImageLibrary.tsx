import { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2, Upload, X, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { Images } from '../images';

export interface LibraryImage {
  id: string;
  key: string;
  page: string;
  value: string;
  set: 'static' | 'putney' | 'wimbledon' | 'product' | 'uploaded';
}

interface ImageLibraryProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  onUpload?: (files: File[]) => void;
}

const setLabels: Record<LibraryImage['set'], string> = {
  static: 'General',
  putney: 'Putney Studio',
  wimbledon: 'Wimbledon Studio',
  product: 'Product Gallery',
  uploaded: 'Uploaded Images',
};

const getImageSet = (key: string, page: string): LibraryImage['set'] => {
  if (page === 'static') {
    if (key.startsWith('putney_gallery') || key.startsWith('putney')) return 'putney';
    if (key.startsWith('wimbledon_gallery') || key.startsWith('wimbledon')) return 'wimbledon';
    if (key.startsWith('product_gallery') || key.startsWith('product')) return 'product';
    return 'static';
  }
  if (page === 'putney' || key.startsWith('putney_gallery')) return 'putney';
  if (page === 'wimbledon' || key.startsWith('wimbledon_gallery')) return 'wimbledon';
  if (page === 'baby-prints' || key.startsWith('gallery')) return 'product';
  return 'uploaded';
};

const isPersistableUrl = (url: string) => /^https?:\/\//i.test(url) || /^data:/i.test(url);

export default function ImageLibrary({ open, onClose, onSelect, onUpload }: ImageLibraryProps) {
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRefs = useRef<Record<LibraryImage['set'], HTMLDivElement | null>>({
    static: null,
    putney: null,
    wimbledon: null,
    product: null,
    uploaded: null,
  });

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      loadImages();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const staticImages: LibraryImage[] = [
        { id: 'static-studio-hero', key: 'studio_hero', page: 'static', value: Images.studioHero, set: 'static' },
        { id: 'static-birthday', key: 'birthday_parties', page: 'static', value: Images.birthdayParties, set: 'static' },
        { id: 'static-clay', key: 'clay_imprint', page: 'static', value: Images.clayImprint, set: 'static' },
        { id: 'static-gallery', key: 'pottery_gallery', page: 'static', value: Images.potteryGallery, set: 'static' },
        { id: 'static-putney-outside', key: 'putney_studio', page: 'static', value: Images.putneyStudio, set: 'static' },
        { id: 'static-wimbledon-outside', key: 'wimbledon_studio', page: 'static', value: Images.wimbledonStudio, set: 'static' },
        ...Images.putneyGallery.map((src, i) => ({ id: `static-putney-${i}`, key: `putney_gallery_${i}`, page: 'static' as const, value: src, set: 'putney' as const })),
        ...Images.wimbledonGallery.map((src, i) => ({ id: `static-wimbledon-${i}`, key: `wimbledon_gallery_${i}`, page: 'static' as const, value: src, set: 'wimbledon' as const })),
        ...Images.productGallery.map((src, i) => ({ id: `static-product-${i}`, key: `product_gallery_${i}`, page: 'static' as const, value: src, set: 'product' as const })),
      ];

      if (!isSupabaseEnabled()) {
        setImages(staticImages);
        return;
      }

      const { data } = await supabase!
        .from('content')
        .select('id, key, page, value, type')
        .order('updated_at', { ascending: false });

      const seen = new Set<string>();
      const uploadedImages: LibraryImage[] = [];

      (data || []).forEach((row: any) => {
        if (typeof row.value !== 'string') return;
        if (row.type === 'image' && isPersistableUrl(row.value)) {
          if (seen.has(row.value)) return;
          seen.add(row.value);
          uploadedImages.push({
            id: row.id || `${row.page}:${row.key}`,
            key: row.key,
            page: row.page,
            value: row.value,
            set: getImageSet(row.key, row.page),
          });
          return;
        }
        if (row.type === 'text' && row.value.trim().startsWith('[')) {
          try {
            const parsed = JSON.parse(row.value) as unknown;
            if (Array.isArray(parsed)) {
              parsed.forEach((url: unknown, i) => {
                if (typeof url === 'string' && isPersistableUrl(url) && !seen.has(url)) {
                  seen.add(url);
                  uploadedImages.push({
                    id: `${row.page}:${row.key}:${i}`,
                    key: row.key,
                    page: row.page,
                    value: url,
                    set: getImageSet(row.key, row.page),
                  });
                }
              });
            }
          } catch {
            // ignore malformed JSON
          }
        }
      });

      setImages([...staticImages, ...uploadedImages]);
    } catch (err) {
      console.error('Failed to load image library:', err);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const groupedImages = useMemo(() => {
    const groups: Record<LibraryImage['set'], LibraryImage[]> = {
      static: [],
      putney: [],
      wimbledon: [],
      product: [],
      uploaded: [],
    };
    images.forEach((img) => groups[img.set].push(img));
    return groups;
  }, [images]);

  const scrollSet = (set: LibraryImage['set'], direction: 'left' | 'right') => {
    const el = scrollRefs.current[set];
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -el.clientWidth * 0.8 : el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (files.length > 0 && onUpload) {
      onUpload(files);
    }
  };

  const handleSelect = (url: string) => {
    onSelect(url);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-[#1B2D3C]/10">
          <h3 className="font-heading text-base font-black text-[#1B2D3C] flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-amber-500" /> Image Library
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#D6E2E9] cursor-pointer">
            <X className="w-4 h-4 text-[#1B2D3C]/50" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#1B2D3C]/40 animate-spin" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 text-[#1B2D3C]/40">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No images found</p>
            </div>
          ) : (
            (Object.keys(groupedImages) as LibraryImage['set'][]).map((set) => {
              const group = groupedImages[set];
              if (group.length === 0) return null;
              return (
                <div key={set} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#1B2D3C]/60">{setLabels[set]}</h4>
                    <div className="flex items-center gap-1">
                      <button onClick={() => scrollSet(set, 'left')} className="p-1 rounded hover:bg-[#D6E2E9] text-[#1B2D3C]/60 transition-colors cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                      <button onClick={() => scrollSet(set, 'right')} className="p-1 rounded hover:bg-[#D6E2E9] text-[#1B2D3C]/60 transition-colors cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div ref={(el) => { scrollRefs.current[set] = el; }} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                    {group.map((img, index) => (
                      <button
                        key={`${img.id}-${index}`}
                        onClick={() => handleSelect(img.value)}
                        className="relative flex-shrink-0 w-28 h-28 snap-start rounded-lg overflow-hidden border-2 border-[#1B2D3C]/10 hover:border-amber-400 transition-all cursor-pointer group"
                        title={`${img.page} / ${img.key}`}
                      >
                        <img src={img.value} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {onUpload && (
          <div className="p-6 border-t border-[#1B2D3C]/10">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full py-3 bg-[#DBE7E4] text-[#1B2D3C] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#D6E2E9] cursor-pointer transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" /> Upload New Image
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
          </div>
        )}
      </div>
    </div>
  );
}
