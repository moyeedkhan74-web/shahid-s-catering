import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Castle, Clock, Share2, Heart, ShieldAlert, Plus, Minus, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';

const DishDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const { menuCache, addToCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null);
  const [liked, setLiked] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkAccess = async () => {
      if (!supabase) {
        navigate('/');
        return;
      }

      // 1. Get Session
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!mounted) return;

      // 2. If admin session exists, they are always allowed
      if (session) {
        setupItem();
        return;
      }

      // 3. Check for customer access
      const hasAccess = sessionStorage.getItem('deccan_access');
      if (!hasAccess) {
        navigate('/');
        return;
      }

      // 4. Verify permission status
      const { data: accessData, error } = await supabase.from('access_requests').select('status').eq('phone_number', hasAccess).maybeSingle();
      if (!mounted) return;

      if (error || !accessData || accessData.status !== 'approved') {
        sessionStorage.removeItem('deccan_access');
        navigate('/');
        return;
      }

      setupItem();
    };

    const setupItem = () => {
      if (!mounted) return;
      const cachedItem = menuCache.find(i => i.id === id);
      if (cachedItem) {
        setItem(cachedItem);
        setActiveImage(cachedItem.image_url);
        setLoading(false);
      } else {
        fetchItem();
      }
    };

    checkAccess();
    return () => { mounted = false; };
  }, [id, navigate, menuCache]);

  const fetchItem = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (data) {
        setItem(data);
        setActiveImage(data.image_url);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: item?.name || 'Deccan Catering',
        text: item?.description,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Linked.');
    }
  };

  const handleAddToCart = () => {
    if (!item.is_available) return;
    addToCart(item, quantity);
    // Immediately go back to menu so user can see the highlighted cart button
    navigate('/menu');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#EDE8D0] flex items-center justify-center">
      <Castle className="w-8 h-8 text-[#B8860B] animate-pulse" />
    </div>
  );

  if (!item) return (
    <div className="min-h-screen bg-[#EDE8D0] flex flex-col items-center justify-center p-8 text-center gap-4">
      <h2 className="text-sm font-black uppercase">Not Found</h2>
      <button onClick={() => navigate('/menu')} className="px-8 py-3 bg-[#2C1E0F] text-[#B8860B] rounded-xl text-[10px] font-black uppercase">Back</button>
    </div>
  );

  const gallery = [item.image_url, ...(item.gallery_urls || [])].filter(url => url && (url.startsWith('http') || url.startsWith('data:image')));

  return (
    <div className="min-h-screen bg-[#EDE8D0] text-[#2C1E0F] pb-32 font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4 flex justify-between items-center bg-[#F5F5DC]/80 backdrop-blur-md border-b border-[#F5EFE8]">
        <button onClick={() => navigate('/menu')} className="w-10 h-10 bg-white/90 text-[#2C1E0F] rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all border border-[#EDE8D0]">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div 
          className="flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
          onClick={() => {
            setLoading(true);
            fetchItem();
          }}
        >
          <Castle className={`w-6 h-6 text-[#B8860B] ${loading ? 'animate-spin' : ''}`} />
          <span className="text-[8px] font-black uppercase tracking-tighter">Deccan</span>
        </div>

        <div className="flex gap-2">
           <button onClick={handleShare} className="w-10 h-10 bg-white/90 text-[#2C1E0F] rounded-full flex items-center justify-center shadow-lg border border-[#EDE8D0]"><Share2 className="w-4 h-4" /></button>
           <button onClick={() => setLiked(!liked)} className={`w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg border border-[#EDE8D0] ${liked ? 'text-red-500' : 'text-[#73695F]'}`}>
             <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
           </button>
        </div>
      </nav>

      {/* FIXED IMAGE VIEW - 16:9 Aspect Ratio with Contain */}
      <div className="relative w-full aspect-[16/9] bg-[#EDE8D0]/30 flex items-center justify-center overflow-hidden border-b-2 border-[#48401B]">
        <AnimatePresence mode="wait">
          <motion.img 
            key={activeImage} 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            src={activeImage} 
            className="max-w-full max-h-full object-contain shadow-2xl" 
          />
        </AnimatePresence>
        
        <div className="absolute bottom-4 left-0 right-0 px-4 flex gap-2 overflow-x-auto scrollbar-hide">
          {gallery.map((url, i) => (
            <button key={i} onClick={() => setActiveImage(url)} className={`relative min-w-[50px] h-[50px] rounded-xl overflow-hidden border-2 transition-all ${activeImage === url ? 'border-[#B8860B]' : 'border-white/50'}`}>
              <img src={url} className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      </div>

      <main className="px-6 pt-8 space-y-10 max-w-md mx-auto">
        <div className="space-y-2">
          <span className="text-[9px] font-black text-[#B8860B] uppercase tracking-[0.2em]">{item.category}</span>
          <h1 className="text-3xl font-black text-[#2C1E0F] uppercase tracking-tighter leading-none">{item.name}</h1>
        </div>

        <div className="space-y-4">
          <h3 className="text-[9px] font-black text-[#C8BAA8] uppercase tracking-widest">Detail</h3>
          <p className="text-base text-[#73695F] leading-relaxed font-medium">{item.description}</p>
        </div>

        <div className="bg-white rounded-[3rem] p-10 border-4 border-[#48401B] shadow-2xl relative">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-[8px] font-black text-[#C8BAA8] uppercase tracking-widest mb-1">Price</p>
              <h4 className="text-4xl font-black text-[#B8860B] tracking-tighter">${item.price}</h4>
            </div>
            
            <div className="flex items-center bg-[#F7F3EE] rounded-2xl p-1 border-2 border-[#48401B]/10">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center text-[#2C1E0F] hover:bg-[#B8860B] hover:text-white rounded-xl transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-black text-sm">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center text-[#2C1E0F] hover:bg-[#B8860B] hover:text-white rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              disabled={!item.is_available}
              onClick={handleAddToCart}
              className={`w-full py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 ${
                !item.is_available 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : isAdded 
                  ? 'bg-green-600 text-white' 
                  : 'bg-[#2C1E0F] text-[#B8860B] hover:bg-[#B8860B] hover:text-white'
              }`}
            >
              {isAdded ? (
                <>Added Successfully</>
              ) : (
                <>Add to Cart <ShoppingCart className="w-4 h-4" /></>
              )}
            </button>
            
            {!item.is_available && (
              <p className="text-center text-[9px] font-bold text-red-500 uppercase tracking-widest animate-pulse">
                Currently Unavailable
              </p>
            )}
          </div>
        </div>
      </main>

      <div className="mt-12 flex flex-col items-center gap-2 opacity-30">
         <Castle className="w-5 h-5" />
         <p className="text-[7px] font-black uppercase tracking-[0.4em]">Deccan Est. 2026</p>
      </div>
    </div>
  );
};

export default DishDetails;
