import { useState, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const DAILY_USD = 10;

export default function Featured() {
  const [platform, setPlatform] = useState('instagram');
  const [username, setUsername] = useState('');
  const [url, setUrl] = useState('');
  const [days, setDays] = useState(7);
  const [startDate, setStartDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = useMemo(() => (days * DAILY_USD).toFixed(2), [days]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cleanUsername = username.trim().replace(/^@/, '');
      const res = await axios.post('/api/payments/featured/checkout', {
        platform, username: cleanUsername, url: url.trim(), days, startDate, email: email.trim(),
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setError('Could not start checkout. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#f7f7f8] font-sans">
      <header className="bg-white/80 backdrop-blur-md border-b border-black/[0.05] px-4 py-3.5 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-[15px] font-bold tracking-tight">lyrp.io</Link>
          <Link to="/dashboard" className="text-[12px] font-semibold text-[#888] hover:text-[#0a0a0a]">Dashboard →</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-full px-3 py-1 mb-3">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-[0.12em]">Featured slot</span>
          </div>
          <h1 className="text-[2rem] font-extrabold tracking-tight leading-tight">Get featured to all our users</h1>
          <p className="text-[14px] text-[#666] mt-2 leading-relaxed">
            Every user must follow / engage with the featured account daily to unlock their coins.
            That's <strong>real, daily traffic</strong> directly to your profile — only ${DAILY_USD}/day.
          </p>
        </div>

        <form onSubmit={submit} className="p-1.5 bg-black/[0.025] border border-black/[0.05] rounded-[2rem]">
          <div className="bg-white rounded-[calc(2rem-6px)] p-6 md:p-8 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-[12px] text-red-600 font-medium">{error}</div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2 block">Platform</label>
              <div className="grid grid-cols-2 gap-2">
                {['instagram', 'tiktok'].map(p => (
                  <button key={p} type="button" onClick={() => setPlatform(p)}
                    className={`py-3 rounded-xl text-[13px] font-bold capitalize border transition-colors ${
                      platform === p ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]' : 'bg-white text-[#666] border-black/[0.08] hover:bg-black/[0.025]'
                    }`}>{p}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2 block">Username</label>
              <div className="p-1 bg-black/[0.025] border border-black/[0.06] rounded-xl">
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
                  placeholder="yourbrand"
                  className="w-full bg-white rounded-[calc(0.75rem-4px)] px-4 py-3 text-[14px] outline-none placeholder:text-[#ccc]" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2 block">Profile URL (optional)</label>
              <div className="p-1 bg-black/[0.025] border border-black/[0.06] rounded-xl">
                <input type="url" value={url} onChange={e => setUrl(e.target.value)}
                  placeholder="https://instagram.com/yourbrand"
                  className="w-full bg-white rounded-[calc(0.75rem-4px)] px-4 py-3 text-[14px] outline-none placeholder:text-[#ccc]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2 block">Days (1–30)</label>
                <div className="p-1 bg-black/[0.025] border border-black/[0.06] rounded-xl">
                  <input type="number" min="1" max="30" value={days} onChange={e => setDays(parseInt(e.target.value, 10) || 1)} required
                    className="w-full bg-white rounded-[calc(0.75rem-4px)] px-4 py-3 text-[14px] outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2 block">Start date</label>
                <div className="p-1 bg-black/[0.025] border border-black/[0.06] rounded-xl">
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required
                    className="w-full bg-white rounded-[calc(0.75rem-4px)] px-4 py-3 text-[14px] outline-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-2 block">Contact email</label>
              <div className="p-1 bg-black/[0.025] border border-black/[0.06] rounded-xl">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@example.com"
                  className="w-full bg-white rounded-[calc(0.75rem-4px)] px-4 py-3 text-[14px] outline-none placeholder:text-[#ccc]" />
              </div>
            </div>

            <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
              <span className="text-[12px] font-semibold text-amber-800">{days} day{days > 1 ? 's' : ''} × ${DAILY_USD}</span>
              <span className="text-[1.4rem] font-extrabold text-amber-700 tabular-nums">${total}</span>
            </div>

            <button type="submit" disabled={loading || !username || !email}
              className="w-full flex items-center justify-center gap-2 bg-[#0a0a0a] text-white font-semibold text-[14px] py-3.5 rounded-full hover:bg-sky-500 transition-colors duration-300 disabled:opacity-40">
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <>Pay ${total} with Heleket →</>
              }
            </button>
            <p className="text-[11px] text-[#bbb] text-center">Secure crypto checkout — Bitcoin, USDT, ETH and more</p>
          </div>
        </form>
      </main>
    </div>
  );
}
