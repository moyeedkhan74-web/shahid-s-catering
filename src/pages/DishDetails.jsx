import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Castle, Clock, Share2, Heart, ShieldAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';

const DishDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const { menuCache } = useCart();
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const hasAccess = sessionStorage.getItem('deccan_access');
      if (!hasAccess) {
        navigate('/');
        return;
      }

      const { data, error } = await supabase.from('access_requests').select('status').eq('phone_number', hasAccess).maybeSingle();
      if (error || !data || data.status !== 'approved') {
        sessionStorage.removeItem('deccan_access');
        navigate('/');
        return;
      }

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
    <div className="min-h-screen bg-[#EDE8D0] text-[#2C1E0F] pb-20 font-sans">
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

      {/* FIXED IMAGE VIEW - NO ZOOM (using object-contain) */}
      <div className="relative w-full aspect-square bg-[#EDE8D0] flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img 
            key={activeImage} 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            src={activeImage} 
            className="w-full h-full object-contain" 
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

        <div className="bg-white rounded-[2rem] p-8 border border-[#48401B]">
          <div className="text-center mb-8">
            <p className="text-[8px] font-black text-[#C8BAA8] uppercase tracking-widest mb-1">Price</p>
            <h4 className="text-4xl font-black text-[#B8860B] tracking-tighter">${item.price}</h4>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-3">
               <div className="p-4 rounded-xl bg-white border border-[#F5EFE8] text-center">
                  <p className="text-[8px] font-black text-[#C8BAA8] uppercase tracking-widest mb-1">Status</p>
                  <p className={`text-[9px] font-black uppercase ${item.is_available ? 'text-green-600' : 'text-red-500'}`}>
                    {item.is_available ? 'Available' : 'Sold Out'}
                  </p>
               </div>
               <div className="p-4 rounded-xl bg-white border border-[#F5EFE8] text-center">
                  <p className="text-[8px] font-black text-[#C8BAA8] uppercase tracking-widest mb-1">Timing</p>
                  <p className="text-[9px] font-black text-[#2C1E0F] uppercase">24HR Notice</p>
               </div>
            </div>

            <button 
              onClick={() => {
                alert(`Inquiry sent for ${item.name}! Our team will contact you shortly.`);
              }}
              className="w-full py-5 bg-[#2C1E0F] text-[#B8860B] font-black text-[10px] uppercase tracking-[0.3em] rounded-xl active:scale-95 transition-all shadow-lg hover:bg-[#B8860B] hover:text-white"
            >
              Book Catering
            </button>
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
