import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Castle, Clock, LogOut, LayoutDashboard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';

const CustomerMenu = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const { menuCache, setMenuCache, lastFetch, setLastFetch } = useCart();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const hasAccess = sessionStorage.getItem('deccan_access');
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('CustomerMenu checkUser session:', !!session);
      setIsAdmin(!!session);
      
      if (session) {
        if (menuCache.length > 0 && (Date.now() - lastFetch < 300000)) {
          setMenuItems(menuCache);
          setLoading(false);
        } else {
          fetchMenu();
        }
        return;
      }

      console.log('CustomerMenu hasAccess:', hasAccess);
      if (!hasAccess) {
        console.log('No access key found, redirecting to Landing');
        navigate('/');
        return;
      }

      // Verify permission in real-time
      const { data, error } = await supabase.from('access_requests').select('status').eq('phone_number', hasAccess).maybeSingle();
      console.log('CustomerMenu verification data:', data, 'error:', error);
      if (error || !data || data.status !== 'approved') {
        console.log('Invalid or unapproved access, redirecting to Landing');
        sessionStorage.removeItem('deccan_access');
        navigate('/');
      } else {
        if (menuCache.length > 0 && (Date.now() - lastFetch < 300000)) { 
          setMenuItems(menuCache);
          setLoading(false);
        } else {
          fetchMenu();
        }
      }
    };
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((_e, session) => setIsAdmin(!!session));
    const menuChannel = supabase.channel('menu_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => fetchMenu()).subscribe();
    return () => {
      authListener.subscription.unsubscribe();
      supabase.removeChannel(menuChannel);
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
    await supabase.auth.signOut();
    sessionStorage.removeItem('deccan_access');
    localStorage.removeItem('pending_phone'); // Reset the flow for next visit
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
        <div className="mb-8 pl-2">
          <h2 className="text-4xl font-black uppercase tracking-tighter">Menu</h2>
          <span className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest">Heritage · Est. 2026</span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sticky top-[73px] z-40 bg-[#EDE8D0]/90 py-4">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${activeCategory === cat ? 'bg-[#2C1E0F] text-[#B8860B] border-[#2C1E0F]' : 'bg-white border-[#F5EFE8] text-[#73695F]'}`}>{cat}</button>
          ))}
        </div>

        <div className="space-y-6 mt-4">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => navigate(`/menu/${item.id}`)} className="bg-white rounded-[2rem] overflow-hidden border-2 border-[#48401B] active:scale-[0.98] transition-all shadow-sm">
                <div className="aspect-[4/3] bg-white flex items-center justify-center overflow-hidden relative">
                  <img 
                    src={item.image_url} 
                    className={`w-full h-full object-contain transition-all duration-500 ${!item.is_available ? 'grayscale opacity-40' : ''}`} 
                    alt={item.name} 
                    loading="lazy" 
                  />
                  {!item.is_available && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#EDE8D0]/20">
                      <span className="bg-[#2C1E0F] text-[#B8860B] px-6 py-2 rounded-full text-[9px] font-black uppercase border-2 border-[#B8860B] shadow-2xl">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-black uppercase text-[#2C1E0F] mb-4">{item.name}</h3>
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

        {isAdmin && (
           <div className="fixed bottom-6 right-6 z-50">
              <button onClick={() => navigate('/admin-dashboard')} className="w-14 h-14 bg-[#2C1E0F] text-[#B8860B] rounded-2xl shadow-2xl flex items-center justify-center border-2 border-white"><LayoutDashboard className="w-5 h-5" /></button>
           </div>
        )}
      </main>
    </div>
  );
};

export default CustomerMenu;
