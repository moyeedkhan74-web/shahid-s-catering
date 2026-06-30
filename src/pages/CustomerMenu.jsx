import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Castle, Clock, LogOut, LayoutDashboard, ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';

const CustomerMenu = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const { menuCache, setMenuCache, lastFetch, setLastFetch, cartCount, cartJustUpdated, setCartJustUpdated } = useCart();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const hasAccess = sessionStorage.getItem('deccan_access');
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      setIsAdmin(!!session);
      
      if (session) {
        if (menuCache.length > 0) {
          setMenuItems(menuCache);
          setLoading(false);
          // Revalidate in background to fetch fresh/real-time updates
          fetchMenu();
        } else {
          fetchMenu();
        }
        return;
      }

      if (!hasAccess) {
        navigate('/');
        return;
      }

      // Verify permission in real-time
      const { data: accessData, error } = await supabase.from('access_requests').select('status').eq('phone_number', hasAccess).maybeSingle();
      if (error || !accessData || accessData.status !== 'approved') {
        sessionStorage.removeItem('deccan_access');
        navigate('/');
      } else {
        if (menuCache.length > 0) { 
          setMenuItems(menuCache);
          setLoading(false);
          // Revalidate in background
          fetchMenu();
        } else {
          fetchMenu();
        }
      }
    };
    checkUser();

    // Fallback polling for true real-time updates every 8 seconds
    const pollInterval = setInterval(() => {
      fetchMenu();
    }, 8000);

    const { data: authListener } = supabase.auth.onAuthStateChange((_e, session) => setIsAdmin(!!session));
    const menuChannel = supabase.channel('menu_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => fetchMenu()).subscribe();

    return () => {
      clearInterval(pollInterval);
      if (authListener?.subscription) authListener.subscription.unsubscribe();
      if (menuChannel) supabase.removeChannel(menuChannel);
    };
  }, [navigate]);

  const fetchMenu = async () => {
    const { data } = await supabase.from('menu_items').select('*').order('created_at', { ascending: false });
    if (data) {
      setMenuItems(data);
      setMenuCache(data);
      setLastFetch(Date.now());
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    const activePhone = sessionStorage.getItem('active_phone') || sessionStorage.getItem('deccan_access');
    if (activePhone) {
      await supabase.from('access_requests').delete().eq('phone_number', activePhone);
    }
    await supabase.auth.signOut();
    sessionStorage.removeItem('deccan_access');
    sessionStorage.removeItem('active_phone');
    localStorage.removeItem('pending_phone');
    navigate('/');
  };

  const categories = ['All', ...new Set(menuItems.map(item => item.category))];
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading && menuItems.length === 0) return (
     <div className="min-h-screen bg-[#EDE8D0] flex items-center justify-center">
        <Castle className="w-8 h-8 text-[#B8860B] animate-pulse" />
     </div>
  );

  return (
    <div className="min-h-screen bg-[#EDE8D0] text-[#2C1E0F] font-sans">
      <header className="sticky top-0 z-50 bg-[#F5F5DC] border-b border-[#F5EFE8] px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer active:scale-95 transition-all" 
            onClick={() => {
              setLoading(true);
              fetchMenu();
              window.scrollTo({top:0, behavior:'smooth'});
            }}
          >
            <Castle className={`w-8 h-8 text-[#B8860B] ${loading ? 'animate-spin' : ''}`} />
            <h1 className="text-sm font-black uppercase tracking-tight">Deccan Catering</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSearchOpen(!isSearchOpen)} className={`p-2.5 rounded-xl ${isSearchOpen ? 'bg-[#B8860B] text-white' : 'text-[#73695F]'}`}><Search className="w-5 h-5" /></button>
            {(isAdmin || sessionStorage.getItem('deccan_access')) && (
              <button onClick={handleSignOut} className="p-2.5 bg-red-600 text-white rounded-xl font-black text-[9px] uppercase px-4">Logout</button>
            )}
          </div>
        </div>
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="max-w-md mx-auto px-1 pt-4">
              <input autoFocus type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#F7F3EE] p-4 rounded-xl text-sm font-bold border-none outline-none" />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-md mx-auto px-4 pt-10 pb-32">
        <div className="mb-10 pl-2 relative">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: '40px' }} 
            className="h-1 bg-[#B8860B] mb-4" 
          />
          <h2 className="text-5xl font-black uppercase tracking-tighter leading-none mb-2 bg-gradient-to-br from-[#2C1E0F] to-[#73695F] bg-clip-text text-transparent">Culinary<br/>Selections</h2>
          <div className="flex items-center gap-3 mt-4">
            <span className="text-[9px] font-black text-[#B8860B] uppercase tracking-[0.4em]">Heritage Collection</span>
            <div className="w-1 h-1 bg-[#C8BAA8] rounded-full" />
            <span className="text-[9px] font-black text-[#73695F] uppercase tracking-[0.4em]">Est. 2026</span>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 sticky top-[72px] z-40 bg-[#EDE8D0]/95 backdrop-blur-md py-4 border-b border-[#F5EFE8]/50">
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)} 
              className={`px-7 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 border-2 ${
                activeCategory === cat 
                ? 'bg-[#2C1E0F] text-[#B8860B] border-[#2C1E0F] shadow-xl shadow-[#2C1E0F]/10 scale-105' 
                : 'bg-white border-transparent text-[#73695F] hover:border-[#EDE8D0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-6 mt-4">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => navigate(`/menu/${item.id}`)} className="bg-white rounded-[2rem] overflow-hidden border-2 border-[#48401B] active:scale-[0.98] transition-all shadow-sm">
                <div className="aspect-[16/9] bg-[#EDE8D0]/20 flex items-center justify-center overflow-hidden relative">
                  <img 
                    src={item.image_url} 
                    className={`max-w-full max-h-full object-contain transition-all duration-700 group-hover:scale-110 ${!item.is_available ? 'grayscale opacity-40' : ''}`} 
                    alt={item.name} 
                    loading="lazy" 
                  />
                  {item.is_available && Number(item.price) > 20 && (
                    <div className="absolute top-6 right-6 bg-[#B8860B] text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl border border-white/20">
                       Highly Recommended
                    </div>
                  )}
                  {!item.is_available && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#2C1E0F]/10 backdrop-blur-sm">
                      <span className="bg-[#2C1E0F] text-[#B8860B] px-8 py-3 rounded-2xl text-[10px] font-black uppercase border-2 border-[#B8860B] shadow-2xl tracking-widest">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-black uppercase text-[#2C1E0F] mb-1">{item.name}</h3>
                  <p className="text-[10px] text-[#73695F] line-clamp-2 font-medium mb-4 leading-relaxed">{item.description}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-[#EDE8D0]">
                    <div>
                      <p className="text-[8px] font-black text-[#C8BAA8] uppercase mb-1">Price</p>
                      <p className="text-[#B8860B] text-2xl font-black tracking-tighter">${item.price}</p>
                    </div>
                    <div className="p-3 bg-[#EDE8D0] rounded-xl"><Clock className="w-4 h-4 text-[#B8860B]" /></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Floating Cart Button */}
        {cartCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-6">
             <motion.button 
               onClick={() => { setCartJustUpdated(false); navigate('/cart'); }}
               animate={cartJustUpdated ? {
                 scale: [1, 1.06, 1, 1.04, 1],
                 boxShadow: [
                   '0 20px 50px rgba(44,30,15,0.4)',
                   '0 0 30px rgba(184,134,11,0.8), 0 0 60px rgba(184,134,11,0.4)',
                   '0 20px 50px rgba(44,30,15,0.4)',
                   '0 0 30px rgba(184,134,11,0.8), 0 0 60px rgba(184,134,11,0.4)',
                   '0 20px 50px rgba(44,30,15,0.4)',
                 ]
               } : {}}
               transition={cartJustUpdated ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}}
               className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 border-2 active:scale-95 transition-colors duration-300 ${
                 cartJustUpdated 
                   ? 'bg-[#B8860B] text-white border-[#B8860B] ring-4 ring-[#B8860B]/30' 
                   : 'bg-[#2C1E0F] text-[#B8860B] border-[#B8860B]/20 shadow-[0_20px_50px_rgba(44,30,15,0.4)]'
               }`}
             >
                <ShoppingBag className="w-4 h-4" />
                {cartJustUpdated ? `Item Added! View Cart (${cartCount})` : `View Cart (${cartCount} ${cartCount === 1 ? 'Item' : 'Items'})`}
             </motion.button>
          </div>
        )}

        {isAdmin && (
           <div className={`fixed ${cartCount > 0 ? 'bottom-28' : 'bottom-6'} right-6 z-50`}>
              <button onClick={() => navigate('/admin-dashboard')} className="w-14 h-14 bg-[#2C1E0F] text-[#B8860B] rounded-2xl shadow-2xl flex items-center justify-center border-2 border-white"><LayoutDashboard className="w-5 h-5" /></button>
           </div>
        )}
      </main>
    </div>
  );
};

export default CustomerMenu;
