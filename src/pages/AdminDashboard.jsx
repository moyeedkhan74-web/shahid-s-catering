import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, LayoutDashboard, UtensilsCrossed, 
  Settings, LogOut, Check, X, Trash2, Castle, 
  Menu as MenuIcon, Filter, Clock, ChevronRight,
  Upload, Camera, Image as ImageIcon, Globe
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('menu');
  const [menuItems, setMenuItems] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [hasNewRequests, setHasNewRequests] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    category: 'Starters',
    description: '',
    image_url: '',
    gallery_urls: [],
    is_available: true
  });

  useEffect(() => {
    fetchAccessRequests();
    fetchMenuItems();

    const channel = supabase.channel('admin_sync')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'access_requests' 
      }, () => {
         setHasNewRequests(true);
         fetchAccessRequests();
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'access_requests' 
      }, (payload) => {
         // If a previous request is resubmitted (updated back to pending), show badge
         if (payload.new.status === 'pending') {
           setHasNewRequests(true);
         }
         fetchAccessRequests();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'access_requests' }, fetchAccessRequests)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, fetchMenuItems)
      .subscribe((status) => {
        console.log('Admin Realtime Subscription Status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMenuItems = async () => {
    const { data } = await supabase.from('menu_items').select('*').order('created_at', { ascending: false });
    if (data) setMenuItems(data);
    setLoading(false);
  };

  const fetchAccessRequests = async () => {
    try {
      await cleanupOldRequests();
      const { data, error } = await supabase.from('access_requests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setAccessRequests(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccess = async (id, status) => {
    setActionLoading(id);
    try {
      const { error } = await supabase.from('access_requests').update({ status }).eq('id', id);
      if (error) throw error;
      await fetchAccessRequests();
    } catch (err) {
      alert('Failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm('Delete this request?')) return;
    try {
      await supabase.from('access_requests').delete().eq('id', id);
      fetchAccessRequests();
    } catch (err) {
      alert('Failed to delete.');
    }
  };

  const cleanupOldRequests = async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('access_requests').delete().lt('created_at', yesterday);
  };

  const toggleAvailability = async (id, currentStatus) => {
    // Optimistic Update: Update UI instantly
    setMenuItems(prev => prev.map(item => 
      item.id === id ? { ...item, is_available: !currentStatus } : item
    ));

    try {
      const { error } = await supabase.from('menu_items').update({ is_available: !currentStatus }).eq('id', id);
      if (error) throw error;
    } catch (err) {
      // Revert if error
      setMenuItems(prev => prev.map(item => 
        item.id === id ? { ...item, is_available: currentStatus } : item
      ));
      alert('Sync failed: ' + err.message);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    await supabase.from('menu_items').delete().eq('id', id);
    fetchMenuItems();
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (newItem.price < 0) return alert('Price must be non-negative.');
    if (!newItem.image_url) return alert('Main photo is required.');
    
    setLoading(true);
    let error;
    if (editingId) {
      const { error: err } = await supabase.from('menu_items').update(newItem).eq('id', editingId);
      error = err;
    } else {
      const { error: err } = await supabase.from('menu_items').insert([newItem]);
      error = err;
    }

    if (error) alert(error.message);
    else {
      setShowAddModal(false);
      setEditingId(null);
      setNewItem({ name: '', price: '', category: 'Starters', description: '', image_url: '', gallery_urls: [], is_available: true });
      fetchMenuItems();
    }
    setLoading(false);
  };

  const handleEditClick = (item) => {
    setNewItem({
      name: item.name,
      price: item.price,
      category: item.category,
      description: item.description,
      image_url: item.image_url,
      gallery_urls: item.gallery_urls || [],
      is_available: item.is_available
    });
    setEditingId(item.id);
    setShowAddModal(true);
  };

  const compressImage = (file, maxWidth = 1000, quality = 0.7) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
      };
    });
  };

  const handleImageUpload = async (e, type = 'main', index = null) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) return alert('File too large (max 10MB)');
      
      const compressedData = await compressImage(file);
      
      if (type === 'main') {
        setNewItem({ ...newItem, image_url: compressedData });
      } else {
        const newGallery = [...newItem.gallery_urls];
        if (newGallery.length >= 4) return alert('Max 5 photos total (1 Main + 4 Gallery)');
        newGallery.push(compressedData);
        setNewItem({ ...newItem, gallery_urls: newGallery });
      }
    }
  };

  const removeGalleryImage = (index) => {
    const newGallery = newItem.gallery_urls.filter((_, i) => i !== index);
    setNewItem({ ...newItem, gallery_urls: newGallery });
  };

  if (loading && menuItems.length === 0) return (
    <div className="min-h-screen bg-[#EDE8D0] flex items-center justify-center">
       <div className="w-16 h-16 border-4 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#EDE8D0] text-[#2C1E0F] font-sans flex flex-col md:flex-row">
      
      {/* MOBILE TOP BAR (Phone Only) */}
      <div className="md:hidden bg-[#F5F5DC] border-b px-6 py-4 flex justify-between items-center sticky top-0 z-[60]">
         <div 
           className="flex items-center gap-3 cursor-pointer active:scale-95 transition-all"
           onClick={() => {
             setLoading(true);
             fetchMenuItems();
             fetchAccessRequests();
           }}
         >
            <Castle className={`w-6 h-6 text-[#B8860B] ${loading ? 'animate-spin' : ''}`} />
            <span className="font-black text-xs uppercase tracking-widest">Admin Panel</span>
         </div>
         <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-[#F7F3EE] rounded-xl">
            <MenuIcon className="w-6 h-6" />
         </button>
      </div>

      {/* SIDEBAR (Desktop) / SLIDE-OVER (Mobile) */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth > 768) && (
          <motion.aside 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed md:sticky top-0 left-0 h-screen w-72 bg-[#2C1E0F] z-[70] p-8 flex flex-col shadow-2xl"
          >
            <div 
              className="mb-12 flex items-center gap-4 cursor-pointer active:scale-95 transition-all group"
              onClick={() => {
                setLoading(true);
                fetchMenuItems();
                fetchAccessRequests();
              }}
            >
              <Castle className={`w-8 h-8 text-[#B8860B] ${loading ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} />
              <div className="flex flex-col">
                <h2 className="text-white font-black uppercase text-sm tracking-tighter">Deccan Catering</h2>
                <span className="text-[9px] text-[#B8860B] font-bold uppercase tracking-[0.2em]">Catering Control</span>
              </div>
            </div>

            <nav className="flex-grow space-y-2">
              {[
                { id: 'menu', icon: UtensilsCrossed, label: 'Menu List' },
                { id: 'requests', icon: LayoutDashboard, label: 'Entry Access' },
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => { 
                    setActiveTab(tab.id); 
                    setIsSidebarOpen(false); 
                    if (tab.id === 'requests') setHasNewRequests(false);
                  }}
                  className={`w-full flex items-center justify-between gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#B8860B] text-white shadow-xl shadow-[#B8860B]/20' : 'text-[#C0917A] hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-4">
                    <tab.icon className="w-4 h-4" /> {tab.label}
                  </div>
                  {tab.id === 'requests' && hasNewRequests && (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  )}
                </button>
              ))}
            </nav>

            <div className="mt-auto space-y-4 pt-10 border-t border-white/5">
              <button 
                onClick={() => navigate('/menu')} 
                className="w-full flex items-center justify-between gap-4 px-6 py-4 rounded-2xl text-[11px] font-black text-[#C0917A] uppercase tracking-widest hover:bg-[#B8860B]/10 hover:text-[#B8860B] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <Globe className="w-4 h-4 group-hover:rotate-12 transition-transform" /> 
                  Live Menu
                </div>
                <ChevronRight className="w-3 h-3 opacity-30" />
              </button>
              <button onClick={async () => { await supabase.auth.signOut(); navigate('/'); }} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500/10">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
            
            {/* Overlay Close for Mobile */}
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-8 right-8 text-white/50"><X /></button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow p-6 md:p-12 max-w-7xl mx-auto w-full overflow-x-hidden">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8 text-center md:text-left">
           <div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">{activeTab === 'menu' ? 'Culinary List' : 'Access Gate'}</h1>
              <p className="text-[10px] text-[#B8860B] font-black uppercase tracking-[0.4em]">{activeTab === 'menu' ? 'Manage your catering collection' : 'Review live patron requests'}</p>
           </div>
           {activeTab === 'menu' && (
             <button onClick={() => setShowAddModal(true)} className="bg-[#2C1E0F] text-[#B8860B] px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#B8860B] hover:text-white transition-all shadow-xl active:scale-95">
                <Plus className="w-4 h-4" /> Add Special
             </button>
           )}
        </header>

        {/* TAB 1: MENU MANAGEMENT (Mobile Optimized Cards) */}
        {activeTab === 'menu' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {menuItems.map(item => (
              <div key={item.id} className="bg-white rounded-[2.5rem] border border-[#48401B] overflow-hidden shadow-sm flex flex-col">
                <div className="aspect-[4/3] relative overflow-hidden bg-white flex items-center justify-center">
                  <img src={item.image_url} className="w-full h-full object-cover" />
                  <div className={`absolute top-6 right-6 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${item.is_available ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                    {item.is_available ? 'Active' : 'Off'}
                  </div>
                </div>
                <div className="p-8 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[8px] font-black text-[#B8860B] uppercase tracking-widest block mb-1">{item.category}</span>
                      <h3 className="text-xl font-black uppercase tracking-tighter">{item.name}</h3>
                    </div>
                    <span className="text-2xl font-black text-[#B8860B] tracking-tighter">${item.price}</span>
                  </div>
                  <div className="flex flex-col gap-3 mt-6">
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => handleEditClick(item)} className="py-4 bg-[#2C1E0F] text-[#B8860B] rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"><Plus className="w-3 h-3 rotate-45" /> Edit</button>
                      <div className="flex flex-col gap-1">
                        <label className="text-[7px] font-black uppercase text-[#C8BAA8] ml-1">Status</label>
                        <button 
                          onClick={() => toggleAvailability(item.id, item.is_available)} 
                          className={`w-full h-14 rounded-2xl relative flex items-center px-1.5 transition-all duration-200 ${item.is_available ? 'bg-green-500/10 border-2 border-green-500/20' : 'bg-red-500/10 border-2 border-red-500/20'}`}
                        >
                          <motion.div 
                            layout
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className={`w-1/2 h-10 rounded-xl flex items-center justify-center text-[8px] font-black uppercase tracking-tight shadow-sm ${item.is_available ? 'bg-green-500 text-white ml-auto' : 'bg-red-500 text-white'}`}
                          >
                            {item.is_available ? 'Active' : 'Hidden'}
                          </motion.div>
                        </button>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteItem(item.id)} className="w-full py-4 text-red-500 text-[9px] font-black uppercase tracking-widest border border-red-50 rounded-2xl hover:bg-red-50 transition-colors">Delete Dish</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: ACCESS REQUESTS (Mobile List) */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
             {accessRequests.length === 0 && (
               <div className="p-20 text-center border-4 border-dashed border-[#F5EFE8] rounded-[3rem]">
                  <p className="text-[#C8BAA8] text-sm font-black uppercase tracking-widest">No active requests</p>
               </div>
             )}
             {accessRequests.map(req => (
               <div key={req.id} className="bg-white rounded-[2rem] border border-[#48401B] p-8 flex flex-col sm:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-6 w-full sm:w-auto">
                     <div className="w-14 h-14 bg-[#EDE8D0] rounded-2xl flex items-center justify-center shrink-0">
                        <Clock className="w-6 h-6 text-[#B8860B]" />
                     </div>
                     <div>
                        <p className="text-lg font-black text-[#2C1E0F] tracking-tighter">{req.guest_name || 'Guest Request'}</p>
                        <div className="flex items-center gap-2">
                           <p className="text-[10px] font-bold text-[#B8860B]">{req.phone_number}</p>
                           <span className="w-1 h-1 bg-[#C8BAA8] rounded-full" />
                           <p className="text-[8px] font-black text-[#C8BAA8] uppercase tracking-widest">{new Date(req.created_at).toLocaleTimeString()}</p>
                        </div>
                     </div>
                  </div>
                  
                  <div className="flex gap-4 w-full sm:w-auto">
                    {req.status === 'pending' ? (
                       <>
                          <button 
                            disabled={actionLoading === req.id}
                            onClick={() => handleUpdateAccess(req.id, 'rejected')} 
                            className="flex-1 sm:px-8 py-4 bg-red-50 text-red-500 rounded-2xl font-black text-[9px] uppercase tracking-widest disabled:opacity-50"
                          >
                            {actionLoading === req.id ? '...' : 'Decline'}
                          </button>
                          <button 
                            disabled={actionLoading === req.id}
                            onClick={() => handleUpdateAccess(req.id, 'approved')} 
                            className="flex-1 sm:px-10 py-4 bg-[#2C1E0F] text-white rounded-2xl font-black text-[9px] uppercase tracking-widest disabled:opacity-50"
                          >
                            {actionLoading === req.id ? 'Processing...' : 'Approve'}
                          </button>
                       </>
                    ) : (
                      <div className="flex items-center gap-4">
                         <span className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest ${req.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                           {req.status}
                         </span>
                         <button onClick={() => handleDeleteRequest(req.id)} className="p-4 bg-gray-50 text-[#C8BAA8] rounded-2xl"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
               </div>
             ))}
          </div>
        )}

      </main>

      {/* NEW ITEM MODAL (Full Screen on Mobile) */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#2C1E0F]/90 backdrop-blur-md flex items-center justify-center md:p-12"
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }}
              className="bg-white w-full max-w-lg h-auto md:rounded-[2.5rem] p-6 md:p-10 overflow-y-auto border-4 border-[#48401B] shadow-2xl mx-4"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black tracking-tighter uppercase">New Special</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-[#F7F3EE] rounded-xl transition-colors"><X className="w-5 h-5"/></button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                     <label className="text-[8px] font-black uppercase tracking-widest text-[#B8860B] ml-1">Name</label>
                     <input required value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} className="w-full bg-[#F7F3EE] p-4 rounded-xl font-bold border-none outline-none text-xs focus:ring-2 focus:ring-[#B8860B]/20" />
                   </div>
                   <div className="space-y-1">
                     <label className="text-[8px] font-black uppercase tracking-widest text-[#B8860B] ml-1">Price</label>
                     <input type="number" step="0.01" min="0" required value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})} className="w-full bg-[#F7F3EE] p-4 rounded-xl font-bold border-none outline-none text-xs" placeholder="$" />
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-[8px] font-black uppercase tracking-widest text-[#B8860B] ml-1">Category</label>
                   <select value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})} className="w-full bg-[#F7F3EE] p-4 rounded-xl font-bold border-none outline-none appearance-none text-xs">
                      {['Starters', 'Mains', 'Desserts', 'Breads', 'Drinks', 'Veg Specials', 'Non-Veg Specials'].map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>

                <div className="space-y-1">
                   <label className="text-[8px] font-black uppercase tracking-widest text-[#B8860B] ml-1">Description</label>
                   <textarea required rows={2} value={newItem.description} onChange={(e) => setNewItem({...newItem, description: e.target.value})} className="w-full bg-[#F7F3EE] p-4 rounded-xl font-bold border-none outline-none resize-none text-xs" />
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-[#B8860B] ml-1">Main Image</label>
                    <div className="relative group">
                      {newItem.image_url ? (
                        <div className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-[#48401B]">
                          <img src={newItem.image_url} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setNewItem({ ...newItem, image_url: '' })} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg"><X className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-3 w-full h-20 bg-[#F7F3EE] rounded-xl border-2 border-dashed border-[#B8860B]/20 cursor-pointer hover:border-[#B8860B]/50 transition-all">
                          <Upload className="w-5 h-5 text-[#B8860B]" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Upload Main</span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'main')} />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-[#B8860B] ml-1">Gallery ({newItem.gallery_urls?.length || 0}/4)</label>
                    <div className="grid grid-cols-4 gap-2">
                       {newItem.gallery_urls?.map((url, i) => (
                         <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[#48401B]">
                            <img src={url} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeGalleryImage(i)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"><X className="w-2 h-2" /></button>
                         </div>
                       ))}
                       {newItem.gallery_urls?.length < 4 && (
                         <label className="aspect-square flex items-center justify-center bg-[#F7F3EE] rounded-lg border-2 border-dashed border-[#B8860B]/20 cursor-pointer">
                            <Plus className="w-4 h-4 text-[#B8860B]" />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'gallery')} />
                         </label>
                       )}
                    </div>
                  </div>
                </div>

                <button disabled={loading} type="submit" className="w-full bg-[#2C1E0F] text-[#B8860B] py-5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-4 border-2 border-[#48401B]">
                  {loading ? 'Processing...' : editingId ? 'Update Dish' : 'Create Dish'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
