import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminFeatured() {
  const [form, setForm] = useState({ platform: 'instagram', username: '', url: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    axios.get('/api/admin/stats').then(res => {
      if (res.data.featuredAccount) {
        const fa = res.data.featuredAccount;
        setForm({ platform: fa.platform || 'instagram', username: fa.username || '', url: fa.url || '' });
      }
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put('/api/admin/featured', form);
      setToast('Featured account updated!');
      setTimeout(() => setToast(''), 3000);
    } catch {
      setToast('Failed to save');
      setTimeout(() => setToast(''), 3000);
    } finally { setSaving(false); }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-[1.6rem] font-extrabold tracking-tight">Featured Slot</h1>
        <p className="text-[14px] text-[#999] mt-1">The account users must follow/engage with each day to unlock claims.</p>
      </div>

      {toast && (
        <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-3 text-[13px] font-semibold text-green-700 mb-6">{toast}</div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-1.5 bg-black/[0.025] border border-black/[0.05] rounded-[2rem]">
          <form onSubmit={handleSave} className="bg-white rounded-[calc(2rem-6px)] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] flex flex-col gap-5">
            <h2 className="text-[15px] font-bold">Current featured account</h2>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold text-[#666] uppercase tracking-[0.1em]">Platform</label>
              <div className="p-1 bg-black/[0.025] border border-black/[0.06] rounded-xl">
                <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                  className="w-full bg-white rounded-[calc(0.75rem-4px)] px-4 py-3 text-[14px] outline-none">
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold text-[#666] uppercase tracking-[0.1em]">Username</label>
              <div className="p-1 bg-black/[0.025] border border-black/[0.06] rounded-xl">
                <input type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required
                  placeholder="e.g. lyrp.io"
                  className="w-full bg-white rounded-[calc(0.75rem-4px)] px-4 py-3 text-[14px] outline-none placeholder:text-[#bbb] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold text-[#666] uppercase tracking-[0.1em]">Profile URL</label>
              <div className="p-1 bg-black/[0.025] border border-black/[0.06] rounded-xl">
                <input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://instagram.com/lyrp.io"
                  className="w-full bg-white rounded-[calc(0.75rem-4px)] px-4 py-3 text-[14px] outline-none placeholder:text-[#bbb] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]" />
              </div>
            </div>

            <button type="submit" disabled={saving}
              className="flex items-center justify-center gap-2 bg-[#0a0a0a] text-white font-semibold text-[14px] py-3.5 rounded-full hover:bg-sky-500 transition-colors duration-300 disabled:opacity-50 mt-2">
              {saving ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save featured account'}
            </button>
          </form>
        </div>

        {/* Revenue tracker */}
        <div className="p-1.5 bg-sky-500/[0.06] border border-sky-500/15 rounded-[2rem]">
          <div className="bg-white rounded-[calc(2rem-6px)] p-8 shadow-[inset_0_1px_1px_rgba(14,165,233,0.05)] flex flex-col gap-5">
            <h2 className="text-[15px] font-bold">Revenue tracking</h2>
            <p className="text-[13px] text-[#777] leading-relaxed">
              Sell featured slots to other creators. Every user sees and engages with the featured account daily.
            </p>
            <div className="flex flex-col gap-3">
              {[['Daily slot', '$15/day', 'Typically 100–500 new followers'], ['Weekly slot', '$70/week', 'Best value — save $35 vs daily'], ['Monthly slot', '$250/month', 'Exclusive — maximum exposure']].map(([plan, price, note]) => (
                <div key={plan} className="flex items-center justify-between p-4 bg-[#fafafa] rounded-2xl">
                  <div>
                    <div className="text-[13px] font-bold">{plan}</div>
                    <div className="text-[12px] text-[#aaa]">{note}</div>
                  </div>
                  <span className="text-[14px] font-extrabold text-sky-500">{price}</span>
                </div>
              ))}
            </div>
            <a href="mailto:abdelsalemcali@gmail.com" className="text-center block bg-sky-50 text-sky-600 font-semibold text-[13px] py-3 rounded-full hover:bg-sky-100 transition-colors">
              Forward inquiries to your email →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
