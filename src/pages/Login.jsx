import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, AlertCircle, ArrowLeft, Castle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) navigate('/admin-dashboard');
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!supabase) {
      setError('Supabase connection not configured. Please check .env file.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      // Direct restoration to the management dashboard
      navigate('/admin-dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#EDE8D0] flex items-center justify-center p-6 relative overflow-hidden font-body-md">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#B8860B]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#B8860B]/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-white/80 border border-[#48401B] rounded-[2.5rem] p-12 shadow-3xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#B8860B] to-transparent opacity-40" />
          
          <button 
            onClick={() => navigate('/')}
            className="absolute top-8 left-8 p-2 text-[#73695F] hover:text-[#B8860B] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="text-center mb-12">
            <div 
              className="inline-flex p-5 rounded-2xl bg-[#B8860B]/10 mb-6 border border-[#B8860B]/20 cursor-pointer active:scale-95 transition-all"
              onClick={() => navigate('/')}
            >
              <Castle className="w-10 h-10 text-[#B8860B]" />
            </div>
            <h1 className="text-3xl font-bold text-[#2C1E0F] mb-2 uppercase tracking-tight">Admin Gate</h1>
            <p className="text-[#73695F] text-xs font-black uppercase tracking-[0.2em]">Restricted Entrance</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[#B8860B] tracking-widest uppercase ml-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#E5D5C5]" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@deccancatering.com"
                  className="w-full bg-[#FCF9F3] border border-[#E5D5C5] rounded-2xl py-5 pl-14 pr-6 text-[#2C1E0F] placeholder-[#E5D5C5] focus:border-[#B8860B] outline-none transition-all text-sm font-bold"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-[#B8860B] tracking-widest uppercase ml-1 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#E5D5C5]" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#FCF9F3] border border-[#E5D5C5] rounded-2xl py-5 pl-14 pr-6 text-[#2C1E0F] placeholder-[#E5D5C5] focus:border-[#B8860B] outline-none transition-all text-sm font-bold"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-5 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-xs font-bold"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-[#2C1E0F] text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.3em] hover:bg-[#B8860B] transition-all flex items-center justify-center gap-3"
            >
              {loading ? 'Verifying...' : 'Authorize Entrance'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
