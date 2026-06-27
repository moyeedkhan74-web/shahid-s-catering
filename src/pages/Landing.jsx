import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Send, Castle, ShieldCheck, Clock, CheckCircle2, User, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      if (data?.session) navigate('/admin-dashboard');
    };
    checkAdmin();

    // Auto-delete request when user leaves/closes the page
    const cleanup = () => {
      const savedPhone = sessionStorage.getItem('active_phone');
      if (savedPhone) {
        navigator.sendBeacon && fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/access_requests?phone_number=eq.${savedPhone}`, {
          method: 'DELETE',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          keepalive: true
        });
        sessionStorage.removeItem('active_phone');
      }
    };
    window.addEventListener('beforeunload', cleanup);
    return () => window.removeEventListener('beforeunload', cleanup);
  }, [navigate]);

  const checkStatus = async (phoneNum) => {
    setLoading(true);
    const { data } = await supabase.from('access_requests').select('status').eq('phone_number', phoneNum).maybeSingle();
    if (data) {
      if (data.status === 'approved') {
        setStatus('approved');
        sessionStorage.setItem('deccan_access', phoneNum);
        sessionStorage.setItem('deccan_name', data.guest_name || '');
      } else if (data.status === 'rejected') {
        setStatus('rejected');
      } else {
        setStatus('waiting');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    let interval, channel;
    if (status === 'waiting' && phone) {
      channel = supabase.channel(`gate_${phone}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'access_requests', 
          filter: `phone_number=eq.${phone}` 
        }, (p) => {
          if (p.new.status === 'approved') {
            setStatus('approved');
            sessionStorage.setItem('deccan_access', phone);
            sessionStorage.setItem('deccan_name', p.new.guest_name || '');
            localStorage.removeItem('pending_phone');
            // Auto-navigate after celebration when coming from 'waiting'
            setTimeout(() => navigate('/menu'), 2500);
          } else if (p.new.status === 'rejected') {
            setStatus('rejected');
          }
        }).subscribe((status) => {
          console.log(`Realtime channel status for ${phone}:`, status);
        });
      
      interval = setInterval(async () => {
        const { data } = await supabase.from('access_requests').select('status').eq('phone_number', phone).maybeSingle();
        if (data?.status === 'approved') {
          setStatus('approved');
          sessionStorage.setItem('deccan_access', phone);
          sessionStorage.setItem('deccan_name', data.guest_name || '');
          localStorage.removeItem('pending_phone');
          clearInterval(interval);
          setTimeout(() => navigate('/menu'), 2500);
        } else if (data?.status === 'rejected') {
          setStatus('rejected');
          clearInterval(interval);
        }
      }, 3000);
    }
    return () => {
      if (channel) supabase.removeChannel(channel);
      if (interval) clearInterval(interval);
    };
  }, [status, phone, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !name) return;
    setLoading(true);
    try {
      const { data: existing } = await supabase.from('access_requests').select('*').eq('phone_number', phone).maybeSingle();
      
      if (existing) {
        await supabase.from('access_requests').update({ 
          status: 'pending', 
          guest_name: name,
          created_at: new Date().toISOString() 
        }).eq('phone_number', phone);
      } else {
        await supabase.from('access_requests').insert([{ 
          phone_number: phone, 
          guest_name: name,
          status: 'pending' 
        }]);
      }
      localStorage.removeItem('pending_phone');
      sessionStorage.setItem('active_phone', phone);
      sessionStorage.setItem('deccan_name', name);
      setStatus('waiting');
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleReset = () => {
    localStorage.removeItem('pending_phone');
    setStatus('idle');
    setPhone('');
    setName('');
  };

  return (
    <div className="min-h-screen bg-[#EDE8D0] text-[#2C1E0F] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-[#B8860B]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-[#B8860B]/10 rounded-full blur-[150px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm z-10">
        <div className="text-center mb-12">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-20 h-20 bg-[#2C1E0F] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl border-4 border-[#48401B] cursor-pointer"
            onClick={() => window.location.reload()}
          >
            <Castle className="w-10 h-10 text-[#B8860B]" />
          </motion.div>
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2">Deccan Catering</h1>
          <p className="text-[10px] text-[#B8860B] font-black uppercase tracking-[0.4em]">Request Entry Access</p>
        </div>

        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div 
              key="form" 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/70 backdrop-blur-xl p-10 rounded-[2.5rem] border border-[#48401B] shadow-2xl shadow-[#2C1E0F]/5"
            >
              <div className="mb-10 flex items-center gap-3">
                 <div className="w-1 h-8 bg-[#B8860B]" />
                 <h2 className="text-sm font-black uppercase tracking-widest text-[#2C1E0F]">Guest Registry</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#B8860B] uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C8BAA8]" />
                    <input autoFocus type="text" required placeholder="YOUR NAME" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#F7F3EE] p-5 pl-12 rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-[#B8860B]/30 transition-all placeholder:text-[#C8BAA8]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#B8860B] uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C8BAA8]" />
                    <input type="tel" required placeholder="MOBILE NUMBER" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-[#F7F3EE] p-5 pl-12 rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-[#B8860B]/30 transition-all placeholder:text-[#C8BAA8]" />
                  </div>
                </div>

                <button disabled={loading} className="w-full bg-[#2C1E0F] text-[#B8860B] py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl hover:bg-[#B8860B] hover:text-white group">
                  {loading ? 'Processing...' : 'Request Permission'} <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </form>
              
              <p className="mt-8 text-[8px] text-center text-[#73695F] font-medium uppercase tracking-widest leading-relaxed">By requesting, you agree to our <br/> selective catering access policy.</p>
            </motion.div>
          )}

          {status === 'waiting' && (
            <motion.div 
              key="waiting" 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/70 backdrop-blur-xl p-12 rounded-[2.5rem] border border-[#48401B] text-center shadow-2xl"
            >
              <div className="relative w-20 h-20 mx-auto mb-8">
                 <div className="absolute inset-0 border-4 border-[#B8860B]/10 rounded-full" />
                 <div className="absolute inset-0 border-4 border-t-[#B8860B] rounded-full animate-spin" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-[#B8860B]" />
                 </div>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Verification Pending</h3>
              <p className="text-[10px] text-[#73695F] font-black uppercase tracking-widest leading-relaxed mb-10">We are reviewing your catering access request.<br/>This page will update automatically.</p>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-center gap-3 py-4 px-6 bg-[#EDE8D0] rounded-2xl border border-[#B8860B]/10">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-[#2C1E0F]">Live Verification Active</span>
                </div>
                <button onClick={handleReset} className="text-[8px] font-black uppercase tracking-widest text-[#73695F] hover:text-[#2C1E0F] transition-colors">Cancel Request</button>
              </div>
            </motion.div>
          )}

          {status === 'approved' && (
            <motion.div 
              key="approved" 
              initial={{ opacity: 0, scale: 0.9, y: 30 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-2xl p-12 rounded-[3rem] border-4 border-green-500/50 text-center shadow-[0_32px_64px_-16px_rgba(34,197,94,0.3)] relative overflow-hidden"
            >
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/40 relative z-10"
              >
                 <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>
              
              <h3 className="text-3xl font-black uppercase tracking-tighter text-green-700 mb-2">Access Granted</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-green-600/60 mb-10">Welcome to the inner circle</p>
              
              <button 
                onClick={() => navigate('/menu')}
                className="w-full bg-[#2C1E0F] text-[#B8860B] py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all hover:bg-green-700 hover:text-white"
              >
                Enter Deccan Menu
              </button>
            </motion.div>
          )}

          {status === 'rejected' && (
            <motion.div 
              key="rejected" 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/70 backdrop-blur-xl p-12 rounded-[2.5rem] border border-red-500/30 text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
                 <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-red-600 mb-2">Access Denied</h3>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#73695F] mb-10">Your request was not approved at this time.</p>
              <button onClick={handleReset} className="w-full py-4 border-2 border-[#2C1E0F] text-[#2C1E0F] rounded-2xl font-black text-[10px] uppercase tracking-widest">Try Again</button>
            </motion.div>
          )}
        </AnimatePresence>

         <div className="mt-16 text-center">
            <button onClick={() => navigate('/login')} className="inline-flex items-center gap-3 px-8 py-4 border-2 border-[#48401B] rounded-2xl text-[9px] font-black uppercase text-[#48401B] tracking-[0.3em] hover:bg-[#48401B] hover:text-white transition-all shadow-lg active:scale-95">
              <ShieldCheck className="w-4 h-4" /> Management Login
            </button>
            <p className="mt-8 text-[7px] font-black uppercase tracking-[0.5em] text-[#B8860B] opacity-50">Premium Culinary Services</p>
         </div>
      </motion.div>
    </div>
  );
};

export default Landing;
