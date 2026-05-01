import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ease = [0.32, 0.72, 0, 1];

const SERVICES = [
  {
    key: 'instagram_followers',
    platform: 'instagram',
    serviceType: 'followers',
    label: 'Instagram Followers',
    shortLabel: 'IG Followers',
    inputLabel: 'Instagram Username',
    inputPlaceholder: '@yourusername',
    inputType: 'text',
    accentBg: 'bg-[#fdf2f8]',
    accentBorder: 'border-[#f9d0e8]',
    accentText: 'text-[#ee2a7b]',
    accentBtn: 'bg-[#ee2a7b] hover:bg-[#d91f6b]',
    defaultCost: 20,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    ),
  },
  {
    key: 'tiktok_likes',
    platform: 'tiktok',
    serviceType: 'likes',
    label: 'TikTok Likes',
    shortLabel: 'TT Likes',
    inputLabel: 'TikTok Post URL',
    inputPlaceholder: 'https://tiktok.com/@user/video/...',
    inputType: 'url',
    accentBg: 'bg-[#fff1f4]',
    accentBorder: 'border-[#ffd0d8]',
    accentText: 'text-[#ee1d52]',
    accentBtn: 'bg-[#ee1d52] hover:bg-[#cc1845]',
    defaultCost: 5,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    key: 'tiktok_views',
    platform: 'tiktok',
    serviceType: 'views',
    label: 'TikTok Views',
    shortLabel: 'TT Views',
    inputLabel: 'TikTok Post URL',
    inputPlaceholder: 'https://tiktok.com/@user/video/...',
    inputType: 'url',
    accentBg: 'bg-[#f0fafb]',
    accentBorder: 'border-[#c5edf0]',
    accentText: 'text-[#0a9ba6]',
    accentBtn: 'bg-[#0a9ba6] hover:bg-[#087f89]',
    defaultCost: 3,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    ),
  },
];

function CoinIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/><path d="M12 6v2m0 8v2M9 9h4a1 1 0 0 1 0 2H11a1 1 0 0 0 0 2h4"/>
    </svg>
  );
}

const COIN_PACKAGES = [
  { key: 'starter', coins: 100, usd: 2.99, label: 'Starter' },
  { key: 'popular', coins: 500, usd: 9.99, label: 'Popular', badge: 'Best value' },
  { key: 'pro', coins: 1500, usd: 24.99, label: 'Pro' },
  { key: 'whale', coins: 5000, usd: 69.99, label: 'Whale' },
];

const PRO_PLAN_LIST = [
  { key: 'monthly', usd: 4.99, label: 'Monthly', sub: '30 days' },
  { key: 'yearly', usd: 39.99, label: 'Yearly', sub: '365 days', badge: 'Save 33%' },
];

