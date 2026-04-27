import { useEffect, useState } from 'react';
import axios from 'axios';

function getAdminHeaders() {
  return { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } };
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: '', coins: '', max_uses: '1', expires_at: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/coupons', getAdminHeaders());
      setCoupons(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post('/api/admin/coupons', {
        code: form.code,
        coins: parseInt(form.coins),
        max_uses: parseInt(form.max_uses) || 1,
        expires_at: form.expires_at || null,
      }, getAdminHeaders());
      setForm({ code: '', coins: '', max_uses: '1', expires_at: '' });
      showToast('Coupon created!');
      fetchCoupons();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create coupon');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    await axios.delete(`/api/admin/coupons/${id}`, getAdminHeaders());
    fetchCoupons();
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setForm(f => ({ ...f, code }));
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-[1.6rem] font-extrabold tracking-tight">Coupons</h1>
        <p className="text-[14px] text-[#999] mt-1">Create codes that add coins to user balances.</p>
      </div>

      {toast && (
        <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-3 text-[13px] font-semibold text-green-700 mb-6">{toast}</div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Create form */}
        <div className="p-1.5 bg-black/[0.025] border border-black/[0.05] rounded-[2rem]">
          <form onSubmit={handleCreate} className="bg-white rounded-[calc(2rem-6px)] p-6 md:p-8 flex flex-col gap-5">
            <h2 className="text-[15px] font-bold">New coupon</h2>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold text-[#666] uppercase tracking-[0.1em]">Code</label>
              <div className="flex gap-2">
                <div className="p-1 bg-black/[0.025] border border-black/[0.06] rounded-xl flex-1">
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="LAUNCH50"
                    required
                    className="w-full bg-white rounded-[calc(0.75rem-4px)] px-4 py-2.5 text-[14px] font-mono font-semibold tracking-widest outline-none placeholder:tracking-normal placeholder:font-normal shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                  />
                </div>
                <button type="button" onClick={generateCode}
                  className="shrink-0 px-4 py-2.5 bg-[#f5f5f5] text-[12px] font-semibold rounded-xl hover:bg-[#ebebeb] transition-colors">
                  Generate
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold text-[#666] uppercase tracking-[0.1em]">Coins value</label>
                <div className="p-1 bg-black/[0.025] border border-black/[0.06] rounded-xl">
                  <input
                    type="number"
                    value={form.coins}
                    onChange={e => setForm(f => ({ ...f, coins: e.target.value }))}
                    placeholder="100"
                    min="1"
                    required
                    className="w-full bg-white rounded-[calc(0.75rem-4px)] px-4 py-2.5 text-[14px] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold text-[#666] uppercase tracking-[0.1em]">Max uses</label>
                <div className="p-1 bg-black/[0.025] border border-black/[0.06] rounded-xl">
                  <input
                    type="number"
                    value={form.max_uses}
                    onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                    min="1"
                    className="w-full bg-white rounded-[calc(0.75rem-4px)] px-4 py-2.5 text-[14px] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold text-[#666] uppercase tracking-[0.1em]">Expires at <span className="normal-case font-normal text-[#bbb]">(optional)</span></label>
              <div className="p-1 bg-black/[0.025] border border-black/[0.06] rounded-xl">
                <input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                  className="w-full bg-white rounded-[calc(0.75rem-4px)] px-4 py-2.5 text-[14px] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                />
              </div>
            </div>

            <button type="submit" disabled={saving}
              className="flex items-center justify-center gap-2 bg-[#0a0a0a] text-white font-semibold text-[14px] py-3.5 rounded-full hover:bg-sky-500 transition-colors duration-300 disabled:opacity-50 mt-1">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create coupon'}
            </button>
          </form>
        </div>

        {/* Info */}
        <div className="p-1.5 bg-amber-500/[0.06] border border-amber-500/15 rounded-[2rem]">
          <div className="bg-white rounded-[calc(2rem-6px)] p-6 md:p-8 flex flex-col gap-4">
            <h2 className="text-[15px] font-bold">Coupon strategy</h2>
            {[
              { title: 'Viral giveaway', coins: '200 coins', desc: 'Post on TikTok/IG: "Comment + follow for a 200-coin code." Hand-issue codes to commenters.', color: 'text-sky-600' },
              { title: 'Referral reward', coins: '50 coins', desc: 'DM a coupon to every user who refers a friend. Trackable via unique codes.', color: 'text-purple-600' },
              { title: 'Creator collab', coins: '100 coins', desc: 'Give a bulk code (100 max_uses) to a micro-influencer for their audience.', color: 'text-green-600' },
              { title: 'Win-back', coins: '150 coins', desc: 'Email inactive users with a timed coupon (expires 7 days). Re-activates churned accounts.', color: 'text-amber-600' },
            ].map(({ title, coins, desc, color }) => (
              <div key={title} className="p-4 bg-[#fafafa] rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[12px] font-bold ${color}`}>{title}</span>
                  <span className="text-[11px] font-semibold text-[#aaa] bg-white border border-black/[0.06] px-2 py-0.5 rounded-full">{coins}</span>
                </div>
                <p className="text-[12px] text-[#777] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Coupon list */}
      <div className="p-1.5 bg-black/[0.025] border border-black/[0.05] rounded-[2rem]">
        <div className="bg-white rounded-[calc(2rem-6px)] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.05]">
                  {['Code', 'Coins', 'Uses', 'Expires', ''].map(h => (
                    <th key={h} className={`text-left px-5 py-4 text-[11px] font-semibold text-[#aaa] uppercase tracking-[0.1em] ${h === 'Expires' ? 'hidden md:table-cell' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.map((c, i) => (
                  <tr key={c.id} className={`border-b border-black/[0.04] last:border-0 ${i % 2 === 0 ? '' : 'bg-[#fafafa]'}`}>
                    <td className="px-5 py-4">
                      <span className="text-[13px] font-mono font-bold tracking-widest">{c.code}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[13px] font-bold text-amber-600">{c.coins}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[12px] font-semibold ${c.used_count >= c.max_uses ? 'text-red-400' : 'text-[#0a0a0a]'}`}>
                        {c.used_count}/{c.max_uses}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[12px] text-[#aaa] hidden md:table-cell">
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => handleDelete(c.id)}
                        className="text-[12px] text-red-400 hover:text-red-600 font-medium transition-colors">Delete</button>
                    </td>
                  </tr>
                ))}
                {coupons.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-[14px] text-[#aaa]">No coupons yet</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
