import { useState, useEffect } from 'react';
import { POTTERY_ITEMS } from '../data';
import { Page, PotteryItem } from '../types';
import { X, ChevronLeft, ChevronRight, Plus, Trash2, Upload } from 'lucide-react';
import EditableText from './EditableText';
import EditableImage from './EditableImage';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { Staff } from '../types';
import { useToast } from './ToastContext';

interface PricingViewProps {
  setCurrentPage?: (page: Page) => void;
  initialPainters?: number;
  adminMode?: boolean;
}

interface PricingItem {
  id: string;
  name: string;
  price: string;
  category: string;
  description: string;
  imageUrls: string[];
  isPartyEligible: boolean;
}

export default function PricingView({ adminMode = false }: PricingViewProps) {
  const { showToast } = useToast();
  const [items, setItems] = useState<PricingItem[]>(POTTERY_ITEMS.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    category: item.category,
    description: item.description,
    imageUrls: item.imageUrls || [],
    isPartyEligible: item.isPartyEligible || false
  })));
  const [selectedItem, setSelectedItem] = useState<PricingItem | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // New item form state
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    category: 'tableware',
    description: '',
    isPartyEligible: false,
    imageFiles: [] as File[]
  });

  useEffect(() => {
    loadPricingItems();
  }, []);

  const loadPricingItems = async () => {
    if (!isSupabaseEnabled()) return;
    
    try {
      const { data } = await supabase!
        .from('content')
        .select('key, value')
        .eq('page', 'pricing')
        .like('key', 'item_%_name');
      
      if (data && data.length > 0) {
        const loadedItems: PricingItem[] = [];
        const ids = new Set<string>();
        
        data.forEach(item => {
          const match = item.key.match(/^item_(.+)_name$/);
          if (!match) return;
          const id = match[1];
          if (!ids.has(id)) {
            ids.add(id);
            loadedItems.push({
              id,
              name: item.value,
              price: '',
              category: 'tableware',
              description: '',
              imageUrls: [],
              isPartyEligible: false
            });
          }
        });
        
        // Load other fields
        const fields = ['price', 'category', 'description', 'party_eligible'];
        for (const field of fields) {
          const { data: fieldData } = await supabase!
            .from('content')
            .select('key, value')
            .eq('page', 'pricing')
            .like('key', `item_%_${field}`);
          
          if (fieldData) {
            fieldData.forEach(item => {
              const match = item.key.match(new RegExp(`^item_(.+)_${field}$`));
              if (!match) return;
              const id = match[1];
              const pricingItem = loadedItems.find(i => i.id === id);
              if (pricingItem) {
                if (field === 'party_eligible') {
                  pricingItem.isPartyEligible = item.value === 'true';
                } else {
                  (pricingItem as any)[field] = item.value;
                }
              }
            });
          }
        }
        
        // Load images
        const { data: imageData } = await supabase!
          .from('content')
          .select('key, value')
          .eq('page', 'pricing')
          .like('key', 'item_%_image_%');
        
        if (imageData) {
          imageData.forEach(item => {
            const match = item.key.match(/item_(.+)_image_(\d+)/);
            if (match) {
              const id = match[1];
              const idx = parseInt(match[2], 10);
              const pricingItem = loadedItems.find(i => i.id === id);
              if (pricingItem) {
                pricingItem.imageUrls[idx] = item.value;
              }
            }
          });
        }
        
        // Merge with default items - keep defaults that aren't in Supabase, add Supabase items
        const defaultIds = new Set(POTTERY_ITEMS.map(item => item.id));
        const supabaseIds = new Set(loadedItems.map(item => item.id));
        
        const mergedItems = [
          ...POTTERY_ITEMS.filter(item => !supabaseIds.has(item.id)).map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            category: item.category,
            description: item.description,
            imageUrls: item.imageUrls || [],
            isPartyEligible: item.isPartyEligible || false
          })),
          ...loadedItems
        ];
        
        setItems(mergedItems);
      }
    } catch (err) {
      console.error('Failed to load pricing items:', err);
    }
  };

  const categoryLabel = (category: string) => {
    switch (category) {
      case 'tableware': return 'Tableware';
      case 'decor': return 'Home Decor';
      case 'kids': return 'Kids';
      case 'seasonal': return 'Seasonal';
      default: return category;
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name.trim() || !newItem.price.trim()) {
      showToast('Please fill in name and price', 'error');
      return;
    }

    setLoading(true);
    try {
      const newId = `item${Date.now()}`;
      let imageUrls: string[] = [];
      
      // Upload images first if provided
      if (newItem.imageFiles.length > 0 && isSupabaseEnabled() && adminMode) {
        const savedStaff = localStorage.getItem('pp_current_staff');
        const staff: Staff | null = savedStaff ? JSON.parse(savedStaff) : null;
        
        if (staff?.sessionToken) {
          for (let i = 0; i < newItem.imageFiles.length; i++) {
            const file = newItem.imageFiles[i];
            const reader = new FileReader();
            const base64 = await new Promise<string>((resolve) => {
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsDataURL(file);
            });
            
            const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
              body: JSON.stringify({ action: 'upload', username: staff.username, sessionToken: staff.sessionToken, key: `item_${newId}_image_${i}`, page: 'pricing', fileData: base64, fileName: file.name }),
            });
            const data = await res.json();
            if (data.url) {
              imageUrls.push(data.url);
            }
          }
        }
      }
      
      if (isSupabaseEnabled() && adminMode) {
        const savedStaff = localStorage.getItem('pp_current_staff');
        const staff: Staff | null = savedStaff ? JSON.parse(savedStaff) : null;
        
        if (staff?.sessionToken) {
          const fields = [
            { key: `item_${newId}_name`, value: newItem.name },
            { key: `item_${newId}_price`, value: newItem.price },
            { key: `item_${newId}_category`, value: newItem.category },
            { key: `item_${newId}_description`, value: newItem.description },
            { key: `item_${newId}_party_eligible`, value: newItem.isPartyEligible.toString() },
          ];
          
          for (const field of fields) {
            const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
              body: JSON.stringify({ action: 'save', username: staff.username, sessionToken: staff.sessionToken, key: field.key, page: 'pricing', value: field.value, type: 'text' }),
            });
            if (!res.ok) throw new Error(`Failed to save ${field.key}`);
          }
        }
      }
      
      setItems([...items, {
        id: newId,
        name: newItem.name,
        price: newItem.price,
        category: newItem.category,
        description: newItem.description,
        imageUrls,
        isPartyEligible: newItem.isPartyEligible
      }]);
      setNewItem({ name: '', price: '', category: 'tableware', description: '', isPartyEligible: false, imageFiles: [] });
      setIsAdding(false);
      showToast('Item added!', 'success');
    } catch (err) {
      console.error('Failed to add item:', err);
      showToast('Failed to add item', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    setLoading(true);
    try {
      if (isSupabaseEnabled() && adminMode) {
        const savedStaff = localStorage.getItem('pp_current_staff');
        const staff: Staff | null = savedStaff ? JSON.parse(savedStaff) : null;
        
        if (staff?.sessionToken) {
          // Delete all fields for this item
          const keys = [
            `item_${id}_name`,
            `item_${id}_price`,
            `item_${id}_category`,
            `item_${id}_description`,
            `item_${id}_party_eligible`,
          ];
          
          for (const key of keys) {
            await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
              body: JSON.stringify({ action: 'delete', username: staff.username, sessionToken: staff.sessionToken, key, page: 'pricing' }),
            });
          }
          
          // Delete images
          const { data: imageData } = await supabase!
            .from('content')
            .select('key')
            .eq('page', 'pricing')
            .like('key', `item_${id}_image_%`);
          
          if (imageData) {
            for (const img of imageData) {
              await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
                body: JSON.stringify({ action: 'delete', username: staff.username, sessionToken: staff.sessionToken, key: img.key, page: 'pricing' }),
              });
            }
          }
        }
      }
      
      setItems(items.filter(i => i.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
      showToast('Item deleted', 'success');
    } catch (err) {
      console.error('Failed to delete item:', err);
      showToast('Failed to delete item', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = async (item: PricingItem, imageUrl: string) => {
    if (!isSupabaseEnabled() || !adminMode) return;
    
    setLoading(true);
    try {
      const savedStaff = localStorage.getItem('pp_current_staff');
      const staff: Staff | null = savedStaff ? JSON.parse(savedStaff) : null;
      
      if (staff?.sessionToken) {
        const imageIndex = item.imageUrls.length;
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ action: 'save', username: staff.username, sessionToken: staff.sessionToken, key: `item_${item.id}_image_${imageIndex}`, page: 'pricing', value: imageUrl, type: 'image' }),
        });
        if (!res.ok) throw new Error('Failed to save image');
        
        const updatedItems = items.map(i => 
          i.id === item.id 
            ? { ...i, imageUrls: [...i.imageUrls, imageUrl] }
            : i
        );
        setItems(updatedItems);
        setSelectedItem({ ...item, imageUrls: [...item.imageUrls, imageUrl] });
        showToast('Image added!', 'success');
      }
    } catch (err) {
      console.error('Failed to add image:', err);
      showToast('Failed to add image', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = async (item: PricingItem, imageIndex: number) => {
    if (!confirm('Remove this image?')) return;
    
    setLoading(true);
    try {
      if (isSupabaseEnabled() && adminMode) {
        const savedStaff = localStorage.getItem('pp_current_staff');
        const staff: Staff | null = savedStaff ? JSON.parse(savedStaff) : null;
        
        if (staff?.sessionToken) {
          // Delete the image
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
            body: JSON.stringify({ action: 'delete', username: staff.username, sessionToken: staff.sessionToken, key: `item_${item.id}_image_${imageIndex}`, page: 'pricing' }),
          });
          
          // Reindex remaining images
          const newImageUrls = item.imageUrls.filter((_, i) => i !== imageIndex);
          for (let i = 0; i < newImageUrls.length; i++) {
            await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
              body: JSON.stringify({ action: 'save', username: staff.username, sessionToken: staff.sessionToken, key: `item_${item.id}_image_${i}`, page: 'pricing', value: newImageUrls[i], type: 'image' }),
            });
          }
          
          // Delete the old highest index if it exists
          if (newImageUrls.length < item.imageUrls.length) {
            await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
              body: JSON.stringify({ action: 'delete', username: staff.username, sessionToken: staff.sessionToken, key: `item_${item.id}_image_${item.imageUrls.length - 1}`, page: 'pricing' }),
            });
          }
        }
      }
      
      const updatedItems = items.map(i => 
        i.id === item.id 
          ? { ...i, imageUrls: item.imageUrls.filter((_, idx) => idx !== imageIndex) }
          : i
      );
      setItems(updatedItems);
      setSelectedItem({ ...item, imageUrls: item.imageUrls.filter((_, idx) => idx !== imageIndex) });
      setSelectedImageIndex(0);
      showToast('Image removed', 'success');
    } catch (err) {
      console.error('Failed to remove image:', err);
      showToast('Failed to remove image', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="pricing-view" className="space-y-12 pb-20 pt-6">
      {/* Header */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 text-center space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <EditableText contentKey="pricing_title" page="pricing" defaultValue="Prices" adminMode={adminMode} className="font-heading text-3xl md:text-4xl text-[#1B2D3C] tracking-tight" />
          </div>
          {adminMode && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1B2D3C] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#486581] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          )}
        </div>
        <div className="bg-[#DBE7E4]/40 border border-[#1B2D3C]/10 p-4 rounded-lg text-center">
          <p className="text-sm text-[#1B2D3C]/90 leading-relaxed">
            <EditableText contentKey="pricing_studio_fee_notice" page="pricing" defaultValue="A £5.95 per person studio fee applies to all sessions." adminMode={adminMode} className="text-sm text-[#1B2D3C]/90 leading-relaxed" />
          </p>
        </div>
      </div>

      {/* Add Item Form */}
      {isAdding && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="bg-white border-2 border-[#1B2D3C]/20 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-base font-black text-[#1B2D3C]">Add New Item</h3>
              <button onClick={() => setIsAdding(false)} className="p-1.5 rounded-full hover:bg-[#1B2D3C]/5 cursor-pointer">
                <X className="w-4 h-4 text-[#1B2D3C]/50" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-[#1B2D3C]/20 rounded-xl text-sm text-[#1B2D3C] font-medium focus:outline-none focus:border-amber-400"
                  placeholder="Item name..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Price</label>
                <input
                  type="text"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-[#1B2D3C]/20 rounded-xl text-sm text-[#1B2D3C] font-medium focus:outline-none focus:border-amber-400"
                  placeholder="£XX.XX"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Category</label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                className="w-full px-4 py-3 border-2 border-[#1B2D3C]/20 rounded-xl text-sm text-[#1B2D3C] font-medium focus:outline-none focus:border-amber-400"
              >
                <option value="tableware">Tableware</option>
                <option value="decor">Home Decor</option>
                <option value="kids">Kids</option>
                <option value="seasonal">Seasonal</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Description</label>
              <textarea
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border-2 border-[#1B2D3C]/20 rounded-xl text-sm text-[#1B2D3C] font-medium focus:outline-none focus:border-amber-400 resize-y"
                placeholder="Item description..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Images (optional)</label>
              <div className="flex items-center gap-4 flex-wrap">
                {newItem.imageFiles.map((file, idx) => (
                  <div key={idx} className="relative w-20 h-20">
                    <img src={URL.createObjectURL(file)} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover rounded-lg border-2 border-[#1B2D3C]/20" />
                    <button
                      onClick={() => setNewItem({ ...newItem, imageFiles: newItem.imageFiles.filter((_, i) => i !== idx) })}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.multiple = true;
                    input.onchange = (e) => {
                      const files = Array.from((e.target as HTMLInputElement).files || []);
                      if (files.length > 0) {
                        setNewItem({ ...newItem, imageFiles: [...newItem.imageFiles, ...files] });
                      }
                    };
                    input.click();
                  }}
                  className="w-20 h-20 border-2 border-dashed border-[#1B2D3C]/20 rounded-lg flex items-center justify-center hover:border-[#1B2D3C] cursor-pointer transition-colors"
                >
                  <Upload className="w-5 h-5 text-[#1B2D3C]/40" />
                </button>
                <p className="text-xs text-[#1B2D3C]/60 w-full">Upload images for this item (optional, multiple allowed)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="party-eligible"
                checked={newItem.isPartyEligible}
                onChange={(e) => setNewItem({ ...newItem, isPartyEligible: e.target.checked })}
                className="w-4 h-4 accent-[#1B2D3C]"
              />
              <label htmlFor="party-eligible" className="text-sm text-[#1B2D3C]">Party Favorite</label>
            </div>
            <button
              onClick={handleAddItem}
              disabled={loading}
              className="w-full py-3 bg-[#1B2D3C] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#486581] cursor-pointer transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 space-y-6">
        {/* List */}
        <div className="bg-white border border-[#1B2D3C]/20 overflow-hidden">
          <div className="divide-y divide-[#1B2D3C]/10">
            {items.map((item, idx) => (
                <div key={item.id} className="relative">
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setSelectedImageIndex(0);
                    }}
                    className={`w-full text-left px-6 py-5 hover:bg-[#D6E2E9]/40 transition-all flex justify-between items-center gap-6 cursor-pointer pr-16 ${idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}`}
                  >
                    <p className="text-[#1B2D3C] text-base md:text-lg"><EditableText contentKey={`pricing_item_${item.id}_name`} page="pricing" defaultValue={item.name} adminMode={adminMode} className="text-base md:text-lg text-[#1B2D3C]" /></p>
                    <span className="text-base md:text-lg text-[#1B2D3C] shrink-0"><EditableText contentKey={`pricing_item_${item.id}_price`} page="pricing" defaultValue={item.price} adminMode={adminMode} className="text-base md:text-lg text-[#1B2D3C]" /></span>
                  </button>
                  {adminMode && (
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="absolute top-1/2 -translate-y-1/2 right-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
            ))}
          </div>
        </div>
      </div>

      {/* Item Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-[#1B2D3C]/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#1B2D3C]/20 shadow-lg">
            <div className="relative aspect-[4/3] bg-[#FFFFFF]">
              {selectedItem.imageUrls && selectedItem.imageUrls.length > 0 ? (
                <img
                  src={selectedItem.imageUrls[selectedImageIndex]}
                  alt={selectedItem.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#F8FAFB] text-[#1B2D3C]/40">
                  <p className="text-sm">No images</p>
                </div>
              )}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white text-[#1B2D3C] transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              {selectedItem.imageUrls && selectedItem.imageUrls.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex((i) => (i === 0 ? selectedItem.imageUrls!.length - 1 : i - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white text-[#1B2D3C] transition-all cursor-pointer rounded-full"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex((i) => (i === selectedItem.imageUrls!.length - 1 ? 0 : i + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white text-[#1B2D3C] transition-all cursor-pointer rounded-full"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            {selectedItem.imageUrls && selectedItem.imageUrls.length > 0 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {selectedItem.imageUrls.map((url, idx) => (
                  <div key={idx} className="relative shrink-0">
                    <button
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`shrink-0 w-16 h-16 overflow-hidden border-2 rounded-lg cursor-pointer ${
                        idx === selectedImageIndex ? 'border-[#1B2D3C]' : 'border-transparent'
                      }`}
                    >
                      <img src={url} alt={`${selectedItem.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                    {adminMode && (
                      <button
                        onClick={() => handleRemoveImage(selectedItem, idx)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {adminMode && (
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = async (ev) => {
                            const base64 = ev.target?.result as string;
                            // Upload to Supabase storage
                            try {
                              const savedStaff = localStorage.getItem('pp_current_staff');
                              const staff: Staff | null = savedStaff ? JSON.parse(savedStaff) : null;
                              if (staff?.sessionToken) {
                                const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
                                  body: JSON.stringify({ action: 'upload', username: staff.username, sessionToken: staff.sessionToken, key: `item_${selectedItem.id}_image_${selectedItem.imageUrls.length}`, page: 'pricing', fileData: base64, fileName: file.name }),
                                });
                                const data = await res.json();
                                if (data.url) {
                                  handleAddImage(selectedItem, data.url);
                                }
                              }
                            } catch (err) {
                              console.error('Failed to upload image:', err);
                              showToast('Failed to upload image', 'error');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                    className="shrink-0 w-16 h-16 border-2 border-dashed border-[#1B2D3C]/20 rounded-lg flex items-center justify-center hover:border-[#1B2D3C] cursor-pointer transition-colors"
                  >
                    <Upload className="w-5 h-5 text-[#1B2D3C]/40" />
                  </button>
                )}
              </div>
            )}
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#1B2D3C] mb-1"><EditableText contentKey={`pricing_item_${selectedItem.id}_category`} page="pricing" defaultValue={categoryLabel(selectedItem.category)} adminMode={adminMode} className="text-[10px] uppercase tracking-wider text-[#1B2D3C]" /></p>
                  <h2 className="font-heading text-2xl text-[#1B2D3C]"><EditableText contentKey={`pricing_item_${selectedItem.id}_name`} page="pricing" defaultValue={selectedItem.name} adminMode={adminMode} className="font-heading text-2xl text-[#1B2D3C]" /></h2>
                </div>
                <span className="text-xl text-[#1B2D3C] shrink-0"><EditableText contentKey={`pricing_item_${selectedItem.id}_price`} page="pricing" defaultValue={selectedItem.price} adminMode={adminMode} className="text-xl text-[#1B2D3C]" /></span>
              </div>
              <p className="text-sm text-[#1B2D3C]/80 leading-relaxed"><EditableText contentKey={`pricing_item_${selectedItem.id}_description`} page="pricing" defaultValue={selectedItem.description} adminMode={adminMode} className="text-sm text-[#1B2D3C]/80 leading-relaxed" /></p>
              {selectedItem.isPartyEligible && (
                <span className="inline-block px-2.5 py-1 bg-[#D6E2E9] text-[#1B2D3C] text-[10px] uppercase tracking-widest">
                  <EditableText contentKey="pricing_party_favorite" page="pricing" defaultValue="Party Favorite" adminMode={adminMode} className="text-[10px] uppercase tracking-widest text-[#1B2D3C]" />
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