function CheckoutBaseDrawer({ title, subtitle, onClose, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.4, ease }}
        className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-1.5 bg-black/[0.04] border border-black/[0.06] rounded-[2rem]">
          <div className="bg-white rounded-[calc(2rem-6px)] p-6 md:p-7">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[1.1rem] font-extrabold tracking-tight">{title}</h2>
                {subtitle && <p className="text-[12px] text-[#999] mt-0.5">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f5f5f5] flex items-center justify-center hover:bg-[#ebebeb] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {children}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TopUpDrawer({ onClose }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');
  const buy = async (pkg) => {
    setLoading(pkg.key); setError('');
    try {
      const res = await axios.post('/api/payments/coins/checkout', { packageKey: pkg.key });
      if (res.data?.url) window.location.href = res.data.url;
      else setError('Could not create invoice');
    } catch (err) {
      setError(err.response?.data?.error || 'Checkout failed');
      setLoading(null);
    }
  };
  return (
    <CheckoutBaseDrawer title="Buy coins" subtitle="Pay with crypto via Heleket" onClose={onClose}>
      {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-[12px] text-red-600 font-medium mb-3">{error}</div>}
      <div className="flex flex-col gap-2">
        {COIN_PACKAGES.map(pkg => (
          <button key={pkg.key} onClick={() => buy(pkg)} disabled={loading !== null}
            className="flex items-center justify-between bg-black/[0.025] hover:bg-black/[0.04] border border-black/[0.06] rounded-2xl px-4 py-3.5 transition-colors disabled:opacity-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center text-amber-500">
                <CoinIcon size={16} />
              </div>
              <div className="text-left">
                <div className="text-[14px] font-extrabold tabular-nums flex items-center gap-2">
                  {pkg.coins.toLocaleString()} coins
                  {pkg.badge && <span className="text-[9px] font-bold uppercase tracking-[0.1em] bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">{pkg.badge}</span>}
                </div>
                <div className="text-[11px] text-[#aaa]">{pkg.label}</div>
              </div>
            </div>
            <div className="text-[15px] font-extrabold tabular-nums">
              {loading === pkg.key
                ? <span className="w-4 h-4 inline-block border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
                : `$${pkg.usd}`}
            </div>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-[#bbb] text-center mt-4">Coins land in your account after 1 confirmation</p>
    </CheckoutBaseDrawer>
  );
}

function ProDrawer({ onClose }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');
  const buy = async (plan) => {
    setLoading(plan.key); setError('');
    try {
      const res = await axios.post('/api/payments/pro/checkout', { plan: plan.key });
      if (res.data?.url) window.location.href = res.data.url;
      else setError('Could not create invoice');
    } catch (err) {
      setError(err.response?.data?.error || 'Checkout failed');
      setLoading(null);
    }
  };
  return (
    <CheckoutBaseDrawer title="Upgrade to Pro" subtitle="50% off all claim costs · forever discounts" onClose={onClose}>
      {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-[12px] text-red-600 font-medium mb-3">{error}</div>}
      <ul className="space-y-2 mb-5 text-[13px] text-[#444]">
        <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> All services cost <strong>half the coins</strong></li>
        <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Priority queue on SMM panel</li>
        <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Cancel anytime — runs out automatically</li>
      </ul>
      <div className="flex flex-col gap-2">
        {PRO_PLAN_LIST.map(plan => (
          <button key={plan.key} onClick={() => buy(plan)} disabled={loading !== null}
            className="flex items-center justify-between bg-black/[0.025] hover:bg-black/[0.04] border border-black/[0.06] rounded-2xl px-4 py-3.5 transition-colors disabled:opacity-50">
            <div className="text-left">
              <div className="text-[14px] font-extrabold flex items-center gap-2">
                {plan.label}
                {plan.badge && <span className="text-[9px] font-bold uppercase tracking-[0.1em] bg-sky-100 text-sky-700 rounded-full px-2 py-0.5">{plan.badge}</span>}
              </div>
              <div className="text-[11px] text-[#aaa]">{plan.sub}</div>
            </div>
            <div className="text-[15px] font-extrabold tabular-nums">
              {loading === plan.key
                ? <span className="w-4 h-4 inline-block border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
                : `$${plan.usd}`}
            </div>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-[#bbb] text-center mt-4">Crypto checkout via Heleket</p>
    </CheckoutBaseDrawer>
  );
}

function CouponDrawer({ onClose, onSuccess }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRedeem = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/coins/redeem', { code });
      onSuccess(res.data.coinsAdded, res.data.balance);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to redeem coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.4, ease }}
        className="w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-1.5 bg-black/[0.04] border border-black/[0.06] rounded-[2rem]">
          <div className="bg-white rounded-[calc(2rem-6px)] p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[1.1rem] font-extrabold tracking-tight">Redeem coupon</h2>
                <p className="text-[12px] text-[#999] mt-0.5">Enter your code to add coins</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f5f5f5] flex items-center justify-center hover:bg-[#ebebeb] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-[12px] text-red-600 font-medium mb-4">{error}</div>
            )}
            <form onSubmit={handleRedeem} className="flex flex-col gap-3">
              <div className="p-1 bg-black/[0.025] border border-black/[0.06] rounded-xl">
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  required
                  autoFocus
                  className="w-full bg-white rounded-[calc(0.75rem-4px)] px-4 py-3 text-[15px] font-mono font-bold tracking-[0.2em] outline-none placeholder:text-[#ccc] placeholder:tracking-normal placeholder:font-normal shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="w-full flex items-center justify-center gap-2 bg-[#0a0a0a] text-white font-semibold text-[14px] py-3.5 rounded-full hover:bg-sky-500 transition-colors duration-300 disabled:opacity-40"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><CoinIcon size={14} /> Redeem coins</>
                }
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user, logout, setUser } = useAuth();
  const [selected, setSelected] = useState(null);
  const [target, setTarget] = useState('');
  const [status, setStatus] = useState({ coins: 0, coinCosts: {}, dailyTaskDone: false, featuredAccount: null });
  const [claiming, setClaiming] = useState(false);
  const [toast, setToast] = useState(null);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showPro, setShowPro] = useState(false);
  const [history, setHistory] = useState([]);
  const claimFormRef = useRef(null);
  const inputRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    try {
      const [statusRes, historyRes] = await Promise.all([
        axios.get('/api/orders/status'),
        axios.get('/api/orders/history'),
      ]);
      setStatus(statusRes.data);
      if (setUser) setUser(u => ({ ...u, coins: statusRes.data.coins }));
      setHistory(historyRes.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    if (user && !user.igFollowCompleted) setShowFollowModal(true);
  }, [user]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCompleteFollow = async () => {
    try {
      await axios.post('/api/auth/complete-follow');
      setUser(u => ({ ...u, igFollowCompleted: true }));
      setShowFollowModal(false);
      showToast('Account unlocked! You can now claim.');
    } catch { showToast('Something went wrong', 'error'); }
  };

  const handleCompleteTask = async () => {
    try {
      const res = await axios.post('/api/orders/complete-daily-task');
      setStatus(s => ({ ...s, dailyTaskDone: true, coins: res.data.coins }));
      if (setUser) setUser(u => ({ ...u, coins: res.data.coins }));
      setShowTaskModal(false);
      showToast(`+${res.data.coinsEarned} coins earned!`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Something went wrong', 'error');
    }
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    if (!selected || !target.trim()) return;
    if (!user.igFollowCompleted) { setShowFollowModal(true); return; }

    const cost = status.coinCosts[selected.key] ?? selected.defaultCost;
    if (status.coins < cost) {
      showToast(`Need ${cost} coins — you have ${status.coins}`, 'error');
      return;
    }

    setClaiming(true);
    try {
      const res = await axios.post('/api/orders/claim', {
        platform: selected.platform,
        serviceType: selected.serviceType,
        target: target.trim(),
      });
      setStatus(s => ({ ...s, coins: res.data.coins }));
      if (setUser) setUser(u => ({ ...u, coins: res.data.coins }));
      showToast(`${res.data.quantity} ${selected.label} ordered!`);
      setTarget('');
      await fetchStatus();
    } catch (err) {
      showToast(err.response?.data?.error || 'Claim failed', 'error');
      if (err.response?.status === 402) await fetchStatus();
    } finally {
      setClaiming(false);
    }
  };

  const handleCouponSuccess = (coinsAdded, balance) => {
    setStatus(s => ({ ...s, coins: balance }));
    if (setUser) setUser(u => ({ ...u, coins: balance }));
    setShowCoupon(false);
    showToast(`+${coinsAdded} coins added!`);
  };

  const selectService = (svc) => {
    setSelected(svc);
    setTarget('');
    setTimeout(() => {
      claimFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTimeout(() => inputRef.current?.focus(), 300);
    }, 50);
  };

  const coins = status.coins;
  const minCost = Math.min(...SERVICES.map(s => status.coinCosts[s.key] ?? s.defaultCost));
  const isLow = coins < minCost;

  return (
    <div className="min-h-[100dvh] bg-[#f7f7f8] font-sans">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.4, ease }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-full shadow-lg text-[13px] font-semibold border whitespace-nowrap ${
              toast.type === 'error'
                ? 'bg-white border-red-100 text-red-600 shadow-red-100/50'
                : 'bg-white border-green-100 text-green-700 shadow-green-100/50'
            }`}
          >
            {toast.type === 'error'
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            }
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Follow Gate Modal */}
      <AnimatePresence>
        {showFollowModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.4, ease }} className="w-full max-w-sm">
              <div className="p-1.5 bg-black/[0.04] border border-black/[0.06] rounded-[2rem]">
                <div className="bg-white rounded-[calc(2rem-6px)] p-6 md:p-8 text-center">
                  <div className="w-14 h-14 bg-[#fdf2f8] border border-[#f9d0e8] rounded-2xl flex items-center justify-center mx-auto mb-5 text-[#ee2a7b]">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                    </svg>
                  </div>
                  <h2 className="text-[1.3rem] font-extrabold tracking-tight mb-2">One-time unlock</h2>
                  <p className="text-[14px] text-[#666] leading-relaxed mb-7">
                    Follow <strong>@lyrp.io</strong> on Instagram to activate your free claims.
                  </p>
                  <div className="flex flex-col gap-2.5">
                    <a href="https://instagram.com/lyrp.io" target="_blank" rel="noopener noreferrer"
                      className="block w-full text-center bg-[#ee2a7b] text-white font-semibold text-[14px] py-3.5 rounded-full hover:bg-[#d91f6b] transition-colors duration-300">
                      Follow @lyrp.io →
                    </a>
                    <button onClick={handleCompleteFollow}
                      className="w-full bg-[#f5f5f5] text-[#0a0a0a] font-semibold text-[14px] py-3.5 rounded-full hover:bg-[#ebebeb] transition-colors duration-300">
                      I've followed — Unlock ✓
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Task Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.4, ease }} className="w-full max-w-sm">
              <div className="p-1.5 bg-black/[0.04] border border-black/[0.06] rounded-[2rem]">
                <div className="bg-white rounded-[calc(2rem-6px)] p-6 md:p-8 text-center">
                  <div className="w-14 h-14 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5 text-amber-500">
                    <CoinIcon size={26} />
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-full px-3 py-1 mb-4">
                    <CoinIcon size={11} className="text-amber-500" />
                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-[0.12em]">+10 coins</span>
                  </div>
                  <h2 className="text-[1.3rem] font-extrabold tracking-tight mb-2">Earn today's coins</h2>
                  {status.featuredAccount && (
                    <p className="text-[14px] text-[#666] leading-relaxed mb-7">
                      Follow <strong className="text-[#0a0a0a]">@{status.featuredAccount.username}</strong> on{' '}
                      {status.featuredAccount.platform} to earn <strong>10 free coins</strong>.
                    </p>
                  )}
                  <div className="flex flex-col gap-2.5">
                    {status.featuredAccount?.url && (
                      <a href={status.featuredAccount.url} target="_blank" rel="noopener noreferrer"
                        className="block w-full text-center bg-sky-500 text-white font-semibold text-[14px] py-3.5 rounded-full hover:bg-sky-600 transition-colors duration-300">
                        Visit @{status.featuredAccount.username} →
                      </a>
                    )}
                    <button onClick={handleCompleteTask}
                      className="w-full bg-[#f5f5f5] text-[#0a0a0a] font-semibold text-[14px] py-3.5 rounded-full hover:bg-[#ebebeb] transition-colors duration-300">
                      Done — Claim 10 coins ✓
                    </button>
                    <button onClick={() => setShowTaskModal(false)} className="text-[13px] text-[#bbb] hover:text-[#888] transition-colors pt-1">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coupon Drawer */}
      <AnimatePresence>
        {showCoupon && <CouponDrawer onClose={() => setShowCoupon(false)} onSuccess={handleCouponSuccess} />}
      </AnimatePresence>

      {/* Top-up Drawer */}
      <AnimatePresence>
        {showTopUp && <TopUpDrawer onClose={() => setShowTopUp(false)} />}
      </AnimatePresence>

      {/* Pro Drawer */}
      <AnimatePresence>
        {showPro && <ProDrawer onClose={() => setShowPro(false)} />}
      </AnimatePresence>

      {/* ── Header ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-black/[0.05] px-4 py-3.5 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <span className="text-[15px] font-bold tracking-tight">lyrp.io</span>
          <div className="flex items-center gap-2">
            {/* Coin pill */}
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
              <CoinIcon size={12} className="text-amber-500" />
              <span className="text-[13px] font-extrabold text-amber-700 tabular-nums">{coins.toLocaleString()}</span>
            </div>
            <button onClick={logout}
              className="text-[12px] font-semibold text-[#888] hover:text-[#0a0a0a] bg-[#f5f5f5] hover:bg-[#ebebeb] px-3 py-1.5 rounded-full transition-colors">
              Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* ── Pro CTA / status ── */}
        {status.isPro ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}
            className="flex items-center justify-between bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] bg-sky-500 text-white rounded-full px-2 py-0.5">Pro</span>
              <span className="text-[12px] text-sky-700 font-semibold">50% off all claims · until {new Date(status.proUntil).toLocaleDateString()}</span>
            </div>
          </motion.div>
        ) : (
          <motion.button onClick={() => setShowPro(true)}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}
            className="w-full flex items-center justify-between bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 hover:border-sky-300 rounded-2xl px-4 py-3 transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] bg-sky-500 text-white rounded-full px-2 py-0.5">Pro</span>
              <span className="text-[12px] text-sky-700 font-semibold">Get Pro — claims cost <strong>half</strong> the coins</span>
            </div>
            <span className="text-sky-600 text-[12px] font-bold">From $4.99 →</span>
          </motion.button>
        )}

        {/* ── Balance card ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
          <div className={`p-1.5 rounded-[2rem] border transition-colors duration-500 ${isLow ? 'bg-red-500/[0.04] border-red-200' : 'bg-amber-500/[0.05] border-amber-200/60'}`}>
            <div className="bg-white rounded-[calc(2rem-6px)] p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-[#bbb] mb-1">Coin balance</p>
                  <div className="flex items-end gap-2">
                    <span className={`text-[2.8rem] font-extrabold tracking-tight leading-none tabular-nums ${isLow ? 'text-red-500' : 'text-amber-500'}`}>{coins}</span>
                    <span className="text-[14px] text-[#aaa] mb-1.5">coins</span>
                  </div>
                </div>
                {/* Earn actions */}
                <div className="flex flex-col items-end gap-2 mt-1">
                  {!status.dailyTaskDone && user?.igFollowCompleted && (
                    <button onClick={() => setShowTaskModal(true)}
                      className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-[12px] font-bold px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors whitespace-nowrap">
                      <CoinIcon size={11} className="text-amber-500" />
                      +10 daily
                    </button>
                  )}
                  {status.dailyTaskDone && (
                    <span className="flex items-center gap-1.5 bg-green-50 border border-green-100 text-green-600 text-[11px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Earned today
                    </span>
                  )}
                  <button onClick={() => setShowTopUp(true)}
                    className="flex items-center gap-1.5 bg-[#0a0a0a] text-white text-[12px] font-bold px-3 py-1.5 rounded-full hover:bg-sky-500 transition-colors whitespace-nowrap">
                    <CoinIcon size={11} />
                    Top up
                  </button>
                  <button onClick={() => setShowCoupon(true)}
                    className="flex items-center gap-1 text-sky-500 text-[12px] font-bold hover:text-sky-600 transition-colors">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                    Coupon
                  </button>
                </div>
              </div>

              {/* Affordability bar */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-black/[0.05]">
                {SERVICES.map(svc => {
                  const cost = status.coinCosts[svc.key] ?? svc.defaultCost;
                  const can = coins >= cost;
                  const claims = Math.floor(coins / cost);
                  return (
                    <button key={svc.key} onClick={() => can && selectService(svc)}
                      className={`rounded-xl p-2.5 text-center transition-all duration-300 ${can ? `${svc.accentBg} hover:scale-[1.03] cursor-pointer` : 'bg-[#f5f5f5] opacity-50 cursor-default'}`}>
                      <div className={`text-[1.1rem] font-extrabold tabular-nums ${can ? svc.accentText : 'text-[#ccc]'}`}>{claims}</div>
                      <div className="text-[10px] text-[#aaa] mt-0.5 leading-tight">{svc.shortLabel}</div>
                      <div className={`text-[10px] font-semibold mt-0.5 ${can ? svc.accentText : 'text-[#ccc]'}`}>{cost}c ea.</div>
                    </button>
                  );
                })}
              </div>

              {isLow && (
                <div className="mt-3 flex items-center gap-2 text-[12px] text-red-500 font-medium">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Not enough coins for any service.{' '}
                  <button onClick={() => !status.dailyTaskDone && user?.igFollowCompleted ? setShowTaskModal(true) : setShowCoupon(true)}
                    className="underline underline-offset-2 hover:text-red-600">
                    {!status.dailyTaskDone && user?.igFollowCompleted ? 'Earn daily coins' : 'Use a coupon'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Step 1: Choose a service ── */}
        <div>
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors duration-300 ${selected ? 'bg-green-500 text-white' : 'bg-[#0a0a0a] text-white'}`}>
              {selected
                ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                : '1'
              }
            </div>
            <span className="text-[12px] font-bold text-[#0a0a0a] uppercase tracking-[0.12em]">Choose a service</span>
            {selected && (
              <button onClick={() => setSelected(null)} className="ml-auto text-[11px] text-[#aaa] hover:text-[#666] transition-colors">
                Change
              </button>
            )}
          </div>

          {/* Mobile: horizontal scroll · Desktop: 3-col grid */}
          <div className="flex sm:grid sm:grid-cols-3 gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible snap-x snap-mandatory sm:snap-none">
            {SERVICES.map((svc, i) => {
              const cost = status.coinCosts[svc.key] ?? svc.defaultCost;
              const canAfford = coins >= cost;
              const isSelected = selected?.key === svc.key;
              return (
                <motion.button
                  key={svc.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease, delay: i * 0.07 }}
                  onClick={() => selectService(svc)}
                  className={`snap-start shrink-0 w-[68vw] sm:w-auto p-1.5 rounded-[1.5rem] border text-left transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    isSelected
                      ? 'bg-[#0a0a0a] border-[#0a0a0a] scale-[1.01]'
                      : canAfford
                      ? 'bg-black/[0.025] border-black/[0.05] hover:scale-[1.01] active:scale-[0.99]'
                      : 'bg-black/[0.015] border-black/[0.04] opacity-50'
                  }`}
                >
                  <div className={`rounded-[calc(1.5rem-6px)] p-4 ${isSelected ? 'bg-white/10' : svc.accentBg}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? 'bg-white/20 text-white' : `${svc.accentBg} border ${svc.accentBorder} ${svc.accentText}`}`}>
                        {svc.icon}
                      </div>
                      <span className={`text-[11px] font-bold rounded-full px-2.5 py-1 flex items-center gap-1 ${
                        isSelected ? 'bg-white/20 text-white' : canAfford ? 'bg-white text-[#0a0a0a]' : 'bg-red-50 text-red-400'
                      }`}>
                        <CoinIcon size={9} />{cost}
                      </span>
                    </div>
                    <div className={`text-[10px] uppercase tracking-[0.12em] font-bold mb-0.5 ${isSelected ? 'text-white/50' : svc.accentText}`}>{svc.platform}</div>
                    <div className={`text-[14px] font-extrabold tracking-tight ${isSelected ? 'text-white' : 'text-[#0a0a0a]'}`}>
                      {svc.serviceType.charAt(0).toUpperCase() + svc.serviceType.slice(1)}
                    </div>
                    <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-white/40' : 'text-[#bbb]'}`}>15 per claim</div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Connector ── */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              transition={{ duration: 0.3, ease }}
              style={{ transformOrigin: 'top' }}
              className="flex items-center gap-3 px-1"
            >
              <div className="flex flex-col items-center gap-0.5 ms-[6px]">
                <div className="w-px h-3 bg-black/10" />
                <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
                <div className="w-px h-3 bg-black/10" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Step 2: Claim form ── */}
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key={selected.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease }}
            >
              <div className="flex items-center gap-3 mb-3 px-1">
                <div className="w-5 h-5 rounded-full bg-[#0a0a0a] text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                <span className="text-[12px] font-bold text-[#0a0a0a] uppercase tracking-[0.12em]">Enter your details</span>
              </div>

              <div ref={claimFormRef} className="p-1.5 bg-black/[0.025] border border-black/[0.05] rounded-[2rem]">
                <form onSubmit={handleClaim} className="bg-white rounded-[calc(2rem-6px)] p-5 md:p-7">

                  {/* Selected service label */}
                  <div className={`flex items-center gap-2.5 ${selected.accentBg} border ${selected.accentBorder} rounded-2xl px-4 py-3 mb-5`}>
                    <span className={selected.accentText}>{selected.icon}</span>
                    <div>
                      <div className={`text-[12px] font-extrabold tracking-tight ${selected.accentText}`}>{selected.label}</div>
                      <div className="text-[11px] text-[#aaa]">15 units · {status.coinCosts[selected.key] ?? selected.defaultCost} coins</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mb-5">
                    <label className="text-[12px] font-semibold text-[#555] uppercase tracking-[0.1em]">
                      {selected.inputLabel}
                    </label>
                    <div className="p-1 bg-black/[0.025] border border-black/[0.06] rounded-xl">
                      <input
                        ref={inputRef}
                        type={selected.inputType === 'url' ? 'url' : 'text'}
                        value={target}
                        onChange={e => setTarget(e.target.value)}
                        placeholder={selected.inputPlaceholder}
                        required
                        className="w-full bg-white rounded-[calc(0.75rem-4px)] px-4 py-3 text-[14px] outline-none placeholder:text-[#ccc] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-300 focus:shadow-[inset_0_1px_2px_rgba(14,165,233,0.1),0_0_0_3px_rgba(14,165,233,0.08)]"
                      />
                    </div>
                  </div>

                  {(() => {
                    const cost = status.coinCosts[selected.key] ?? selected.defaultCost;
                    const canAfford = coins >= cost;
                    return (
                      <>
                        {!canAfford && (
                          <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-4">
                            <p className="text-[12px] font-semibold text-amber-800">Need {cost - coins} more coins</p>
                            <button type="button" onClick={() => setShowCoupon(true)}
                              className="text-[11px] font-bold text-amber-600 hover:text-amber-800 underline underline-offset-2 transition-colors">
                              Use coupon →
                            </button>
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={claiming || !canAfford}
                          className={`w-full flex items-center justify-center gap-3 text-white font-bold text-[14px] px-6 py-4 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${canAfford ? `${selected.accentBtn} shadow-[0_4px_20px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.18)]` : 'bg-[#ccc]'}`}
                        >
                          {claiming ? (
                            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          ) : !canAfford ? (
                            <><CoinIcon size={14} /> Not enough coins</>
                          ) : (
                            <>
                              Claim 15 {selected.serviceType}
                              <span className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1 text-[11px] font-bold">
                                <CoinIcon size={10} />{cost}
                              </span>
                            </>
                          )}
                        </button>
                      </>
                    );
                  })()}
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Order history ── */}
        {history.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: 0.1 }}>
            <div className="flex items-center gap-3 mb-3 px-1">
              <span className="text-[12px] font-bold text-[#0a0a0a] uppercase tracking-[0.12em]">Recent orders</span>
              <div className="flex-1 h-px bg-black/[0.06]" />
            </div>
            <div className="p-1.5 bg-black/[0.025] border border-black/[0.05] rounded-[2rem]">
              <div className="bg-white rounded-[calc(2rem-6px)] divide-y divide-black/[0.04]">
                {history.map((order, i) => (
                  <div key={order.id}
                    className={`flex items-center gap-3 px-4 py-3.5 ${i === 0 ? 'rounded-t-[calc(2rem-6px)]' : ''} ${i === history.length - 1 ? 'rounded-b-[calc(2rem-6px)]' : ''}`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${order.status === 'processing' ? 'bg-amber-400' : order.status === 'completed' ? 'bg-green-400' : 'bg-[#ddd]'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold capitalize">{order.platform} {order.service_type}</div>
                      <div className="text-[11px] text-[#bbb] truncate">{order.target}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-[11px] font-bold capitalize px-2 py-0.5 rounded-full ${order.status === 'processing' ? 'bg-amber-50 text-amber-600' : order.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-[#f5f5f5] text-[#aaa]'}`}>
                        {order.status}
                      </div>
                      <div className="text-[10px] text-[#ccc] mt-1">
                        {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Bottom padding for mobile */}
        <div className="h-4" />
      </main>
    </div>
  );
}
