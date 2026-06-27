import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Castle, Copy, CheckCircle2, QrCode, Phone, Mail, User } from 'lucide-react';
import { useCart } from '../context/CartContext';

const PaymentPage = () => {
  const navigate = useNavigate();
  const { cartTotal, clearCart, cartItems } = useCart();
  const [copied, setCopied] = useState(false);
  const [orderRef] = useState(() => Math.random().toString(36).substring(2, 9).toUpperCase());
  const [customerName, setCustomerName] = useState(() => sessionStorage.getItem('deccan_name') || '');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Mock payment details - should be in .env in real world
  const ZELLE_PAYEE = "Deccan Catering";
  const ZELLE_CONTACT = "catering.deccan@gmail.com"; 

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) return alert('Please enter your name.');
    if (!email) return alert('Please enter your email for confirmation.');
    
    setIsSubmitting(true);
    
    try {
      // Send Order Request (One call for both Admin and Customer emails)
      const finalName = customerName.trim() || 'Valued Customer';
      const customerPhone = sessionStorage.getItem('deccan_access') || sessionStorage.getItem('active_phone') || 'Not provided';

      const response = await fetch('/api/process-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: finalName,
          customerPhone,
          orderRef,
          customerEmail: email,
          totalAmount: cartTotal.toFixed(2),
          items: Object.values(cartItems).map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process order emails');
      }

      setIsSuccess(true);
      clearCart();
    } catch (err) {
      console.error('Submit Error:', err);
      alert('ERROR: ' + err.message + '\n\nIf the error persists, please contact support or try again later.');
      // Do NOT clear cart or show success on actual error
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#EDE8D0] flex flex-col items-center justify-center p-8 text-center gap-8">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-2xl"
        >
          <CheckCircle2 className="w-12 h-12 text-white" />
        </motion.div>
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 text-[#2C1E0F]">Order Received!</h2>
          <p className="text-[10px] text-[#73695F] font-black uppercase tracking-widest leading-relaxed">
            We have received your order details.<br/>
            Your order will be processed once payment is confirmed.<br/>
            Ref: <span className="text-[#B8860B]">#{orderRef}</span>
          </p>
        </div>
        <button 
          onClick={() => navigate('/menu')} 
          className="px-12 py-5 bg-[#2C1E0F] text-[#B8860B] rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all shadow-xl"
        >
          Return to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDE8D0] text-[#2C1E0F] pb-20 font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4 flex justify-between items-center bg-[#F5F5DC]/80 backdrop-blur-md border-b border-[#F5EFE8]">
        <button onClick={() => navigate('/cart')} className="w-10 h-10 bg-white/90 text-[#2C1E0F] rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all border border-[#EDE8D0]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Castle className="w-6 h-6 text-[#B8860B]" />
          <span className="text-[10px] font-black uppercase tracking-widest">Payment</span>
        </div>
        <div className="w-10 h-10" />
      </nav>

      <main className="max-w-md mx-auto px-6 pt-24 space-y-10">
        <header className="text-center">
          <div className="inline-block p-4 bg-white rounded-3xl border-2 border-[#48401B] shadow-xl mb-6">
             <QrCode className="w-12 h-12 text-[#2C1E0F]" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Instant Pay</h1>
          <p className="text-[10px] text-[#B8860B] font-black uppercase tracking-[0.2em] mt-2">Manual Zelle Verification</p>
        </header>

        <div className="bg-[#2C1E0F] rounded-[3rem] p-10 text-white shadow-2xl border-4 border-[#48401B] relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#B8860B]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
           
           <div className="relative z-10 text-center mb-10">
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#B8860B] mb-2">Total Amount Due</p>
              <h2 className="text-5xl font-black tracking-tighter text-[#EDE8D0]">${cartTotal.toFixed(2)}</h2>
           </div>

           <div className="space-y-6 relative z-10">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                 <p className="text-[8px] font-black uppercase tracking-widest text-[#B8860B] mb-4">Pay via Zelle to:</p>
                 
                  <div className="flex items-center justify-between group gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                       <div className="w-10 h-10 bg-[#B8860B] rounded-xl flex items-center justify-center shrink-0">
                          <Mail className="w-5 h-5 text-white" />
                       </div>
                       <div className="min-w-0 flex-1">
                          <p className="text-[7px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Zelle ID / Email</p>
                          <p className="font-bold text-[10px] xs:text-xs sm:text-sm select-all break-all leading-tight">{ZELLE_CONTACT}</p>
                       </div>
                    </div>
                    <button onClick={() => handleCopy(ZELLE_CONTACT)} className="p-3 bg-white/10 rounded-xl hover:bg-[#B8860B] transition-all shrink-0">
                       <Copy className="w-4 h-4" />
                    </button>
                 </div>
              </div>

              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                 <div className="flex justify-between items-center">
                    <div>
                       <p className="text-[7px] font-black uppercase tracking-widest text-[#B8860B]">Order Reference</p>
                       <p className="text-xl font-black tracking-widest mt-1">#{orderRef}</p>
                    </div>
                    <button onClick={() => handleCopy(`#${orderRef}`)} className="p-3 bg-white/10 rounded-xl hover:bg-[#B8860B] transition-all">
                       <Copy className="w-4 h-4" />
                    </button>
                 </div>
                 <p className="text-[7px] font-bold text-white/30 uppercase mt-4 text-center tracking-widest line-clamp-1">Include this in Zelle memo</p>
              </div>
           </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 border-2 border-[#48401B] shadow-lg">
           <form onSubmit={handleOrderSubmit} className="space-y-6">
               <div className="space-y-5">
                  <h4 className="text-sm font-black uppercase tracking-tighter">Your Details</h4>
                  <p className="text-[9px] font-medium text-[#73695F] leading-tight">Confirm your name and email to receive order confirmation once payment is verified.</p>
                  <div className="space-y-3">
                    <div className="relative">
                       <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C8BAA8]" />
                       <input 
                         type="text" 
                         required 
                         placeholder="YOUR FULL NAME" 
                         value={customerName}
                         onChange={(e) => setCustomerName(e.target.value)}
                         className="w-full bg-[#F7F3EE] p-5 pl-12 rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-[#B8860B]/30 transition-all placeholder:text-[#C8BAA8]"
                       />
                    </div>
                    <div className="relative">
                       <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C8BAA8]" />
                       <input 
                         type="email" 
                         required 
                         placeholder="YOUR@EMAIL.COM" 
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                         className="w-full bg-[#F7F3EE] p-5 pl-12 rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-[#B8860B]/30 transition-all placeholder:text-[#C8BAA8]"
                       />
                    </div>
                  </div>
               </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-6 bg-[#2C1E0F] text-[#B8860B] font-black text-[10px] uppercase tracking-[0.25em] rounded-2xl active:scale-95 transition-all shadow-xl hover:bg-[#B8860B] hover:text-white disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : 'Confirm Order Paid'}
              </button>
           </form>
           
           <div className="mt-8 flex items-start gap-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
              <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0 mt-1" />
              <p className="text-[8px] font-bold text-orange-800 leading-relaxed uppercase">
                Orders are processed manually. Please allow 15-30 minutes for payment verification and confirmation email.
              </p>
           </div>
        </div>
      </main>

      <AnimatePresence>
        {copied && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#B8860B] text-white px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest shadow-2xl z-[100]"
          >
            Copied to Clipboard
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ShieldAlert = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </svg>
);

export default PaymentPage;
