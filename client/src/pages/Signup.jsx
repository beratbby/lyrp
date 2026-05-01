import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/I18nContext';

const ease = [0.32, 0.72, 0, 1];

export default function Signup() {
  const { login } = useAuth();
  const { t } = useT();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/signup', form);
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || t.auth.signupBtn + ' failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-white font-sans flex flex-col">
      <nav className="px-6 py-5 flex items-center justify-between border-b border-black/[0.05]">
        <Link to="/" className="text-[15px] font-bold tracking-tight text-[#0a0a0a]">{t.nav.logo}</Link>
        <Link to="/login" className="text-[13px] font-medium text-[#888] hover:text-[#0a0a0a] transition-colors">
          {t.auth.haveAccountNav}
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease }}
          className="w-full max-w-sm"
        >
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-100 rounded-full px-3 py-1 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-sky-600">{t.auth.signupBadge}</span>
            </div>
            <h1 className="text-[2.2rem] font-extrabold tracking-[-0.025em] leading-[1.1]">{t.auth.signupTitle}</h1>
            <p className="text-[14px] text-[#888] mt-2">{t.auth.signupSub}</p>
          </div>

          <div className="p-1.5 bg-black/[0.025] border border-black/[0.05] rounded-[2rem]">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-[calc(2rem-6px)] p-6 md:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] flex flex-col gap-5"
            >
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-[13px] text-red-600 font-medium">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-semibold text-[#444] uppercase tracking-[0.1em]">{t.auth.emailLabel}</label>
                <div className="p-1 bg-black/[0.025] border border-black/[0.06] rounded-xl">
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-white rounded-[calc(0.75rem-4px)] px-4 py-3 text-[14px] outline-none placeholder:text-[#bbb] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-300 focus:shadow-[inset_0_1px_2px_rgba(14,165,233,0.1),0_0_0_3px_rgba(14,165,233,0.08)]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-semibold text-[#444] uppercase tracking-[0.1em]">{t.auth.passwordLabel}</label>
                <div className="p-1 bg-black/[0.025] border border-black/[0.06] rounded-xl">
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder={t.auth.passwordPlaceholder}
                    required
                    className="w-full bg-white rounded-[calc(0.75rem-4px)] px-4 py-3 text-[14px] outline-none placeholder:text-[#bbb] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-300 focus:shadow-[inset_0_1px_2px_rgba(14,165,233,0.1),0_0_0_3px_rgba(14,165,233,0.08)]"
                  />
                </div>
              </div>

              <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
                <p className="text-[12px] text-sky-700 leading-relaxed">
                  {t.auth.followNote}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex items-center justify-center gap-3 bg-[#0a0a0a] text-white font-semibold text-[14px] px-6 py-4 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-sky-500 hover:shadow-[0_8px_24px_rgba(14,165,233,0.3)] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {t.auth.signupBtn}
                    <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center transition-all duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105">
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M2 9L9 2M9 2H3.5M9 2V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-[13px] text-[#999] mt-6">
            {t.auth.alreadyHave}{' '}
            <Link to="/login" className="text-sky-500 font-semibold hover:text-sky-600 transition-colors">
              {t.nav.login}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
