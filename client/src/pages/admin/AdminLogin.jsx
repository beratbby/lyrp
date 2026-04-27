import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

const ease = [0.32, 0.72, 0, 1];

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/login', form);
      localStorage.setItem('admin_token', res.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] font-sans flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-10">
          <span className="text-white font-bold text-[1.2rem] tracking-tight">lyrp.io</span>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 mt-3">
            <span className="text-[11px] uppercase tracking-[0.15em] font-semibold text-white/40">Admin Panel</span>
          </div>
        </div>

        <div className="p-1.5 bg-white/5 border border-white/10 rounded-[2rem]">
          <form onSubmit={handleSubmit} className="bg-white/[0.03] rounded-[calc(2rem-6px)] p-8 flex flex-col gap-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-[13px] text-red-400 font-medium">{error}</div>
            )}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.1em]">Email</label>
              <div className="p-1 bg-white/5 border border-white/10 rounded-xl">
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
                  className="w-full bg-transparent rounded-[calc(0.75rem-4px)] px-4 py-3 text-[14px] text-white outline-none placeholder:text-white/20"
                  placeholder="admin@lyrp.io" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.1em]">Password</label>
              <div className="p-1 bg-white/5 border border-white/10 rounded-xl">
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required
                  className="w-full bg-transparent rounded-[calc(0.75rem-4px)] px-4 py-3 text-[14px] text-white outline-none placeholder:text-white/20"
                  placeholder="••••••••" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="flex items-center justify-center gap-2 bg-sky-500 text-white font-semibold text-[14px] py-4 rounded-full hover:bg-sky-400 transition-colors duration-300 disabled:opacity-50 mt-2">
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Enter Admin Panel'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
