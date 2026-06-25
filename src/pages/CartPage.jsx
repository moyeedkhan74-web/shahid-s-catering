import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, Castle, CreditCard } from 'lucide-react';
import { useCart } from '../context/CartContext';

const CartPage = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCartEntirely, cartTotal, cartCount } = useCart();

  const items = Object.values(cartItems);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#EDE8D0] flex flex-col items-center justify-center p-8 text-center gap-6">
        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center border-2 border-[#48401B] shadow-xl">
          <ShoppingBag className="w-10 h-10 text-[#C8BAA8]" />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Cart is Empty</h2>
          <p className="text-[10px] text-[#73695F] font-black uppercase tracking-widest">Add some delicious dishes to get started</p>
        </div>
        <button 
          onClick={() => navigate('/menu')} 
          className="px-12 py-5 bg-[#2C1E0F] text-[#B8860B] rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all shadow-2xl"
        >
          View Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDE8D0] text-[#2C1E0F] pb-40 font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4 flex justify-between items-center bg-[#F5F5DC]/80 backdrop-blur-md border-b border-[#F5EFE8]">
        <button onClick={() => navigate('/menu')} className="w-10 h-10 bg-white/90 text-[#2C1E0F] rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all border border-[#EDE8D0]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Castle className="w-6 h-6 text-[#B8860B]" />
          <span className="text-[10px] font-black uppercase tracking-widest">Your Cart</span>
        </div>
        <div className="w-10 h-10" /> {/* Spacer */}
      </nav>

      <main className="max-w-md mx-auto px-6 pt-24 space-y-8">
        <header>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Order Summary</h1>
          <p className="text-[10px] text-[#B8860B] font-black uppercase tracking-[0.2em]">{cartCount} items selected</p>
        </header>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div 
                key={item.id} 
                layout 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-[2rem] p-5 border-2 border-[#48401B] flex gap-5 shadow-sm"
              >
                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-[#EDE8D0] shrink-0">
                  <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
                </div>
                
                <div className="flex-grow flex flex-col justify-between py-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-black uppercase tracking-tight leading-none">{item.name}</h3>
                    <button onClick={() => removeFromCartEntirely(item.id)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-black text-[#B8860B] tracking-tighter">${item.price}</p>
                    
                    <div className="flex items-center bg-[#F7F3EE] rounded-xl p-0.5 border border-[#48401B]/10">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-[#2C1E0F] hover:bg-[#B8860B] hover:text-white rounded-lg transition-all"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-black text-xs">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-[#2C1E0F] hover:bg-[#B8860B] hover:text-white rounded-lg transition-all"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border-4 border-[#48401B] shadow-2xl space-y-6">
          <div className="space-y-3">
             <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#73695F]">
               <span>Subtotal</span>
               <span>${cartTotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#73695F]">
               <span>Service Fee</span>
               <span>$0.00</span>
             </div>
             <div className="pt-4 border-t-2 border-dashed border-[#EDE8D0] flex justify-between items-center">
               <span className="text-xs font-black uppercase tracking-[0.2em]">Total Amount</span>
               <span className="text-3xl font-black text-[#B8860B] tracking-tighter">${cartTotal.toFixed(2)}</span>
             </div>
          </div>

          <button 
            onClick={() => navigate('/payment')}
            className="w-full py-6 bg-[#2C1E0F] text-[#B8860B] font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl active:scale-95 transition-all shadow-xl hover:bg-[#B8860B] hover:text-white flex items-center justify-center gap-3"
          >
            Checkout Now <CreditCard className="w-4 h-4" />
          </button>
        </div>
      </main>

      <div className="mt-12 flex flex-col items-center gap-2 opacity-30 pb-10">
         <Castle className="w-5 h-5" />
         <p className="text-[7px] font-black uppercase tracking-[0.4em]">Deccan Est. 2026</p>
      </div>
    </div>
  );
};

export default CartPage;
